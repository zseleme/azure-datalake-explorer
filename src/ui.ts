export function getUIHtml(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Azure Data Lake Explorer (Cloudflare Workers)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .azure-blue { background-color: #0078D4; }
    .azure-blue-hover:hover { background-color: #106EBE; }
    .azure-text { color: #0078D4; }
    .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col">

  <!-- TOP NAVBAR -->
  <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <i class="fa-solid fa-cloud text-2xl azure-text"></i>
        <div>
          <h1 class="font-bold text-lg leading-tight text-slate-900">Azure Data Lake Explorer</h1>
          <p class="text-xs text-slate-500" id="accountBadge">Não configurado</p>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        <!-- Container Selector -->
        <div class="flex items-center space-x-2">
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Container:</label>
          <select id="containerSelect" onchange="changeContainer(this.value)" class="bg-slate-100 border border-slate-300 text-slate-800 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium">
            <option value="">Carregando...</option>
          </select>
        </div>

        <button onclick="refreshCurrentFolder()" title="Atualizar pasta" class="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg">
          <i class="fa-solid fa-arrows-rotate"></i>
        </button>

        <button onclick="openConfigModal()" class="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300">
          <i class="fa-solid fa-key text-blue-600"></i>
          <span>Credenciais</span>
        </button>
      </div>
    </div>
  </header>

  <!-- MAIN CONTAINER -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">

    <!-- BREADCRUMBS & ACTIONS -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center space-x-2 text-sm font-medium overflow-x-auto py-1 custom-scroll max-w-2xl" id="breadcrumbBar">
        <!-- Breadcrumbs preenchidos dinamicamente -->
      </div>

      <!-- Action Tabs -->
      <div class="flex space-x-1 bg-slate-100 p-1 rounded-lg">
        <button onclick="switchTab('files')" id="tabBtnFiles" class="px-3 py-1.5 text-xs font-semibold rounded-md bg-white shadow-sm text-blue-700">
          <i class="fa-regular fa-folder-open mr-1"></i> Arquivos
        </button>
        <button onclick="switchTab('upload')" id="tabBtnUpload" class="px-3 py-1.5 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900">
          <i class="fa-solid fa-cloud-arrow-up mr-1"></i> Fazer Upload
        </button>
        <button onclick="switchTab('folder')" id="tabBtnFolder" class="px-3 py-1.5 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900">
          <i class="fa-solid fa-folder-plus mr-1"></i> Nova Pasta
        </button>
      </div>
    </div>

    <!-- TAB 1: FILES AND FOLDERS -->
    <section id="tabFiles">
      <!-- Search Filter -->
      <div class="flex justify-between items-center mb-4">
        <div class="relative w-72">
          <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400 text-xs"></i>
          <input type="text" id="searchInput" onkeyup="filterFiles()" placeholder="Filtrar arquivos..." class="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        <span class="text-xs text-slate-500" id="itemCountLabel">Carregando itens...</span>
      </div>

      <!-- Folders Grid -->
      <div id="foldersSection" class="mb-6 hidden">
        <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pastas</h3>
        <div id="foldersGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <!-- Pastas injetadas aqui -->
        </div>
      </div>

      <!-- Files Table -->
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div class="overflow-x-auto custom-scroll">
          <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead class="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
              <tr>
                <th class="px-6 py-3">Nome</th>
                <th class="px-6 py-3 w-32 whitespace-nowrap">Tamanho</th>
                <th class="px-6 py-3 w-44 whitespace-nowrap">Modificado</th>
                <th class="px-6 py-3 text-right w-64 whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody id="filesTableBody" class="divide-y divide-slate-100 font-normal">
              <!-- Linhas de arquivos geradas via JS -->
            </tbody>
          </table>
        </div>
        <div id="emptyState" class="p-12 text-center text-slate-400 hidden">
          <i class="fa-regular fa-folder-open text-4xl mb-2 text-slate-300"></i>
          <p class="text-sm font-medium">Nenhum arquivo encontrado nesta pasta.</p>
        </div>
      </div>
    </section>

    <!-- TAB 2: UPLOAD -->
    <section id="tabUpload" class="hidden">
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-2xl mx-auto">
        <h3 class="text-base font-bold text-slate-900 mb-2">Enviar Arquivos para o Azure</h3>
        <p class="text-xs text-slate-500 mb-4">Destino atual: <span id="uploadTargetDisplay" class="font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded"></span></p>

        <div id="dropZone" class="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 cursor-pointer transition-colors bg-slate-50">
          <i class="fa-solid fa-cloud-arrow-up text-4xl text-blue-500 mb-3"></i>
          <p class="text-sm font-medium text-slate-700">Clique para selecionar ou arraste arquivos aqui</p>
          <p class="text-xs text-slate-400 mt-1">Suporta arquivos individuais ou múltiplos</p>
          <input type="file" id="fileInput" multiple class="hidden">
        </div>

        <div id="selectedFilesList" class="mt-4 space-y-2 max-h-48 overflow-y-auto custom-scroll hidden"></div>

        <div class="mt-6 flex justify-end">
          <button id="startUploadBtn" onclick="performUpload()" disabled class="px-4 py-2 text-sm font-medium text-white azure-blue azure-blue-hover rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
            <i class="fa-solid fa-arrow-up-from-bracket mr-1"></i> Enviar Arquivos
          </button>
        </div>
      </div>
    </section>

    <!-- TAB 3: NEW FOLDER -->
    <section id="tabFolder" class="hidden">
      <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-md mx-auto">
        <h3 class="text-base font-bold text-slate-900 mb-2">Criar Nova Pasta Virtual</h3>
        <p class="text-xs text-slate-500 mb-4">Caminho: <span id="folderTargetDisplay" class="font-mono font-medium text-blue-700"></span></p>

        <label class="block text-xs font-semibold text-slate-600 mb-1">Nome da Pasta:</label>
        <input type="text" id="newFolderNameInput" placeholder="Ex: dados_processados" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none">

        <button onclick="createFolder()" class="w-full py-2 text-sm font-medium text-white azure-blue azure-blue-hover rounded-lg">
          <i class="fa-solid fa-folder-plus mr-1"></i> Criar Pasta
        </button>
      </div>
    </section>

  </main>

  <!-- MODAL: PREVIEW -->
  <div id="previewModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div>
          <h3 class="font-bold text-slate-900 text-base" id="previewTitle">Visualizador</h3>
          <p class="text-xs text-slate-500" id="previewSubtitle"></p>
        </div>
        <div class="flex items-center space-x-2">
          <button id="previewDownloadBtn" class="px-3 py-1.5 text-xs font-medium text-white azure-blue azure-blue-hover rounded-lg">
            <i class="fa-solid fa-download mr-1"></i> Baixar Completo
          </button>
          <button onclick="closePreviewModal()" class="p-2 text-slate-400 hover:text-slate-700">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
      </div>
      <div class="p-6 overflow-auto custom-scroll flex-1 bg-white" id="previewContent">
        <!-- Conteúdo do arquivo renderizado dinamicamente -->
      </div>
    </div>
  </div>

  <!-- MODAL: CONFIGURAÇÃO DE CREDENCIAIS -->
  <div id="configModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-shield-halved text-blue-600 text-xl"></i>
          <h3 class="font-bold text-slate-900 text-lg">Credenciais Azure</h3>
        </div>
        <button onclick="closeConfigModal()" class="text-slate-400 hover:text-slate-700">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 mb-4">
        <i class="fa-solid fa-lock mr-1"></i>
        Suas credenciais são salvas <b>exclusivamente no localStorage do seu navegador</b> e enviadas diretamente via HTTPS para autenticação com a Azure. O Worker não possui banco de dados.
      </div>

      <form id="configForm" onsubmit="saveConfig(event)" class="space-y-3 text-left">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-0.5">Storage Account Name:</label>
          <p class="text-[11px] text-slate-400 mb-1">Apenas o nome da conta (ex: <code class="bg-slate-100 px-1 py-0.5 rounded text-slate-600">meustorage</code>, sem .blob.core.windows.net)</p>
          <input type="text" id="cfgAccount" required placeholder="meustorageaccount" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-0.5">Tenant ID:</label>
          <p class="text-[11px] text-slate-400 mb-1">Directory (tenant) ID no Microsoft Entra ID (Azure AD)</p>
          <input type="text" id="cfgTenant" required placeholder="d16f0536-xxxx-xxxx-xxxx-xxxxxxxxxxxx" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-0.5">Client ID:</label>
          <p class="text-[11px] text-slate-400 mb-1">Application (client) ID do App Registration</p>
          <input type="text" id="cfgClient" required placeholder="70ff2668-xxxx-xxxx-xxxx-xxxxxxxxxxxx" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-0.5">Client Secret:</label>
          <p class="text-[11px] text-slate-400 mb-1">Valor do segredo (Value) gerado em Certificates & Secrets</p>
          <input type="password" id="cfgSecret" required placeholder="WdW8Q~..." class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono">
        </div>
        <div>
          <div class="flex items-center justify-between mb-0.5">
            <label class="block text-xs font-semibold text-slate-700">Containers (Opcional):</label>
            <span class="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-200">Busca Automática</span>
          </div>
          <p class="text-[11px] text-slate-400 mb-1">Deixe em branco para buscar todos os containers da conta automaticamente. Ou especifique os nomes separados por vírgula.</p>
          <input type="text" id="cfgContainers" placeholder="Deixe vazio para trazer todos os containers automaticamente" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
        </div>

        <div id="testConnFeedback" class="hidden text-xs p-2.5 rounded-lg"></div>

        <div class="pt-3 flex items-center justify-between gap-2 border-t border-slate-200">
          <button type="button" onclick="clearConfig()" class="text-xs text-red-600 hover:underline">
            <i class="fa-solid fa-trash mr-1"></i> Desconectar
          </button>
          <div class="flex items-center space-x-2">
            <button type="button" id="btnTestConn" onclick="handleTestConnection()" class="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300">
              <i class="fa-solid fa-plug-circle-check mr-1"></i> Testar Conexão
            </button>
            <button type="submit" class="px-4 py-1.5 text-xs font-medium text-white azure-blue azure-blue-hover rounded-lg shadow-sm">
              Salvar e Conectar
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <script>
    // ESTADO GLOBAL DO CLIENTE
    let currentConfig = null;
    let activeContainer = "raw";
    let currentPrefix = "";
    let currentFiles = [];

    // Inicialização
    document.addEventListener("DOMContentLoaded", () => {
      loadStoredConfig();
      setupUploadDropZone();
    });

    async function loadStoredConfig() {
      const stored = localStorage.getItem("azure_datalake_cfg");
      if (stored) {
        try {
          currentConfig = JSON.parse(stored);
          populateConfigForm();
          document.getElementById("accountBadge").textContent = "Conta: " + currentConfig.storageAccount;
          await initContainers();
          if (activeContainer) {
            loadDirectory();
          }
          return;
        } catch {
          // falha ao parsear localStorage
        }
      }

      openConfigModal();
    }

    function populateConfigForm() {
      if (!currentConfig) return;
      document.getElementById("cfgAccount").value = currentConfig.storageAccount || "";
      document.getElementById("cfgTenant").value = currentConfig.tenantId || "";
      document.getElementById("cfgClient").value = currentConfig.clientId || "";
      document.getElementById("cfgSecret").value = currentConfig.clientSecret || "";
      document.getElementById("cfgContainers").value = currentConfig.containers || "";
    }

    function openConfigModal() {
      populateConfigForm();
      document.getElementById("configModal").classList.remove("hidden");
    }

    function closeConfigModal() {
      document.getElementById("configModal").classList.add("hidden");
    }

    async function handleTestConnection() {
      const btn = document.getElementById("btnTestConn");
      const feedback = document.getElementById("testConnFeedback");
      feedback.className = "text-xs p-2.5 rounded-lg bg-blue-50 text-blue-800 flex items-center";
      feedback.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Testando autenticação e listando containers no Azure...';
      feedback.classList.remove("hidden");
      btn.disabled = true;

      const account = document.getElementById("cfgAccount").value.trim();
      const tenant = document.getElementById("cfgTenant").value.trim();
      const client = document.getElementById("cfgClient").value.trim();
      const secret = document.getElementById("cfgSecret").value.trim();

      const headers = {};
      if (account) headers["x-azure-storage-account"] = account;
      if (tenant) headers["x-azure-tenant-id"] = tenant;
      if (client) headers["x-azure-client-id"] = client;
      if (secret) headers["x-azure-client-secret"] = secret;

      try {
        const res = await fetch("/api/test-connection", { headers });
        const data = await res.json();
        if (data.success) {
          feedback.className = "text-xs p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200";
          feedback.innerHTML = '<i class="fa-solid fa-circle-check mr-1.5 text-emerald-600"></i> ' + data.message;
        } else {
          feedback.className = "text-xs p-2.5 rounded-lg bg-red-50 text-red-800 border border-red-200";
          feedback.innerHTML = '<i class="fa-solid fa-circle-xmark mr-1.5 text-red-600"></i> ' + data.message;
        }
      } catch (err) {
        feedback.className = "text-xs p-2.5 rounded-lg bg-red-50 text-red-800 border border-red-200";
        feedback.innerHTML = '<i class="fa-solid fa-circle-xmark mr-1.5 text-red-600"></i> ' + err.message;
      } finally {
        btn.disabled = false;
      }
    }

    async function saveConfig(e) {
      e.preventDefault();
      const cfg = {
        storageAccount: document.getElementById("cfgAccount").value.trim(),
        tenantId: document.getElementById("cfgTenant").value.trim(),
        clientId: document.getElementById("cfgClient").value.trim(),
        clientSecret: document.getElementById("cfgSecret").value.trim(),
        containers: document.getElementById("cfgContainers").value.trim()
      };

      localStorage.setItem("azure_datalake_cfg", JSON.stringify(cfg));
      currentConfig = cfg;
      document.getElementById("accountBadge").textContent = "Conta: " + cfg.storageAccount;
      closeConfigModal();
      currentPrefix = "";
      await initContainers();
      if (activeContainer) {
        loadDirectory();
      }
    }

    function clearConfig() {
      if (confirm("Deseja realmente remover as credenciais salvas neste navegador?")) {
        localStorage.removeItem("azure_datalake_cfg");
        currentConfig = null;
        location.reload();
      }
    }

    function getAuthHeaders() {
      if (!currentConfig) return {};
      const headers = {};
      if (currentConfig.storageAccount) headers["x-azure-storage-account"] = currentConfig.storageAccount;
      if (currentConfig.tenantId) headers["x-azure-tenant-id"] = currentConfig.tenantId;
      if (currentConfig.clientId) headers["x-azure-client-id"] = currentConfig.clientId;
      if (currentConfig.clientSecret) headers["x-azure-client-secret"] = currentConfig.clientSecret;
      return headers;
    }

    async function initContainers(preferredContainer) {
      const select = document.getElementById("containerSelect");
      select.innerHTML = '<option value="">Buscando containers...</option>';

      let list = [];
      const manual = currentConfig?.containers ? currentConfig.containers.trim() : "";

      try {
        const resp = await fetch("/api/containers?manual=" + encodeURIComponent(manual), {
          headers: getAuthHeaders()
        });
        if (resp.ok) {
          list = await resp.json();
        }
      } catch (err) {
        console.warn("Aviso ao buscar containers:", err);
      }

      // Se a API não retornou lista, usa fallback dos containers manuais se informados
      if (!list || list.length === 0) {
        if (manual) {
          list = manual.split(",").map(c => c.trim()).filter(Boolean);
        }
      }

      select.innerHTML = "";

      if (list && list.length > 0) {
        list.forEach(c => {
          const opt = document.createElement("option");
          opt.value = c;
          opt.textContent = c;
          select.appendChild(opt);
        });

        if (preferredContainer && list.includes(preferredContainer)) {
          activeContainer = preferredContainer;
        } else if (!list.includes(activeContainer)) {
          activeContainer = list[0];
        }
        select.value = activeContainer;
      } else {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "Nenhum container encontrado";
        select.appendChild(opt);
        activeContainer = "";
      }
    }

    function changeContainer(c) {
      activeContainer = c;
      currentPrefix = "";
      loadDirectory();
    }

    function updateBreadcrumbs() {
      const bar = document.getElementById("breadcrumbBar");
      bar.innerHTML = "";

      // Root button
      const rootBtn = document.createElement("button");
      rootBtn.className = "hover:text-blue-600 flex items-center";
      rootBtn.innerHTML = '<i class="fa-solid fa-house mr-1 text-slate-400"></i> ' + activeContainer;
      rootBtn.onclick = () => { currentPrefix = ""; loadDirectory(); };
      bar.appendChild(rootBtn);

      if (currentPrefix) {
        const cleanPrefix = currentPrefix.endsWith("/") ? currentPrefix.slice(0, -1) : currentPrefix;
        const parts = cleanPrefix.split("/");
        let accumulated = "";

        parts.forEach((p, idx) => {
          accumulated += p + "/";
          const sep = document.createElement("span");
          sep.className = "text-slate-300";
          sep.textContent = "/";
          bar.appendChild(sep);

          const stepPath = accumulated;
          const pBtn = document.createElement("button");
          pBtn.className = (idx === parts.length - 1) ? "text-blue-700 font-bold" : "hover:text-blue-600";
          pBtn.textContent = p;
          pBtn.onclick = () => { currentPrefix = stepPath; loadDirectory(); };
          bar.appendChild(pBtn);
        });
      }

      document.getElementById("uploadTargetDisplay").textContent = activeContainer + "/" + currentPrefix;
      document.getElementById("folderTargetDisplay").textContent = activeContainer + "/" + currentPrefix;
    }

    async function loadDirectory() {
      if (!currentConfig) return;
      if (!activeContainer) {
        const tbody = document.getElementById("filesTableBody");
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-amber-600 font-medium"><i class="fa-solid fa-triangle-exclamation mr-2"></i> Nenhum container selecionado ou disponível nesta conta.</td></tr>';
        return;
      }
      updateBreadcrumbs();

      const tbody = document.getElementById("filesTableBody");
      const emptyState = document.getElementById("emptyState");
      const foldersSection = document.getElementById("foldersSection");
      const foldersGrid = document.getElementById("foldersGrid");
      const itemCountLabel = document.getElementById("itemCountLabel");

      tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Carregando do Azure...</td></tr>';
      foldersSection.classList.add("hidden");
      emptyState.classList.add("hidden");

      try {
        const resp = await fetch("/api/blobs?container=" + encodeURIComponent(activeContainer) + "&prefix=" + encodeURIComponent(currentPrefix), {
          headers: getAuthHeaders()
        });

        if (!resp.ok) {
          const err = await resp.text();
          tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-6 text-center text-red-500 font-medium">Erro ao carregar pasta: ' + err + '</td></tr>';
          return;
        }

        const data = await resp.json();
        currentFiles = data.files || [];
        const folders = data.folders || [];

        // Renderizar Pastas
        if (folders.length > 0) {
          foldersSection.classList.remove("hidden");
          foldersGrid.innerHTML = "";
          folders.forEach(f => {
            const card = document.createElement("button");
            card.className = "flex items-center space-x-2 p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all group";
            card.innerHTML = '<i class="fa-solid fa-folder text-yellow-500 text-lg group-hover:scale-110 transition-transform"></i><span class="text-xs font-semibold text-slate-800 truncate">' + f.name + '</span>';
            card.onclick = () => { currentPrefix = f.fullPath; loadDirectory(); };
            foldersGrid.appendChild(card);
          });
        }

        // Renderizar Arquivos
        renderFilesTable(currentFiles);
        itemCountLabel.textContent = folders.length + " pasta(s), " + currentFiles.length + " arquivo(s)";

      } catch (ex) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-6 text-center text-red-500">Erro de rede: ' + ex.message + '</td></tr>';
      }
    }

    function renderFilesTable(files) {
      const tbody = document.getElementById("filesTableBody");
      const emptyState = document.getElementById("emptyState");
      tbody.innerHTML = "";

      if (files.length === 0) {
        emptyState.classList.remove("hidden");
        return;
      }
      emptyState.classList.add("hidden");

      files.forEach(f => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50/80 transition-colors";

        const iconClass = getFileIcon(f.name);
        const formattedDate = f.lastModified ? new Date(f.lastModified).toLocaleString("pt-BR") : "-";
        const formattedSize = formatSize(f.size);

        tr.innerHTML = \`
          <td class="px-6 py-3 font-medium text-slate-800">
            <div class="flex items-center space-x-2.5">
              <i class="\${iconClass}"></i>
              <span class="truncate max-w-md" title="\${f.name}">\${f.name}</span>
            </div>
          </td>
          <td class="px-6 py-3 text-slate-500 text-xs font-mono whitespace-nowrap">\${formattedSize}</td>
          <td class="px-6 py-3 text-slate-500 text-xs whitespace-nowrap">\${formattedDate}</td>
          <td class="px-6 py-3 text-right whitespace-nowrap">
            <div class="inline-flex items-center justify-end space-x-2">
              <button onclick="previewFile('\${escapeQuotes(f.fullPath)}', '\${escapeQuotes(f.name)}', \${f.size})" title="Visualizar" class="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
                <i class="fa-regular fa-eye mr-1"></i> Ver
              </button>
              <button onclick="downloadFileDirect('\${escapeQuotes(f.fullPath)}', '\${escapeQuotes(f.name)}')" title="Baixar" class="inline-flex items-center px-2.5 py-1 text-xs font-medium text-white azure-blue azure-blue-hover rounded-md shadow-xs transition-colors">
                <i class="fa-solid fa-download mr-1"></i> Baixar
              </button>
              <button onclick="deleteFile('\${escapeQuotes(f.fullPath)}', '\${escapeQuotes(f.name)}')" title="Excluir" class="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function filterFiles() {
      const q = document.getElementById("searchInput").value.toLowerCase();
      const filtered = currentFiles.filter(f => f.name.toLowerCase().includes(q));
      renderFilesTable(filtered);
    }

    async function refreshCurrentFolder() {
      if (!activeContainer) {
        await initContainers();
      }
      if (activeContainer) {
        loadDirectory();
      }
    }

    // PREVIEW DE ARQUIVO
    async function previewFile(fullPath, name, size) {
      const modal = document.getElementById("previewModal");
      const title = document.getElementById("previewTitle");
      const subtitle = document.getElementById("previewSubtitle");
      const content = document.getElementById("previewContent");
      const dlBtn = document.getElementById("previewDownloadBtn");

      title.textContent = name;
      subtitle.textContent = formatSize(size) + " | " + fullPath;
      content.innerHTML = '<div class="py-16 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin text-2xl mr-2"></i> Carregando dados do Azure...</div>';
      dlBtn.onclick = () => downloadFileDirect(fullPath, name);
      modal.classList.remove("hidden");

      try {
        const resp = await fetch("/api/preview?container=" + encodeURIComponent(activeContainer) + "&blob=" + encodeURIComponent(fullPath), {
          headers: getAuthHeaders()
        });

        if (!resp.ok) {
          content.innerHTML = '<div class="p-4 text-red-500 font-medium">Erro ao carregar pré-visualização: ' + (await resp.text()) + '</div>';
          return;
        }

        const ext = name.split(".").pop().toLowerCase();
        const contentType = resp.headers.get("content-type") || "";

        if (ext === "csv" || ext === "tsv") {
          const text = await resp.text();
          renderCsvPreview(text, content, ext === "tsv" ? "\t" : ",");
        } else if (ext === "json") {
          const jsonText = await resp.text();
          try {
            const parsed = JSON.parse(jsonText);
            content.innerHTML = '<pre class="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs overflow-auto font-mono max-h-[70vh]">' + escapeHtml(JSON.stringify(parsed, null, 2)) + '</pre>';
          } catch {
            content.innerHTML = '<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs overflow-auto font-mono max-h-[70vh]">' + escapeHtml(jsonText) + '</pre>';
          }
        } else if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
          const blob = await resp.blob();
          const imgUrl = URL.createObjectURL(blob);
          content.innerHTML = '<div class="flex justify-center"><img src="' + imgUrl + '" class="max-h-[70vh] rounded-lg shadow-md"></div>';
        } else {
          // Texto simples / código
          const text = await resp.text();
          content.innerHTML = '<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs overflow-auto font-mono max-h-[70vh]">' + escapeHtml(text.slice(0, 50000)) + '</pre>';
          if (text.length > 50000) {
            content.innerHTML += '<p class="text-xs text-slate-400 mt-2">Visualização limitada aos primeiros 50.000 caracteres.</p>';
          }
        }
      } catch (ex) {
        content.innerHTML = '<div class="p-4 text-red-500">Erro: ' + ex.message + '</div>';
      }
    }

    function renderCsvPreview(csvText, container, delimiter) {
      const lines = csvText.trim().split(/\\r?\\n/).slice(0, 201);
      if (lines.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm">Arquivo CSV vazio.</p>';
        return;
      }

      const headers = lines[0].split(delimiter);
      let html = '<div class="overflow-x-auto border border-slate-200 rounded-xl"><table class="min-w-full divide-y divide-slate-200 text-xs text-left">';
      html += '<thead class="bg-slate-100 font-bold text-slate-700"><tr>';
      headers.forEach(h => html += '<th class="px-4 py-2.5 whitespace-nowrap">' + escapeHtml(h.trim()) + '</th>');
      html += '</tr></thead><tbody class="divide-y divide-slate-100">';

      lines.slice(1).forEach(row => {
        const cols = row.split(delimiter);
        html += '<tr class="hover:bg-slate-50">';
        cols.forEach(c => html += '<td class="px-4 py-2 whitespace-nowrap text-slate-600">' + escapeHtml(c.trim()) + '</td>');
        html += '</tr>';
      });

      html += '</tbody></table></div>';
      html += '<p class="text-xs text-slate-400 mt-2">Exibindo até 200 linhas da amostra.</p>';
      container.innerHTML = html;
    }

    function closePreviewModal() {
      document.getElementById("previewModal").classList.add("hidden");
      document.getElementById("previewContent").innerHTML = "";
    }

    // DOWNLOAD DIRETO
    async function downloadFileDirect(fullPath, name) {
      const url = "/api/download?container=" + encodeURIComponent(activeContainer) + "&blob=" + encodeURIComponent(fullPath);
      
      // Realiza fetch com headers de autenticação e cria blob no navegador
      const toast = showToast("Iniciando download de " + name + "...", "info");
      try {
        const resp = await fetch(url, { headers: getAuthHeaders() });
        if (!resp.ok) throw new Error(await resp.text());

        const blob = await resp.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        toast.remove();
        showToast("Download concluído com sucesso!", "success");
      } catch (err) {
        toast.remove();
        alert("Erro no download: " + err.message);
      }
    }

    // EXCLUIR ARQUIVO
    async function deleteFile(fullPath, name) {
      if (!confirm("Tem certeza que deseja excluir '" + name + "'?")) return;

      try {
        const resp = await fetch("/api/delete?container=" + encodeURIComponent(activeContainer) + "&blob=" + encodeURIComponent(fullPath), {
          method: "DELETE",
          headers: getAuthHeaders()
        });

        if (resp.ok) {
          showToast("Arquivo excluído com sucesso!", "success");
          loadDirectory();
        } else {
          alert("Erro ao excluir: " + (await resp.text()));
        }
      } catch (err) {
        alert("Erro de conexão: " + err.message);
      }
    }

    // CRIAR PASTA
    async function createFolder() {
      const name = document.getElementById("newFolderNameInput").value.trim();
      if (!name) { alert("Informe o nome da pasta."); return; }

      const targetPath = currentPrefix + name.replace(/\\/|\\\\/g, "") + "/";
      try {
        const resp = await fetch("/api/create-folder", {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ container: activeContainer, folderPath: targetPath })
        });

        if (resp.ok) {
          showToast("Pasta criada com sucesso!", "success");
          document.getElementById("newFolderNameInput").value = "";
          switchTab("files");
          loadDirectory();
        } else {
          alert("Erro ao criar pasta: " + (await resp.text()));
        }
      } catch (err) {
        alert("Erro: " + err.message);
      }
    }

    // UPLOAD DRAG & DROP
    let selectedFilesToUpload = [];

    function setupUploadDropZone() {
      const dropZone = document.getElementById("dropZone");
      const fileInput = document.getElementById("fileInput");

      dropZone.onclick = () => fileInput.click();

      dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add("border-blue-500", "bg-blue-50/50"); };
      dropZone.ondragleave = () => { dropZone.classList.remove("border-blue-500", "bg-blue-50/50"); };
      dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove("border-blue-500", "bg-blue-50/50");
        if (e.dataTransfer.files) handleFilesSelected(e.dataTransfer.files);
      };

      fileInput.onchange = (e) => {
        if (e.target.files) handleFilesSelected(e.target.files);
      };
    }

    function handleFilesSelected(files) {
      selectedFilesToUpload = Array.from(files);
      const list = document.getElementById("selectedFilesList");
      const btn = document.getElementById("startUploadBtn");

      if (selectedFilesToUpload.length > 0) {
        list.classList.remove("hidden");
        list.innerHTML = "";
        selectedFilesToUpload.forEach(f => {
          const div = document.createElement("div");
          div.className = "text-xs p-2 bg-slate-50 border border-slate-200 rounded flex justify-between";
          div.innerHTML = '<span class="font-medium text-slate-800">' + f.name + '</span><span class="text-slate-400 font-mono">' + formatSize(f.size) + '</span>';
          list.appendChild(div);
        });
        btn.disabled = false;
      }
    }

    async function performUpload() {
      if (selectedFilesToUpload.length === 0) return;
      const btn = document.getElementById("startUploadBtn");
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Enviando...';

      let successCount = 0;
      for (const file of selectedFilesToUpload) {
        const targetBlob = currentPrefix + file.name;
        try {
          const resp = await fetch("/api/upload?container=" + encodeURIComponent(activeContainer) + "&blob=" + encodeURIComponent(targetBlob), {
            method: "PUT",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": file.type || "application/octet-stream"
            },
            body: file
          });
          if (resp.ok) successCount++;
        } catch (err) {
          console.error("Falha ao enviar " + file.name, err);
        }
      }

      btn.innerHTML = '<i class="fa-solid fa-arrow-up-from-bracket mr-1"></i> Enviar Arquivos';
      selectedFilesToUpload = [];
      document.getElementById("selectedFilesList").innerHTML = "";
      document.getElementById("selectedFilesList").classList.add("hidden");
      showToast(successCount + " arquivo(s) enviado(s) com sucesso!", "success");
      switchTab("files");
      loadDirectory();
    }

    // TABS NAVEGAÇÃO
    function switchTab(tab) {
      const filesSec = document.getElementById("tabFiles");
      const uploadSec = document.getElementById("tabUpload");
      const folderSec = document.getElementById("tabFolder");
      const btnF = document.getElementById("tabBtnFiles");
      const btnU = document.getElementById("tabBtnUpload");
      const btnFo = document.getElementById("tabBtnFolder");

      [filesSec, uploadSec, folderSec].forEach(s => s.classList.add("hidden"));
      [btnF, btnU, btnFo].forEach(b => {
        b.className = "px-3 py-1.5 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900";
      });

      if (tab === "files") {
        filesSec.classList.remove("hidden");
        btnF.className = "px-3 py-1.5 text-xs font-semibold rounded-md bg-white shadow-sm text-blue-700";
      } else if (tab === "upload") {
        uploadSec.classList.remove("hidden");
        btnU.className = "px-3 py-1.5 text-xs font-semibold rounded-md bg-white shadow-sm text-blue-700";
      } else if (tab === "folder") {
        folderSec.classList.remove("hidden");
        btnFo.className = "px-3 py-1.5 text-xs font-semibold rounded-md bg-white shadow-sm text-blue-700";
      }
    }

    // HELPERS
    function formatSize(bytes) {
      if (bytes == null || isNaN(bytes)) return "-";
      if (bytes === 0) return "0 B";
      const k = 1024;
      const dm = 2;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function getFileIcon(name) {
      const ext = name.split(".").pop().toLowerCase();
      if (["csv", "tsv", "xlsx", "parquet"].includes(ext)) return "fa-solid fa-table text-emerald-600";
      if (["json", "xml", "yaml", "yml"].includes(ext)) return "fa-solid fa-code text-amber-600";
      if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "fa-regular fa-image text-purple-600";
      if (["txt", "log", "md", "sql", "py"].includes(ext)) return "fa-regular fa-file-lines text-blue-600";
      return "fa-regular fa-file text-slate-400";
    }

    function escapeHtml(str) {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function escapeQuotes(str) {
      return str.replace(/'/g, "\\\\'");
    }

    function showToast(msg, type = "info") {
      const t = document.createElement("div");
      t.className = "fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium text-white transition-all transform flex items-center space-x-2 " +
        (type === "success" ? "bg-emerald-600" : "bg-slate-800");
      t.innerHTML = (type === "success" ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-info"></i>') + '<span>' + msg + '</span>';
      document.body.appendChild(t);
      setTimeout(() => { t.remove(); }, 3500);
      return t;
    }
  </script>
</body>
</html>`;
}

