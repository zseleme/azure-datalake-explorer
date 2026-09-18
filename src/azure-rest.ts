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
   * Cria uma pasta virtual criando um arquivo marcador .keep
   */
  async createFolder(container: string, folderPath: string): Promise<void> {
    if (!folderPath.endsWith("/")) folderPath += "/";
    const markerName = `${folderPath}.keep`;
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
}

