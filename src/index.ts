import { AzureRestClient, AzureCredentials } from "./azure-rest";
import { getUIHtml } from "./ui";

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
}

function extractCredentials(req: Request): AzureCredentials | null {
  const tenantId = req.headers.get("x-azure-tenant-id");
  const clientId = req.headers.get("x-azure-client-id");
  const clientSecret = req.headers.get("x-azure-client-secret");
  const storageAccount = req.headers.get("x-azure-storage-account");

  if (!tenantId || !clientId || !clientSecret || !storageAccount) {
    return null;
  }
  return { tenantId, clientId, clientSecret, storageAccount };
}

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // OPTIONS (CORS preflight)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    // Servir a interface Web SPA no caminho raiz
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(getUIHtml(), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Rotas de API
    if (url.pathname.startsWith("/api/")) {
      const creds = extractCredentials(request);
      if (!creds) {
        return new Response("Credenciais Azure não fornecidas nos cabeçalhos.", {
          status: 401,
          headers: corsHeaders(),
        });
      }

      const client = new AzureRestClient(creds);

      try {
        // Teste de Conexão com Entra ID
        if (url.pathname === "/api/test-connection" && request.method === "GET") {
          const testRes = await client.testConnection();
          return new Response(JSON.stringify(testRes), {
            headers: {
              ...corsHeaders(),
              "Content-Type": "application/json",
            },
          });
        }

        // 0. Listar Containers disponíveis na Storage Account
        if (url.pathname === "/api/containers" && request.method === "GET") {
          const manualParam = url.searchParams.get("manual") || "";
          const fallbackList = manualParam
            ? manualParam.split(",").map((c) => c.trim()).filter(Boolean)
            : [];
          const containers = await client.listContainers(fallbackList);
          return new Response(JSON.stringify(containers), {
            headers: {
              ...corsHeaders(),
              "Content-Type": "application/json",
            },
          });
        }
        // 1. Listar Blobs e Pastas
        if (url.pathname === "/api/blobs" && request.method === "GET") {
          const container = url.searchParams.get("container") || "raw";
          const prefix = url.searchParams.get("prefix") || "";
          const result = await client.listDirectory(container, prefix);
          return new Response(JSON.stringify(result), {
            headers: {
              ...corsHeaders(),
              "Content-Type": "application/json",
            },
          });
        }

        // 2. Pré-visualização (Amostra até 2MB)
        if (url.pathname === "/api/preview" && request.method === "GET") {
          const container = url.searchParams.get("container");
          const blob = url.searchParams.get("blob");
          if (!container || !blob) {
            return new Response("Parâmetros 'container' e 'blob' são obrigatórios.", { status: 400, headers: corsHeaders() });
          }

          // Range de até 2MB para preview rápido
          const resp = await client.downloadBlobStream(container, blob, "bytes=0-2097151");
          const headers = new Headers(corsHeaders());
          const ct = resp.headers.get("content-type");
          if (ct) headers.set("Content-Type", ct);

          return new Response(resp.body, {
            status: 200,
            headers,
          });
        }

        // 3. Download Completo
        if (url.pathname === "/api/download" && request.method === "GET") {
          const container = url.searchParams.get("container");
          const blob = url.searchParams.get("blob");
          if (!container || !blob) {
            return new Response("Parâmetros 'container' e 'blob' são obrigatórios.", { status: 400, headers: corsHeaders() });
          }

          const resp = await client.downloadBlobStream(container, blob);
          const headers = new Headers(corsHeaders());
          const ct = resp.headers.get("content-type") || "application/octet-stream";
          headers.set("Content-Type", ct);
          const fileName = blob.split("/").pop() || "download";
          headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);

          return new Response(resp.body, {
            status: 200,
            headers,
          });
        }

        // 4. Upload de Arquivo
        if (url.pathname === "/api/upload" && request.method === "PUT") {
          const container = url.searchParams.get("container");
          const blob = url.searchParams.get("blob");
          if (!container || !blob) {
            return new Response("Parâmetros 'container' e 'blob' são obrigatórios.", { status: 400, headers: corsHeaders() });
          }
          if (!request.body) {
            return new Response("Nenhum corpo de arquivo enviado.", { status: 400, headers: corsHeaders() });
          }

          const contentType = request.headers.get("content-type") || "application/octet-stream";
          await client.uploadBlob(container, blob, request.body, contentType);
          return new Response(JSON.stringify({ success: true, message: "Upload concluído" }), {
            headers: { ...corsHeaders(), "Content-Type": "application/json" },
          });
        }

        // 5. Criar Nova Pasta
        if (url.pathname === "/api/create-folder" && request.method === "POST") {
          const body: any = await request.json();
          const { container, folderPath } = body;
          if (!container || !folderPath) {
            return new Response("Parâmetros 'container' e 'folderPath' são obrigatórios.", { status: 400, headers: corsHeaders() });
          }

          await client.createFolder(container, folderPath);
          return new Response(JSON.stringify({ success: true, message: "Pasta criada com sucesso" }), {
            headers: { ...corsHeaders(), "Content-Type": "application/json" },
          });
        }

        // 6. Excluir Arquivo
        if (url.pathname === "/api/delete" && request.method === "DELETE") {
          const container = url.searchParams.get("container");
          const blob = url.searchParams.get("blob");
          if (!container || !blob) {
            return new Response("Parâmetros 'container' e 'blob' são obrigatórios.", { status: 400, headers: corsHeaders() });
          }

          await client.deleteBlob(container, blob);
          return new Response(JSON.stringify({ success: true, message: "Arquivo excluído com sucesso" }), {
            headers: { ...corsHeaders(), "Content-Type": "application/json" },
          });
        }

        return new Response("Rota não encontrada.", { status: 404, headers: corsHeaders() });
      } catch (err: any) {
        return new Response(err.message || String(err), { status: 500, headers: corsHeaders() });
      }
    }

    return new Response("Não encontrado", { status: 404 });
  },
};

