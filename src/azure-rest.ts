import { XMLParser } from "fast-xml-parser";

export interface AzureCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  storageAccount: string;
}

interface TokenCacheItem {
  token: string;
  expiresAt: number; // Unix timestamp in ms
}

// Cache em memória para tokens OAuth2 por clientId
const tokenCache = new Map<string, TokenCacheItem>();

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: true,
  trimValues: true,
});

export class AzureRestClient {
  private creds: AzureCredentials;
  private baseUrl: string;

  constructor(creds: AzureCredentials) {
    this.creds = creds;
    this.baseUrl = `https://${creds.storageAccount}.blob.core.windows.net`;
  }

  /**
   * Obtém token OAuth2 no Entra ID com reutilização de cache.
   */
  async getAccessToken(): Promise<string> {
    const cacheKey = `${this.creds.tenantId}:${this.creds.clientId}`;
    const cached = tokenCache.get(cacheKey);

    // Reutiliza o token se faltar mais de 5 minutos para expirar
    if (cached && cached.expiresAt > Date.now() + 300_000) {
      return cached.token;
    }

    const tokenUrl = `https://login.microsoftonline.com/${this.creds.tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.creds.clientId,
      client_secret: this.creds.clientSecret,
      scope: "https://storage.azure.com/.default",
    });

    const resp = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Falha na autenticação com Microsoft Entra ID (${resp.status}): ${errorText}`);
    }

    const data: any = await resp.json();
    const token = data.access_token as string;
    const expiresInSec = (data.expires_in as number) || 3600;

    tokenCache.set(cacheKey, {
      token,
      expiresAt: Date.now() + expiresInSec * 1000,
    });

    return token;
  }

  /**
   * Headers padrão para a API REST do Azure Blob
   */
  private async getHeaders(extraHeaders: Record<string, string> = {}): Promise<Headers> {
    const token = await this.getAccessToken();
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("x-ms-version", "2023-11-03");
    headers.set("x-ms-date", new Date().toUTCString());

    for (const [key, value] of Object.entries(extraHeaders)) {
      headers.set(key, value);
    }
    return headers;
  }

  /**
   * Valida a conexão testando a obtenção do token e listando os containers da conta.
   */
  async testConnection(): Promise<{ success: boolean; message: string; containers?: string[] }> {
    try {
      await this.getAccessToken();
      const containers = await this.listContainers([]);
      if (containers.length > 0) {
        return {
          success: true,
          message: `Conexão bem-sucedida! ${containers.length} container(s) detectado(s): ${containers.join(", ")}`,
          containers,
        };
      }
      return {
        success: true,
        message: "Autenticação com Microsoft Entra ID realizada com sucesso!",
        containers: [],
      };
    } catch (err: any) {
      return { success: false, message: err.message || String(err) };
    }
  }

  /**
   * Lista containers disponíveis na Storage Account via Azure REST API.
   * Faz fallback para a lista manual caso a listagem global não tenha permissão na conta.
   */
  async listContainers(fallbackList: string[] = []): Promise<string[]> {
    try {
      const headers = await this.getHeaders();
      const url = `${this.baseUrl}/?comp=list`;
      const resp = await fetch(url, { headers });

      if (resp.ok) {
        const xmlText = await resp.text();
        const parsed = xmlParser.parse(xmlText);
        const containerItems = parsed?.EnumerationResults?.Containers?.Container;

        if (containerItems) {
          const list = Array.isArray(containerItems) ? containerItems : [containerItems];
          const found = list.map((c: any) => c.Name).filter(Boolean);
          if (found.length > 0) {
            return found;
          }
        }
      }
    } catch {
      // Caso não tenha permissão de listar a conta inteira, usa o fallback manual
    }
    return fallbackList;
  }

  /**
   * Lista diretórios e arquivos em uma pasta/prefixo
   */
  async listDirectory(container: string, prefix: string = ""): Promise<{
    prefix: string;
    folders: { name: string; fullPath: string }[];
    files: { name: string; fullPath: string; size: number; lastModified: string; contentType?: string }[];
  }> {
    if (prefix && !prefix.endsWith("/")) {
      prefix += "/";
    }

    const headers = await this.getHeaders();
    const url = new URL(`${this.baseUrl}/${encodeURIComponent(container)}`);
    url.searchParams.set("restype", "container");
    url.searchParams.set("comp", "list");
    url.searchParams.set("delimiter", "/");
    if (prefix) {
      url.searchParams.set("prefix", prefix);
    }

    const resp = await fetch(url.toString(), { headers });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Erro ao listar container '${container}' (${resp.status}): ${errText}`);
    }

    const xmlText = await resp.text();
    const parsed = xmlParser.parse(xmlText);
    const blobsNode = parsed?.EnumerationResults?.Blobs;

    const folders: { name: string; fullPath: string }[] = [];
    const files: { name: string; fullPath: string; size: number; lastModified: string; contentType?: string }[] = [];

    // Pastas Virtuais (BlobPrefix)
    if (blobsNode?.BlobPrefix) {
      const prefixItems = Array.isArray(blobsNode.BlobPrefix) ? blobsNode.BlobPrefix : [blobsNode.BlobPrefix];
      for (const item of prefixItems) {
        const fullPath = item?.Name;
        if (fullPath) {
          const displayName = fullPath.slice(prefix.length).replace(/\/$/, "");
          folders.push({ name: displayName, fullPath });
        }
      }
    }

    // Arquivos (Blob)
    if (blobsNode?.Blob) {
      const blobItems = Array.isArray(blobsNode.Blob) ? blobsNode.Blob : [blobsNode.Blob];
      for (const b of blobItems) {
        const fullPath = b?.Name;
        if (!fullPath || fullPath === prefix) continue;

        const displayName = fullPath.slice(prefix.length);
        if (!displayName) continue;

        // Ocultar marcadores internos de pasta (.keep)
        if (displayName === ".keep" || displayName.endsWith("/.keep")) {
          continue;
        }

        const size = Number(b?.Properties?.["Content-Length"] || 0);
        const lastModified = b?.Properties?.["Last-Modified"] || "";
        const contentType = b?.Properties?.["Content-Type"];

        files.push({
          name: displayName,
          fullPath,
          size,
          lastModified,
          contentType,
        });
      }
    }

    folders.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));

    return { prefix, folders, files };
  }

  /**
   * Faz o stream de download de um blob (ou com range para preview)
   */
  async downloadBlobStream(container: string, blobName: string, range?: string): Promise<Response> {
    const extraHeaders: Record<string, string> = {};
    if (range) {
      extraHeaders["Range"] = range;
    }

    const headers = await this.getHeaders(extraHeaders);
    // Preserva as barras no nome do blob
    const encodedBlob = blobName.split("/").map(encodeURIComponent).join("/");
    const url = `${this.baseUrl}/${encodeURIComponent(container)}/${encodedBlob}`;

    const resp = await fetch(url, { headers });
    if (!resp.ok && resp.status !== 206) {
      const err = await resp.text();
      throw new Error(`Erro ao baixar blob (${resp.status}): ${err}`);
    }
    return resp;
  }

  /**
   * Upload de um arquivo
   */
  async uploadBlob(
    container: string,
    blobName: string,
    body: ReadableStream | ArrayBuffer | Uint8Array,
    contentType: string = "application/octet-stream"
  ): Promise<void> {
    const headers = await this.getHeaders({
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": contentType,
    });

    const encodedBlob = blobName.split("/").map(encodeURIComponent).join("/");
    const url = `${this.baseUrl}/${encodeURIComponent(container)}/${encodedBlob}`;

    const resp = await fetch(url, {
      method: "PUT",
      headers,
      body,
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Erro ao enviar arquivo (${resp.status}): ${err}`);
    }
  }

  /**
   * Exclui um diretório no Azure Data Lake Storage Gen2 (HNS) usando a DFS REST API
   */
  async deleteDfsPath(container: string, path: string): Promise<boolean> {
    try {
      const cleanPath = path.replace(/^\/+|\/+$/g, "");
      if (!cleanPath) return false;

      const encodedPath = cleanPath.split("/").map(encodeURIComponent).join("/");
      let continuationToken: string | null = null;
      let success = false;

      do {
        const headers = await this.getHeaders();
        const url = new URL(`https://${this.creds.storageAccount}.dfs.core.windows.net/${encodeURIComponent(container)}/${encodedPath}`);
        url.searchParams.set("recursive", "true");
        if (continuationToken) {
          url.searchParams.set("continuation", continuationToken);
        }

        const resp = await fetch(url.toString(), {
          method: "DELETE",
          headers,
        });

        if (resp.ok || resp.status === 404) {
          success = true;
          continuationToken = resp.headers.get("x-ms-continuation");
        } else {
          break;
        }
      } while (continuationToken);

      return success;
    } catch {
      return false;
    }
  }

  /**
   * Cria uma pasta virtual ou diretório nativo no ADLS Gen2
   */
  async createFolder(container: string, folderPath: string): Promise<void> {
    const cleanPath = folderPath.replace(/^\/+|\/+$/g, "");
    if (!cleanPath) return;

    // 1. Tentar criar como diretório nativo no ADLS Gen2 (DFS API)
    try {
      const headers = await this.getHeaders();
      const encodedPath = cleanPath.split("/").map(encodeURIComponent).join("/");
      const dfsUrl = `https://${this.creds.storageAccount}.dfs.core.windows.net/${encodeURIComponent(container)}/${encodedPath}?resource=directory`;

      const resp = await fetch(dfsUrl, {
        method: "PUT",
        headers,
      });

      if (resp.ok) {
        return;
      }
    } catch {
      // Fallback para Blob Storage padrão
    }

    // 2. Fallback: marcador .keep para Storage padrão (sem HNS)
    const markerName = `${cleanPath}/.keep`;
    await this.uploadBlob(container, markerName, new Uint8Array(0));
  }

  /**
   * Exclui um blob
   */
  async deleteBlob(container: string, blobName: string): Promise<void> {
    const headers = await this.getHeaders();
    const encodedBlob = blobName.split("/").map(encodeURIComponent).join("/");
    const url = `${this.baseUrl}/${encodeURIComponent(container)}/${encodedBlob}`;

    const resp = await fetch(url, {
      method: "DELETE",
      headers,
    });

    if (!resp.ok && resp.status !== 404) {
      const err = await resp.text();
      throw new Error(`Erro ao excluir blob (${resp.status}): ${err}`);
    }
  }

  /**
   * Exclui recursivamente todos os blobs sob um prefixo de pasta virtual e o diretório no ADLS Gen2
   */
  async deleteFolder(container: string, folderPath: string): Promise<number> {
    const cleanPath = folderPath.replace(/^\/+|\/+$/g, "");
    if (!cleanPath) return 0;

    let deletedCount = 0;

    // 1. Tentar exclusão atômica recursiva no Azure Data Lake Storage Gen2 (DFS API para contas HNS)
    try {
      const dfsSuccess = await this.deleteDfsPath(container, cleanPath);
      if (dfsSuccess) {
        deletedCount++;
      }
    } catch {
      // Ignora falha de DFS se não for conta ADLS Gen2
    }

    // 2. Varrer e excluir todos os blobs sob o prefixo via Blob REST API (para contas padrão ou itens remanescentes)
    const prefixWithSlash = cleanPath + "/";
    let continuationMarker: string | null = null;

    do {
      const headers = await this.getHeaders();
      const url = new URL(`${this.baseUrl}/${encodeURIComponent(container)}`);
      url.searchParams.set("restype", "container");
      url.searchParams.set("comp", "list");
      url.searchParams.set("prefix", prefixWithSlash);
      if (continuationMarker) {
        url.searchParams.set("marker", continuationMarker);
      }

      const resp = await fetch(url.toString(), { headers });
      if (!resp.ok) {
        break;
      }

      const xmlText = await resp.text();
      const parsed = xmlParser.parse(xmlText);
      const blobsNode = parsed?.EnumerationResults?.Blobs;
      const nextMarkerRaw = parsed?.EnumerationResults?.NextMarker;
      continuationMarker = (typeof nextMarkerRaw === "string" && nextMarkerRaw.trim().length > 0)
        ? nextMarkerRaw.trim()
        : null;

      if (blobsNode?.Blob) {
        const blobItems = Array.isArray(blobsNode.Blob) ? blobsNode.Blob : [blobsNode.Blob];
        for (const b of blobItems) {
          const blobName = b?.Name;
          if (blobName) {
            try {
              await this.deleteBlob(container, blobName);
              deletedCount++;
            } catch {}
          }
        }
      }
    } while (continuationMarker);

    // 3. Excluir explicitamente qualquer marcador ou blob com o nome da pasta (com ou sem barra)
    const candidates = [
      cleanPath,
      prefixWithSlash,
      `${prefixWithSlash}.keep`,
      `${cleanPath}.keep`
    ];

    for (const item of candidates) {
      try {
        await this.deleteBlob(container, item);
      } catch {}
    }

    return deletedCount;
  }

  /**
   * Renomeia ou move um arquivo ou pasta no ADLS Gen2 (ou via copy+delete em Blob padrão)
   */
  async renamePath(container: string, sourcePath: string, newPath: string): Promise<void> {
    const cleanSource = sourcePath.replace(/^\/+|\/+$/g, "");
    const cleanNew = newPath.replace(/^\/+|\/+$/g, "");
    if (!cleanSource || !cleanNew) {
      throw new Error("Caminho de origem e destino inválidos.");
    }
    if (cleanSource === cleanNew) return;

    // 1. Tentar renomeação atômica nativa ADLS Gen2 (DFS API)
    try {
      const headers = await this.getHeaders({
        "x-ms-rename-source": `/${encodeURIComponent(container)}/${cleanSource.split("/").map(encodeURIComponent).join("/")}`,
      });

      const encodedNew = cleanNew.split("/").map(encodeURIComponent).join("/");
      const dfsUrl = `https://${this.creds.storageAccount}.dfs.core.windows.net/${encodeURIComponent(container)}/${encodedNew}?mode=legacy`;

      const resp = await fetch(dfsUrl, {
        method: "PUT",
        headers,
      });

      if (resp.ok || resp.status === 201) {
        return;
      }
    } catch {
      // Fallback para Blob copy+delete caso DFS não esteja habilitado
    }

    // 2. Fallback para Blob Storage padrão (Copy Blob + Delete Blob)
    const isFolder = sourcePath.endsWith("/") || newPath.endsWith("/");
    if (!isFolder) {
      const headers = await this.getHeaders({
        "x-ms-copy-source": `${this.baseUrl}/${encodeURIComponent(container)}/${cleanSource.split("/").map(encodeURIComponent).join("/")}`,
      });
      const copyUrl = `${this.baseUrl}/${encodeURIComponent(container)}/${cleanNew.split("/").map(encodeURIComponent).join("/")}`;
      const copyResp = await fetch(copyUrl, {
        method: "PUT",
        headers,
      });

      if (!copyResp.ok) {
        const errText = await copyResp.text();
        throw new Error(`Falha ao copiar arquivo para novo destino (${copyResp.status}): ${errText}`);
      }

      await this.deleteBlob(container, cleanSource);
    } else {
      // Renomear pasta em Blob Storage padrão: varre itens sob prefixo e copia cada um
      const prefixWithSlash = cleanSource + "/";
      const newPrefixWithSlash = cleanNew + "/";
      const listRes = await this.listDirectory(container, prefixWithSlash);
      
      for (const file of listRes.files) {
        const relativeName = file.fullPath.slice(prefixWithSlash.length);
        const targetFullPath = newPrefixWithSlash + relativeName;
        const headers = await this.getHeaders({
          "x-ms-copy-source": `${this.baseUrl}/${encodeURIComponent(container)}/${file.fullPath.split("/").map(encodeURIComponent).join("/")}`,
        });
        const copyUrl = `${this.baseUrl}/${encodeURIComponent(container)}/${targetFullPath.split("/").map(encodeURIComponent).join("/")}`;
        const copyResp = await fetch(copyUrl, { method: "PUT", headers });
        if (copyResp.ok) {
          await this.deleteBlob(container, file.fullPath);
        }
      }
      // Remove marcador antigo
      await this.deleteBlob(container, `${cleanSource}/.keep`).catch(() => {});
      await this.deleteBlob(container, cleanSource).catch(() => {});
      // Cria marcador na nova pasta se vazia
      if (listRes.files.length === 0) {
        await this.createFolder(container, cleanNew);
      }
    }
  }
}

