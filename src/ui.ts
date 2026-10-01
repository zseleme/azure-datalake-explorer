export function getUIHtml(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Azure Data Lake Explorer (Cloudflare Workers)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
    };
  </script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .azure-blue { background-color: #0078D4; }
    .azure-blue-hover:hover { background-color: #106EBE; }
    .azure-text { color: #0078D4; }
    .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    .dark .custom-scroll::-webkit-scrollbar-thumb { background: #475569; }
  </style>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen flex flex-col transition-colors duration-150">

  <!-- TOP NAVBAR -->
  <header class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm transition-colors duration-150">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <i class="fa-solid fa-cloud text-2xl azure-text"></i>
        <div>
          <h1 class="font-bold text-lg leading-tight text-slate-900 dark:text-slate-100">Azure Data Lake Explorer</h1>
          <p class="text-xs text-slate-500 dark:text-slate-400" id="accountBadge">Não configurado</p>
        </div>
      </div>

      <div class="flex items-center space-x-2.5">
        <!-- Profile Selector -->
        <div class="flex items-center space-x-1.5">
          <label class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:inline">Perfil:</label>
          <select id="profileSelect" onchange="changeProfile(this.value)" class="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold max-w-[130px] sm:max-w-[170px] truncate">
            <option value="">Carregando...</option>
          </select>
        </div>

        <!-- Container Selector -->
        <div class="flex items-center space-x-1.5">
          <label class="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden sm:inline">Container:</label>
          <select id="containerSelect" onchange="changeContainer(this.value)" class="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold max-w-[120px] truncate">
            <option value="">Carregando...</option>
          </select>
        </div>

        <button onclick="refreshCurrentFolder()" title="Atualizar pasta" class="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <i class="fa-solid fa-arrows-rotate"></i>
        </button>

        <!-- Dark Mode Toggle Button -->
        <button onclick="toggleDarkMode()" id="darkModeBtn" title="Alternar Modo Escuro" class="p-2 text-slate-600 dark:text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <i class="fa-solid fa-moon text-sm" id="darkModeIcon"></i>
        </button>

        <button onclick="openConfigModal()" class="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors">
          <i class="fa-solid fa-key text-blue-600 dark:text-blue-400"></i>
          <span>Perfis & Acesso</span>
        </button>
      </div>
    </div>
  </header>

  <!-- MAIN CONTAINER -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">

    <!-- BREADCRUMBS & ACTIONS -->
    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4 transition-colors duration-150">
      <div class="flex items-center space-x-2 text-sm font-medium overflow-x-auto py-1 custom-scroll max-w-2xl text-slate-700 dark:text-slate-300" id="breadcrumbBar">
        <!-- Breadcrumbs preenchidos dinamicamente -->
      </div>

      <!-- Action Tabs -->
      <div class="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
        <button onclick="switchTab('files')" id="tabBtnFiles" class="px-3 py-1.5 text-xs font-semibold rounded-md bg-white dark:bg-slate-700 shadow-sm text-blue-700 dark:text-blue-400">
          <i class="fa-regular fa-folder-open mr-1"></i> Arquivos
        </button>
        <button onclick="switchTab('upload')" id="tabBtnUpload" class="px-3 py-1.5 text-xs font-semibold rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
          <i class="fa-solid fa-cloud-arrow-up mr-1"></i> Fazer Upload
        </button>
        <button onclick="switchTab('folder')" id="tabBtnFolder" class="px-3 py-1.5 text-xs font-semibold rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
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
          <input type="text" id="searchInput" onkeyup="filterFiles()" placeholder="Filtrar arquivos..." class="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        <span class="text-xs text-slate-500 dark:text-slate-400" id="itemCountLabel">Carregando itens...</span>
      </div>

      <!-- DELTA TABLE QUICK ACTION BANNER -->
      <div id="deltaFolderBanner" class="mb-4 p-3.5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-slate-800/60 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between hidden shadow-xs">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <i class="fa-solid fa-layer-group text-base"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h4 class="text-xs font-bold text-slate-900 dark:text-slate-100">Pasta Reconhecida como Delta Table</h4>
              <span class="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded-full">_delta_log ativo</span>
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Esta pasta contém commits Delta Lake. Você pode inspecionar os dados consolidados e executar comandos SQL diretamente no navegador.</p>
          </div>
        </div>
        <button onclick="openDeltaTableModal(activeContainer, currentPrefix)" class="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm flex items-center shrink-0 transition-colors">
          <i class="fa-solid fa-terminal mr-1.5 text-indigo-200"></i> Consultar Tabela (SQL)
        </button>
      </div>

      <!-- Folders Grid -->
      <div id="foldersSection" class="mb-6 hidden">
        <h3 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Pastas</h3>
        <div id="foldersGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <!-- Pastas injetadas aqui -->
        </div>
      </div>

      <!-- Files Table -->
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors duration-150">
        <div class="overflow-x-auto custom-scroll">
          <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th class="px-4 py-3 w-10 text-center select-none">
                  <input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAll(this.checked)" class="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer" title="Selecionar Todos">
                </th>
                <th class="px-4 py-3 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onclick="sortTable('name')">
                  <div class="flex items-center space-x-1.5">
                    <span>Nome</span>
                    <i id="sortIcon-name" class="fa-solid fa-sort-up text-blue-600 dark:text-blue-400 text-xs"></i>
                  </div>
                </th>
                <th class="px-4 py-3 w-36 whitespace-nowrap cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onclick="sortTable('size')">
                  <div class="flex items-center space-x-1.5">
                    <span>Tamanho</span>
                    <i id="sortIcon-size" class="fa-solid fa-sort text-slate-300 dark:text-slate-600 text-xs"></i>
                  </div>
                </th>
                <th class="px-4 py-3 w-48 whitespace-nowrap cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onclick="sortTable('lastModified')">
                  <div class="flex items-center space-x-1.5">
                    <span>Modificado</span>
                    <i id="sortIcon-lastModified" class="fa-solid fa-sort text-slate-300 dark:text-slate-600 text-xs"></i>
                  </div>
                </th>
                <th class="px-4 py-3 text-right w-64 whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody id="filesTableBody" class="divide-y divide-slate-100 dark:divide-slate-800/80 font-normal">
              <!-- Linhas de arquivos geradas via JS -->
            </tbody>
          </table>
        </div>
        <div id="emptyState" class="p-12 text-center text-slate-400 dark:text-slate-500 hidden">
          <i class="fa-regular fa-folder-open text-4xl mb-2 text-slate-300 dark:text-slate-600"></i>
          <p class="text-sm font-medium">Nenhum arquivo encontrado nesta pasta.</p>
        </div>
      </div>
    </section>

    <!-- TAB 2: UPLOAD (ARQUIVOS E PASTAS) -->
    <section id="tabUpload" class="hidden">
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm max-w-2xl mx-auto transition-colors duration-150">
        <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Enviar Arquivos ou Pastas para o Azure</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">Destino atual: <span id="uploadTargetDisplay" class="font-mono font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 px-2 py-0.5 rounded"></span></p>

        <!-- Dropzone -->
        <div id="dropZone" class="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/50">
          <i class="fa-solid fa-cloud-arrow-up text-4xl text-blue-500 mb-3"></i>
          <p class="text-sm font-medium text-slate-700 dark:text-slate-200">Arraste arquivos ou pastas inteiras aqui</p>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-4">Suporta pastas com subestruturas e múltiplos arquivos</p>
          <div class="flex items-center justify-center space-x-2">
            <button type="button" onclick="event.stopPropagation(); document.getElementById('fileInput').click()" class="px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors">
              <i class="fa-solid fa-file mr-1"></i> Selecionar Arquivos
            </button>
            <button type="button" onclick="event.stopPropagation(); document.getElementById('folderUploadInput').click()" class="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors">
              <i class="fa-solid fa-folder-tree mr-1"></i> Selecionar Pasta
            </button>
          </div>
          <input type="file" id="fileInput" multiple class="hidden">
          <input type="file" id="folderUploadInput" webkitdirectory directory multiple class="hidden">
        </div>

        <!-- Barra de Progresso do Upload -->
        <div id="uploadProgressContainer" class="mt-4 hidden">
          <div class="flex justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
            <span id="uploadProgressText">Enviando arquivos...</span>
            <span id="uploadProgressPercent" class="font-mono font-bold">0%</span>
          </div>
          <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div id="uploadProgressBar" class="azure-blue h-2 rounded-full transition-all duration-150" style="width: 0%"></div>
          </div>
        </div>

        <div id="selectedFilesList" class="mt-4 space-y-2 max-h-48 overflow-y-auto custom-scroll hidden"></div>

        <div class="mt-6 flex justify-end">
          <button id="startUploadBtn" onclick="performUpload()" disabled class="px-4 py-2 text-sm font-medium text-white azure-blue azure-blue-hover rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
            <i class="fa-solid fa-arrow-up-from-bracket mr-1"></i> Iniciar Envio
          </button>
        </div>
      </div>
    </section>

    <!-- TAB 3: NEW FOLDER -->
    <section id="tabFolder" class="hidden">
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm max-w-md mx-auto transition-colors duration-150">
        <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Criar Nova Pasta</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">Caminho: <span id="folderTargetDisplay" class="font-mono font-medium text-blue-700 dark:text-blue-400"></span></p>

        <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nome da Pasta:</label>
        <input type="text" id="newFolderNameInput" placeholder="Ex: dados_processados" class="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none">

        <button onclick="createFolder()" class="w-full py-2 text-sm font-medium text-white azure-blue azure-blue-hover rounded-lg">
          <i class="fa-solid fa-folder-plus mr-1"></i> Criar Pasta
        </button>
      </div>
    </section>

    <!-- FLOATING BATCH ACTION BAR -->
    <div id="batchActionBar" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3 sm:space-x-4 transition-all duration-200 hidden">
      <div class="flex items-center space-x-2 shrink-0">
        <span class="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
        <span id="batchCountBadge" class="text-xs font-bold text-slate-100">0 selecionado(s)</span>
      </div>
      <div class="h-4 w-px bg-slate-700"></div>
      <button onclick="downloadBatchAsZip()" class="text-xs font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center transition-colors shadow-xs">
        <i class="fa-solid fa-file-zipper mr-1.5"></i> Baixar ZIP
      </button>
      <button onclick="executeBatchDelete()" class="text-xs font-semibold px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center transition-colors shadow-xs">
        <i class="fa-regular fa-trash-can mr-1.5"></i> Excluir
      </button>
      <button onclick="clearSelection()" class="text-xs text-slate-400 hover:text-white transition-colors" title="Desmarcar todos">
        <i class="fa-solid fa-xmark mr-1"></i> Desmarcar
      </button>
    </div>

  </main>

  <!-- MODAL: PREVIEW & DATA DISCOVERY -->
  <div id="previewModal" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 hidden">
    <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-150">
      
      <!-- Top Modal Bar -->
      <div class="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850/80">
        <div class="min-w-0 flex-1">
          <div class="flex items-center space-x-2">
            <h3 class="font-bold text-slate-900 dark:text-slate-100 text-base truncate" id="previewTitle">Visualizador</h3>
            <!-- Tabs: Dados | Metadados -->
            <div class="flex bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-xs ml-2 shrink-0">
              <button id="tabBtnPreviewData" onclick="switchPreviewTab('data')" class="px-2.5 py-1 font-semibold rounded-md bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs flex items-center">
                <i class="fa-solid fa-table mr-1.5"></i> Dados
              </button>
              <button id="tabBtnPreviewMeta" onclick="switchPreviewTab('meta')" class="px-2.5 py-1 font-semibold rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center">
                <i class="fa-solid fa-circle-info mr-1.5"></i> Propriedades
              </button>
            </div>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" id="previewSubtitle"></p>
        </div>

        <div class="flex items-center space-x-2 shrink-0">
          <!-- Copy JSON (visible for tabular data) -->
          <button id="previewCopyJsonBtn" onclick="copyModalSampleJson()" title="Copiar amostra filtrada como JSON" class="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs hidden sm:inline-flex items-center">
            <i class="fa-regular fa-copy mr-1 text-amber-500"></i> Copiar JSON
          </button>
          <!-- Export CSV (visible for tabular data) -->
          <button id="previewExportCsvBtn" onclick="exportModalSampleCsv()" title="Exportar amostra filtrada para arquivo CSV" class="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs inline-flex items-center">
            <i class="fa-solid fa-file-csv mr-1 text-emerald-500"></i> Exportar CSV
          </button>
          <!-- Download full file -->
          <button id="previewDownloadBtn" class="px-3 py-1.5 text-xs font-semibold text-white azure-blue azure-blue-hover rounded-lg shadow-xs flex items-center">
            <i class="fa-solid fa-download mr-1"></i> Baixar Completo
          </button>
          <button onclick="closePreviewModal()" class="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
      </div>

      <!-- Sub-toolbar: Search & Stats (only shown for tabular files) -->
      <div id="previewDataToolbar" class="px-5 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hidden">
        <div class="relative flex-1 max-w-sm">
          <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
          <input type="text" id="modalSearchInput" oninput="filterModalRows(this.value)" placeholder="Buscar nas linhas da amostra..." class="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        <div class="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
          <span id="modalRowStats">Carregando...</span>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-hidden relative">
        <!-- View 1: Data View -->
        <div id="previewDataView" class="h-full p-5 overflow-auto custom-scroll bg-white dark:bg-slate-900">
          <div id="previewContent">
            <!-- Conteúdo do arquivo renderizado dinamicamente -->
          </div>
        </div>

        <!-- View 2: Properties / Metadata View -->
        <div id="previewMetadataView" class="h-full p-6 overflow-auto custom-scroll bg-slate-50/50 dark:bg-slate-900 hidden">
          <div id="previewMetadataContent" class="max-w-3xl mx-auto space-y-4">
            <!-- Metadados preenchidos dinamicamente -->
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL: RENOMEAR / MOVER (ADLS Gen2) -->
  <div id="renameModal" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors duration-150">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-pencil text-blue-600 dark:text-blue-400 text-lg"></i>
          <h3 class="font-bold text-slate-900 dark:text-slate-100 text-base" id="renameModalTitle">Renomear / Mover</h3>
        </div>
        <button onclick="closeRenameModal()" class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <input type="hidden" id="renameSourcePath">
      <input type="hidden" id="renameIsFolder">

      <div class="mb-4 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
        <span class="text-slate-400 block mb-0.5 font-medium">Origem atual:</span>
        <span id="renameSourceDisplay" class="font-mono text-slate-700 dark:text-slate-200 break-all font-semibold"></span>
      </div>

      <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Novo nome ou caminho de destino:</label>
      <input type="text" id="renameNewPathInput" class="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 mb-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono">
      <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
        <i class="fa-solid fa-circle-info mr-1 text-blue-500"></i> No ADLS Gen2, você pode mover para outra subpasta alterando o caminho relativo dentro do container (ex: <code class="text-blue-600 dark:text-blue-400">pasta_destino/arquivo.parquet</code>).
      </p>

      <div class="flex items-center justify-end space-x-2">
        <button type="button" onclick="closeRenameModal()" class="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
          Cancelar
        </button>
        <button type="button" onclick="submitRename()" id="renameSubmitBtn" class="px-4 py-2 text-xs font-semibold text-white azure-blue azure-blue-hover rounded-lg shadow-sm">
          Salvar Alteração
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL: CONFIGURAÇÃO DE CREDENCIAIS & PERFIS -->
  <div id="configModal" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors duration-150">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-shield-halved text-blue-600 dark:text-blue-400 text-xl"></i>
          <h3 class="font-bold text-slate-900 dark:text-slate-100 text-lg">Perfis de Conexão Azure</h3>
        </div>
        <button onclick="closeConfigModal()" class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <!-- Barra de Seleção e Criação de Perfis -->
      <div class="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl mb-4 flex items-center justify-between gap-3">
        <div class="flex-1 min-w-0">
          <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Selecionar Perfil:</label>
          <select id="modalProfileSelect" onchange="onModalProfileChange(this.value)" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold truncate">
          </select>
        </div>
        <div class="flex items-end space-x-1.5 self-end">
          <button type="button" onclick="createNewProfileDraft()" class="px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center shrink-0" title="Cadastrar novo perfil">
            <i class="fa-solid fa-plus mr-1"></i> Novo
          </button>
          <button type="button" id="btnDeleteProfile" onclick="deleteCurrentProfile()" class="p-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-lg border border-red-200 dark:border-red-800 flex items-center shrink-0" title="Excluir Perfil">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </div>

      <div class="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg text-xs text-blue-800 dark:text-blue-300 mb-4">
        <i class="fa-solid fa-lock mr-1"></i>
        Suas credenciais são salvas <b>exclusivamente no localStorage do seu navegador</b> e transmitidas via HTTPS diretamente para a Azure. O Worker não possui banco de dados.
      </div>

      <form id="configForm" onsubmit="saveConfig(event)" class="space-y-3 text-left">
        <input type="hidden" id="cfgProfileId">
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Nome do Perfil:</label>
          <input type="text" id="cfgProfileName" required placeholder="Ex: Data Lake Raw - Dev ou Analytics - Prod" class="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Storage Account Name:</label>
          <p class="text-[11px] text-slate-400 dark:text-slate-500 mb-1">Apenas o nome da conta (sem .blob.core.windows.net)</p>
          <input type="text" id="cfgAccount" required placeholder="meustorageaccount" class="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Tenant ID:</label>
          <p class="text-[11px] text-slate-400 dark:text-slate-500 mb-1">Directory (tenant) ID no Microsoft Entra ID (Azure AD)</p>
          <input type="text" id="cfgTenant" required placeholder="d16f0536-xxxx-xxxx-xxxx-xxxxxxxxxxxx" class="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Client ID:</label>
          <p class="text-[11px] text-slate-400 dark:text-slate-500 mb-1">Application (client) ID do App Registration</p>
          <input type="text" id="cfgClient" required placeholder="70ff2668-xxxx-xxxx-xxxx-xxxxxxxxxxxx" class="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Client Secret:</label>
          <p class="text-[11px] text-slate-400 dark:text-slate-500 mb-1">Valor do segredo (Value) gerado em Certificates & Secrets</p>
          <input type="password" id="cfgSecret" required placeholder="WdW8Q~..." class="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono">
        </div>
        <div>
          <div class="flex items-center justify-between mb-0.5">
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">Containers (Opcional):</label>
            <span class="text-[10px] text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded font-semibold border border-blue-200 dark:border-blue-800">Busca Automática</span>
          </div>
          <p class="text-[11px] text-slate-400 dark:text-slate-500 mb-1">Deixe vazio para trazer todos os containers automaticamente, ou separe por vírgula.</p>
          <input type="text" id="cfgContainers" placeholder="Deixe vazio para trazer todos os containers automaticamente" class="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
        </div>

        <div id="testConnFeedback" class="hidden text-xs p-2.5 rounded-lg"></div>

        <div class="pt-3 flex items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onclick="clearConfig()" class="text-xs text-red-600 dark:text-red-400 hover:underline">
            <i class="fa-solid fa-power-off mr-1"></i> Desconectar Perfil
          </button>
          <div class="flex items-center space-x-2">
            <button type="button" id="btnTestConn" onclick="handleTestConnection()" class="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700">
              <i class="fa-solid fa-plug-circle-check mr-1"></i> Testar Conexão
            </button>
            <button type="submit" class="px-4 py-1.5 text-xs font-semibold text-white azure-blue azure-blue-hover rounded-lg shadow-sm">
              Salvar Perfil
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <!-- MODAL: DELTA LAKE & SQL QUERY CONSOLE -->
  <div id="deltaQueryModal" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 hidden">
    <div class="bg-white dark:bg-slate-900 rounded-2xl max-w-6xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-150">
      
      <!-- Top Modal Bar -->
      <div class="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-850/80">
        <div class="min-w-0 flex-1">
          <div class="flex items-center space-x-2">
            <span class="px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 flex items-center shadow-xs">
              <i class="fa-solid fa-layer-group mr-1.5"></i> Delta Lake
            </span>
            <h3 class="font-bold text-slate-900 dark:text-slate-100 text-base truncate" id="deltaModalTitle">Consultar Delta Table</h3>
            <span id="deltaModalBadges" class="flex items-center gap-1.5 ml-2"></span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono" id="deltaModalSubtitle"></p>
        </div>

        <div class="flex items-center space-x-2 shrink-0">
          <button id="deltaExportCsvBtn" onclick="exportDeltaQueryResultsCsv()" title="Exportar resultado atual para CSV" class="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs inline-flex items-center">
            <i class="fa-solid fa-file-csv mr-1 text-emerald-500"></i> Exportar CSV
          </button>
          <button id="deltaCopyJsonBtn" onclick="copyDeltaQueryResultsJson()" title="Copiar resultado como JSON" class="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 shadow-xs inline-flex items-center">
            <i class="fa-regular fa-copy mr-1 text-amber-500"></i> Copiar JSON
          </button>
          <button onclick="closeDeltaQueryModal()" class="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
      </div>

      <!-- SQL Query Console Area -->
      <div class="p-4 bg-slate-50/60 dark:bg-slate-850/40 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <i class="fa-solid fa-terminal text-blue-500"></i>
            <span>Console SQL (em memória / read-only)</span>
            <span class="text-[11px] font-normal text-slate-400 dark:text-slate-500">Tabela disponível como <code class="font-mono text-blue-600 dark:text-blue-400">delta_table</code></span>
          </div>
          <!-- Quick templates -->
          <div class="flex items-center space-x-1.5 text-[11px]">
            <button onclick="setDeltaSqlTemplate('select_all')" class="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 shadow-2xs">
              SELECT *
            </button>
            <button onclick="setDeltaSqlTemplate('count')" class="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 shadow-2xs">
              COUNT(*)
            </button>
          </div>
        </div>

        <div class="relative">
          <textarea id="deltaSqlInput" rows="3" spellcheck="false" placeholder="Digite seu comando SQL aqui... Ex: SELECT * FROM delta_table LIMIT 50;" class="w-full font-mono text-xs p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"></textarea>
        </div>

        <div class="flex items-center justify-between">
          <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-3" id="deltaExecutionStats">
            <span>Dica: Pressione <b>Ctrl + Enter</b> para executar</span>
          </div>
          <button id="btnRunDeltaSql" onclick="executeDeltaQuery()" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors">
            <i class="fa-solid fa-play text-[10px]"></i>
            <span>Executar SQL</span>
          </button>
        </div>
      </div>

      <!-- Main Results Area -->
      <div class="flex-1 overflow-hidden relative flex flex-col">
        <!-- Loading State Indicator -->
        <div id="deltaLoadingOverlay" class="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center z-20 space-y-3 hidden">
          <div class="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p id="deltaLoadingText" class="text-xs font-semibold text-slate-700 dark:text-slate-200 animate-pulse">Carregando dados da Delta Table...</p>
        </div>

        <!-- Table View -->
        <div id="deltaTableView" class="flex-1 overflow-auto custom-scroll p-4 bg-white dark:bg-slate-900">
          <div id="deltaTableContent">
            <!-- Tabela injetada dinamicamente -->
          </div>
        </div>

        <!-- Pagination & Footer Bar -->
        <div id="deltaPaginationBar" class="px-5 py-2.5 bg-slate-50 dark:bg-slate-850/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div id="deltaPaginationInfo">0 registros</div>
          <div class="flex items-center space-x-2">
            <button id="deltaPrevPageBtn" onclick="deltaChangePage(-1)" disabled class="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700">
              <i class="fa-solid fa-chevron-left mr-1"></i> Anterior
            </button>
            <span id="deltaPageIndicator" class="font-mono text-slate-700 dark:text-slate-200 font-semibold">1 / 1</span>
            <button id="deltaNextPageBtn" onclick="deltaChangePage(1)" disabled class="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700">
              Próxima <i class="fa-solid fa-chevron-right ml-1"></i>
            </button>
          </div>
        </div>

      </div>

    </div>
  </div>

  <script>
    // ESTADO GLOBAL DO CLIENTE
    let allProfiles = [];
    let activeProfileId = "";
    let currentConfig = null;
    let activeContainer = "raw";
    let currentPrefix = "";
    let currentFiles = [];

    // Estado da Ordenação da Tabela
    let currentSortColumn = "name";
    let currentSortDirection = "asc"; // "asc" ou "desc"

    // Estado de Seleção em Massa
    const selectedItems = new Map(); // fullPath -> { fullPath, name, size, isFolder }

    // Estado do Modal de Preview & Data Discovery
    let currentModalState = {
      fullPath: "",
      name: "",
      size: 0,
      columns: [],
      originalRows: [],
      filteredRows: [],
      sortCol: null,
      sortDir: "asc",
      types: {},
      nullCounts: {},
      metadata: {},
      activeTab: "data"
    };

    // Inicialização
    document.addEventListener("DOMContentLoaded", () => {
      initDarkMode();
      loadStoredProfiles();
      setupUploadDropZone();
    });

    // MODO ESCURO (DARK MODE)
    function initDarkMode() {
      const saved = localStorage.getItem("azure_datalake_theme");
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (saved === "dark" || (!saved && prefersDark)) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      updateDarkModeButton();
    }

    function toggleDarkMode() {
      const isDark = document.documentElement.classList.toggle("dark");
      localStorage.setItem("azure_datalake_theme", isDark ? "dark" : "light");
      updateDarkModeButton();
    }

    function updateDarkModeButton() {
      const icon = document.getElementById("darkModeIcon");
      if (!icon) return;
      const isDark = document.documentElement.classList.contains("dark");
      icon.className = isDark ? "fa-solid fa-sun text-amber-400 text-sm" : "fa-solid fa-moon text-slate-600 dark:text-slate-400 text-sm";
    }

    // MULTI-PERFIS DE CONEXÃO
    function loadStoredProfiles() {
      const stored = localStorage.getItem("azure_datalake_profiles");
      if (stored) {
        try {
          allProfiles = JSON.parse(stored);
        } catch {
          allProfiles = [];
        }
      }

      // Migração transparente caso o usuário possua a chave legada
      if (allProfiles.length === 0) {
        const legacy = localStorage.getItem("azure_datalake_cfg");
        if (legacy) {
          try {
            const p = JSON.parse(legacy);
            if (p.storageAccount) {
              const defaultProf = {
                id: "prof_" + Date.now(),
                name: p.storageAccount + " (Padrão)",
                storageAccount: p.storageAccount,
                tenantId: p.tenantId || "",
                clientId: p.clientId || "",
                clientSecret: p.clientSecret || "",
                containers: p.containers || ""
              };
              allProfiles = [defaultProf];
              localStorage.setItem("azure_datalake_profiles", JSON.stringify(allProfiles));
            }
          } catch {}
        }
      }

      let activeId = localStorage.getItem("azure_datalake_active_profile_id");
      if (!activeId || !allProfiles.some(p => p.id === activeId)) {
        activeId = allProfiles.length > 0 ? allProfiles[0].id : "";
      }

      activeProfileId = activeId;
      currentConfig = allProfiles.find(p => p.id === activeProfileId) || null;

      updateProfileSelects();

      if (currentConfig) {
        document.getElementById("accountBadge").textContent = currentConfig.name + " (" + currentConfig.storageAccount + ")";
        initContainers().then(() => {
          if (activeContainer) loadDirectory();
        });
      } else {
        document.getElementById("accountBadge").textContent = "Nenhum perfil configurado";
        openConfigModal(true);
      }
    }

    function updateProfileSelects() {
      const navSelect = document.getElementById("profileSelect");
      const modalSelect = document.getElementById("modalProfileSelect");

      [navSelect, modalSelect].forEach(sel => {
        if (!sel) return;
        sel.innerHTML = "";
        allProfiles.forEach(p => {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = p.name || p.storageAccount;
          sel.appendChild(opt);
        });
      });

      if (navSelect) navSelect.value = activeProfileId;
      if (modalSelect) modalSelect.value = activeProfileId;

      populateConfigForm(currentConfig);
    }

    async function changeProfile(profId) {
      const prof = allProfiles.find(p => p.id === profId);
      if (!prof) return;

      activeProfileId = prof.id;
      currentConfig = prof;
      localStorage.setItem("azure_datalake_active_profile_id", prof.id);

      updateProfileSelects();
      document.getElementById("accountBadge").textContent = prof.name + " (" + prof.storageAccount + ")";
      currentPrefix = "";
      await initContainers();
      if (activeContainer) {
        await loadDirectory();
      }
    }

    function onModalProfileChange(profId) {
      const prof = allProfiles.find(p => p.id === profId);
      if (prof) {
        populateConfigForm(prof);
      }
    }

    function createNewProfileDraft() {
      const newId = "prof_" + Date.now();
      const emptyProfile = {
        id: newId,
        name: "Novo Perfil",
        storageAccount: "",
        tenantId: "",
        clientId: "",
        clientSecret: "",
        containers: ""
      };
      populateConfigForm(emptyProfile);
      document.getElementById("cfgProfileName").focus();
    }

    function deleteCurrentProfile() {
      const profId = document.getElementById("cfgProfileId").value;
      const prof = allProfiles.find(p => p.id === profId);
      if (!prof) return;

      if (!confirm("Deseja realmente remover o perfil '" + prof.name + "' deste navegador?")) return;

      allProfiles = allProfiles.filter(p => p.id !== profId);
      localStorage.setItem("azure_datalake_profiles", JSON.stringify(allProfiles));

      if (allProfiles.length > 0) {
        activeProfileId = allProfiles[0].id;
        currentConfig = allProfiles[0];
        localStorage.setItem("azure_datalake_active_profile_id", activeProfileId);
        updateProfileSelects();
        showToast("Perfil removido.", "info");
        document.getElementById("accountBadge").textContent = currentConfig.name + " (" + currentConfig.storageAccount + ")";
        initContainers().then(() => { if (activeContainer) loadDirectory(); });
      } else {
        activeProfileId = "";
        currentConfig = null;
        localStorage.removeItem("azure_datalake_active_profile_id");
        updateProfileSelects();
        createNewProfileDraft();
        document.getElementById("accountBadge").textContent = "Não configurado";
      }
    }

    function populateConfigForm(prof) {
      if (!prof) {
        document.getElementById("cfgProfileId").value = "";
        document.getElementById("cfgProfileName").value = "";
        document.getElementById("cfgAccount").value = "";
        document.getElementById("cfgTenant").value = "";
        document.getElementById("cfgClient").value = "";
        document.getElementById("cfgSecret").value = "";
        document.getElementById("cfgContainers").value = "";
        return;
      }

      document.getElementById("cfgProfileId").value = prof.id || "";
      document.getElementById("cfgProfileName").value = prof.name || "";
      document.getElementById("cfgAccount").value = prof.storageAccount || "";
      document.getElementById("cfgTenant").value = prof.tenantId || "";
      document.getElementById("cfgClient").value = prof.clientId || "";
      document.getElementById("cfgSecret").value = prof.clientSecret || "";
      document.getElementById("cfgContainers").value = prof.containers || "";
    }

    function openConfigModal(isNew = false) {
      if (isNew || allProfiles.length === 0) {
        createNewProfileDraft();
      } else {
        updateProfileSelects();
      }
      document.getElementById("configModal").classList.remove("hidden");
    }

    function closeConfigModal() {
      document.getElementById("configModal").classList.add("hidden");
    }

    async function handleTestConnection() {
      const btn = document.getElementById("btnTestConn");
      const feedback = document.getElementById("testConnFeedback");
      feedback.className = "text-xs p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 flex items-center";
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
          feedback.className = "text-xs p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800";
          feedback.innerHTML = '<i class="fa-solid fa-circle-check mr-1.5 text-emerald-600 dark:text-emerald-400"></i> ' + data.message;
        } else {
          feedback.className = "text-xs p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800";
          feedback.innerHTML = '<i class="fa-solid fa-circle-xmark mr-1.5 text-red-600 dark:text-red-400"></i> ' + data.message;
        }
      } catch (err) {
        feedback.className = "text-xs p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800";
        feedback.innerHTML = '<i class="fa-solid fa-circle-xmark mr-1.5 text-red-600 dark:text-red-400"></i> ' + err.message;
      } finally {
        btn.disabled = false;
      }
    }

    async function saveConfig(e) {
      e.preventDefault();
      const profId = document.getElementById("cfgProfileId").value || ("prof_" + Date.now());
      const profName = document.getElementById("cfgProfileName").value.trim() || "Perfil Sem Nome";
      const storageAccount = document.getElementById("cfgAccount").value.trim();
      const tenantId = document.getElementById("cfgTenant").value.trim();
      const clientId = document.getElementById("cfgClient").value.trim();
      const clientSecret = document.getElementById("cfgSecret").value.trim();
      const containers = document.getElementById("cfgContainers").value.trim();

      const profileData = {
        id: profId,
        name: profName,
        storageAccount,
        tenantId,
        clientId,
        clientSecret,
        containers
      };

      const existingIndex = allProfiles.findIndex(p => p.id === profId);
      if (existingIndex >= 0) {
        allProfiles[existingIndex] = profileData;
      } else {
        allProfiles.push(profileData);
      }

      localStorage.setItem("azure_datalake_profiles", JSON.stringify(allProfiles));
      activeProfileId = profId;
      currentConfig = profileData;
      localStorage.setItem("azure_datalake_active_profile_id", profId);

      closeConfigModal();
      showToast("Perfil '" + profName + "' salvo com sucesso!", "success");
      updateProfileSelects();
      document.getElementById("accountBadge").textContent = profName + " (" + storageAccount + ")";
      currentPrefix = "";
      await initContainers();
      if (activeContainer) {
        await loadDirectory();
      }
    }

    function clearConfig() {
      deleteCurrentProfile();
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
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-amber-600 font-medium"><i class="fa-solid fa-triangle-exclamation mr-2"></i> Nenhum container selecionado ou disponível nesta conta.</td></tr>';
        return;
      }
      updateBreadcrumbs();
      clearSelection();

      const tbody = document.getElementById("filesTableBody");
      const emptyState = document.getElementById("emptyState");
      const foldersSection = document.getElementById("foldersSection");
      const foldersGrid = document.getElementById("foldersGrid");
      const itemCountLabel = document.getElementById("itemCountLabel");

      tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Carregando do Azure...</td></tr>';
      foldersSection.classList.add("hidden");
      emptyState.classList.add("hidden");

      try {
        const resp = await fetch("/api/blobs?container=" + encodeURIComponent(activeContainer) + "&prefix=" + encodeURIComponent(currentPrefix), {
          headers: getAuthHeaders()
        });

        if (!resp.ok) {
          const err = await resp.text();
          tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-6 text-center text-red-500 font-medium">Erro ao carregar pasta: ' + err + '</td></tr>';
          return;
        }

        const data = await resp.json();
        currentFiles = data.files || [];
        const folders = data.folders || [];

        // Detecção de Delta Table na pasta atual (_delta_log presente)
        const isCurrentDelta = folders.some(f => f.name === "_delta_log");
        const deltaBanner = document.getElementById("deltaFolderBanner");
        if (deltaBanner) {
          if (isCurrentDelta) {
            deltaBanner.classList.remove("hidden");
          } else {
            deltaBanner.classList.add("hidden");
          }
        }

        // Renderizar Pastas
        if (folders.length > 0) {
          foldersSection.classList.remove("hidden");
          foldersGrid.innerHTML = "";
          folders.forEach(f => {
            const card = document.createElement("div");
            card.className = "flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-all group bg-white dark:bg-slate-900 shadow-xs";

            const chk = document.createElement("input");
            chk.type = "checkbox";
            chk.className = "folder-item-checkbox rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer mr-2 shrink-0";
            chk.dataset.path = f.fullPath;
            chk.dataset.name = f.name;
            chk.dataset.size = "0";
            chk.dataset.folder = "true";
            chk.checked = selectedItems.has(f.fullPath);
            chk.onclick = (e) => e.stopPropagation();
            chk.onchange = () => onItemCheckboxChange(chk);
            card.appendChild(chk);

            const navBtn = document.createElement("button");
            navBtn.type = "button";
            navBtn.className = "flex items-center space-x-2 flex-1 min-w-0 text-left py-0.5";
            navBtn.title = f.name;

            if (f.name === "_delta_log") {
              navBtn.innerHTML = '<i class="fa-solid fa-book-bookmark text-indigo-500 text-base group-hover:scale-110 transition-transform shrink-0"></i><span class="text-xs font-semibold text-indigo-700 dark:text-indigo-300 truncate">_delta_log</span> <span class="text-[9px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-1 py-0.2 rounded font-semibold ml-1">Logs</span>';
            } else {
              navBtn.innerHTML = '<i class="fa-solid fa-folder text-yellow-500 text-base group-hover:scale-110 transition-transform shrink-0"></i><span class="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">' + escapeHtml(f.name) + '</span>';
            }
            navBtn.onclick = () => { currentPrefix = f.fullPath; loadDirectory(); };
            card.appendChild(navBtn);

            const actionsDiv = document.createElement("div");
            actionsDiv.className = "flex items-center space-x-1 shrink-0 ml-1";

            // Se for uma pasta comum, verificar assincronamente se é uma Delta Table
            if (f.name !== "_delta_log") {
              checkIfDeltaTableFolder(activeContainer, f.fullPath).then(isDelta => {
                if (isDelta) {
                  const badge = document.createElement("span");
                  badge.className = "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ml-1.5";
                  badge.innerHTML = '<i class="fa-solid fa-layer-group mr-1"></i>Delta Table';
                  navBtn.appendChild(badge);

                  const sqlBtn = document.createElement("button");
                  sqlBtn.type = "button";
                  sqlBtn.className = "p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-md transition-colors";
                  sqlBtn.title = "Consultar Delta Table '" + escapeQuotes(f.name) + "' (SQL)";
                  sqlBtn.innerHTML = '<i class="fa-solid fa-terminal text-xs"></i>';
                  sqlBtn.onclick = (e) => {
                    e.stopPropagation();
                    openDeltaTableModal(activeContainer, f.fullPath);
                  };
                  actionsDiv.insertBefore(sqlBtn, actionsDiv.firstChild);
                }
              });
            }

            const renBtn = document.createElement("button");
            renBtn.type = "button";
            renBtn.className = "p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition-colors";
            renBtn.title = "Renomear / Mover pasta '" + f.name + "'";
            renBtn.innerHTML = '<i class="fa-solid fa-pencil text-xs"></i>';
            renBtn.onclick = (e) => {
              e.stopPropagation();
              openRenameModal(f.fullPath, true);
            };
            actionsDiv.appendChild(renBtn);

            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors";
            delBtn.title = "Excluir pasta '" + f.name + "'";
            delBtn.innerHTML = '<i class="fa-regular fa-trash-can text-xs"></i>';
            delBtn.onclick = (e) => {
              e.stopPropagation();
              confirmDeleteFolder(f.fullPath, f.name);
            };
            actionsDiv.appendChild(delBtn);

            card.appendChild(actionsDiv);
            foldersGrid.appendChild(card);
          });
        }

        // Renderizar Arquivos
        filterFiles();
        updateSortIcons();
        itemCountLabel.textContent = folders.length + " pasta(s), " + currentFiles.length + " arquivo(s)";

      } catch (ex) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-6 text-center text-red-500">Erro de rede: ' + ex.message + '</td></tr>';
      }
    }

    // ORDENAÇÃO DE ARQUIVOS
    function getSortedFiles(filesList) {
      if (!filesList || filesList.length === 0) return [];
      const sorted = [...filesList];
      const dir = currentSortDirection === "asc" ? 1 : -1;

      sorted.sort((a, b) => {
        if (currentSortColumn === "name") {
          return dir * a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
        } else if (currentSortColumn === "size") {
          return dir * ((a.size || 0) - (b.size || 0));
        } else if (currentSortColumn === "lastModified") {
          const tA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
          const tB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
          return dir * (tA - tB);
        }
        return 0;
      });

      return sorted;
    }

    function sortTable(col) {
      if (currentSortColumn === col) {
        currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc";
      } else {
        currentSortColumn = col;
        currentSortDirection = "asc";
      }
      updateSortIcons();
      filterFiles();
    }

    function updateSortIcons() {
      ["name", "size", "lastModified"].forEach(c => {
        const icon = document.getElementById("sortIcon-" + c);
        if (!icon) return;
        if (c === currentSortColumn) {
          icon.className = currentSortDirection === "asc"
            ? "fa-solid fa-sort-up text-blue-600 dark:text-blue-400 text-xs"
            : "fa-solid fa-sort-down text-blue-600 dark:text-blue-400 text-xs";
        } else {
          icon.className = "fa-solid fa-sort text-slate-300 dark:text-slate-600 text-xs";
        }
      });
    }

    function renderFilesTable(files) {
      const tbody = document.getElementById("filesTableBody");
      const emptyState = document.getElementById("emptyState");
      tbody.innerHTML = "";

      if (files.length === 0) {
        emptyState.classList.remove("hidden");
        updateSelectionBar();
        return;
      }
      emptyState.classList.add("hidden");

      files.forEach(f => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors";

        const iconClass = getFileIcon(f.name);
        const formattedDate = f.lastModified ? new Date(f.lastModified).toLocaleString("pt-BR") : "-";
        const formattedSize = formatSize(f.size);

        tr.innerHTML = \`
          <td class="px-4 py-3 text-center">
            <input type="checkbox" class="file-item-checkbox rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer" data-path="\${escapeQuotes(f.fullPath)}" data-name="\${escapeQuotes(f.name)}" data-size="\${f.size}" data-folder="false" onchange="onItemCheckboxChange(this)" \${selectedItems.has(f.fullPath) ? "checked" : ""}>
          </td>
          <td class="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
            <div class="flex items-center space-x-2.5">
              <i class="\${iconClass}"></i>
              <span class="truncate max-w-md" title="\${escapeQuotes(f.name)}">\${escapeHtml(f.name)}</span>
            </div>
          </td>
          <td class="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs font-mono whitespace-nowrap">\${formattedSize}</td>
          <td class="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">\${formattedDate}</td>
          <td class="px-4 py-3 text-right whitespace-nowrap">
            <div class="inline-flex items-center justify-end space-x-1.5">
              <button onclick="previewFile('\${escapeQuotes(f.fullPath)}', '\${escapeQuotes(f.name)}', \${f.size})" title="Visualizar" class="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-md transition-colors">
                <i class="fa-regular fa-eye mr-1"></i> Ver
              </button>
              <button onclick="downloadFileDirect('\${escapeQuotes(f.fullPath)}', '\${escapeQuotes(f.name)}')" title="Baixar" class="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-white azure-blue azure-blue-hover rounded-md shadow-xs transition-colors">
                <i class="fa-solid fa-download mr-1"></i> Baixar
              </button>
              <button onclick="openRenameModal('\${escapeQuotes(f.fullPath)}', false)" title="Renomear / Mover" class="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition-colors">
                <i class="fa-solid fa-pencil text-xs"></i>
              </button>
              <button onclick="deleteFile('\${escapeQuotes(f.fullPath)}', '\${escapeQuotes(f.name)}')" title="Excluir" class="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors">
                <i class="fa-regular fa-trash-can text-xs"></i>
              </button>
            </div>
          </td>
        \`;
        tbody.appendChild(tr);
      });

      updateSelectionBar();
    }

    function filterFiles() {
      const q = (document.getElementById("searchInput").value || "").toLowerCase();
      const filtered = currentFiles.filter(f => f.name.toLowerCase().includes(q));
      const sorted = getSortedFiles(filtered);
      renderFilesTable(sorted);
    }

    async function refreshCurrentFolder() {
      if (!activeContainer) {
        await initContainers();
      }
      if (activeContainer) {
        loadDirectory();
      }
    }

    // SELEÇÃO EM MASSA & AÇÕES EM LOTE
    function onItemCheckboxChange(cb) {
      const path = cb.dataset.path;
      if (cb.checked) {
        selectedItems.set(path, {
          fullPath: path,
          name: cb.dataset.name,
          size: Number(cb.dataset.size || 0),
          isFolder: cb.dataset.folder === "true"
        });
      } else {
        selectedItems.delete(path);
      }
      updateSelectionBar();
    }

    function toggleSelectAll(checked) {
      const checkboxes = document.querySelectorAll(".file-item-checkbox, .folder-item-checkbox");
      checkboxes.forEach(cb => {
        cb.checked = checked;
        const path = cb.dataset.path;
        if (checked) {
          selectedItems.set(path, {
            fullPath: path,
            name: cb.dataset.name,
            size: Number(cb.dataset.size || 0),
            isFolder: cb.dataset.folder === "true"
          });
        } else {
          selectedItems.delete(path);
        }
      });
      updateSelectionBar();
    }

    function updateSelectionBar() {
      const bar = document.getElementById("batchActionBar");
      const badge = document.getElementById("batchCountBadge");
      const selectAll = document.getElementById("selectAllCheckbox");
      const count = selectedItems.size;

      if (badge) {
        badge.textContent = count + (count === 1 ? " selecionado" : " selecionados");
      }

      if (count > 0) {
        bar.classList.remove("hidden");
      } else {
        bar.classList.add("hidden");
      }

      const allCheckboxes = document.querySelectorAll(".file-item-checkbox, .folder-item-checkbox");
      if (selectAll) {
        selectAll.checked = allCheckboxes.length > 0 && Array.from(allCheckboxes).every(cb => cb.checked);
      }
    }

    function clearSelection() {
      selectedItems.clear();
      const allCheckboxes = document.querySelectorAll(".file-item-checkbox, .folder-item-checkbox, #selectAllCheckbox");
      allCheckboxes.forEach(cb => cb.checked = false);
      updateSelectionBar();
    }

    async function executeBatchDelete() {
      const count = selectedItems.size;
      if (count === 0) return;

      const confirmMsg = "ATENÇÃO: Deseja realmente excluir permanentemente os " + count + " item(ns) selecionado(s)?\\n\\nEsta operação removerá arquivos e subpastas recursivamente.";
      if (!confirm(confirmMsg)) return;

      const toast = showToast("Excluindo " + count + " item(ns)...", "info");
      let deleted = 0;

      for (const item of selectedItems.values()) {
        try {
          if (item.isFolder) {
            await fetch("/api/delete-folder", {
              method: "DELETE",
              headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
              body: JSON.stringify({ container: activeContainer, folderPath: item.fullPath })
            });
          } else {
            await fetch("/api/delete?container=" + encodeURIComponent(activeContainer) + "&blob=" + encodeURIComponent(item.fullPath), {
              method: "DELETE",
              headers: getAuthHeaders()
            });
          }
          deleted++;
        } catch (err) {
          console.error("Erro ao excluir " + item.fullPath, err);
        }
      }

      toast.remove();
      clearSelection();
      showToast(deleted + " item(ns) excluído(s) com sucesso!", "success");
      await loadDirectory();
    }

    async function downloadBatchAsZip() {
      if (selectedItems.size === 0) return;
      const filesToZip = Array.from(selectedItems.values()).filter(i => !i.isFolder);

      if (filesToZip.length === 0) {
        alert("Apenas arquivos individuais podem ser empacotados em lote como ZIP. Selecione um ou mais arquivos.");
        return;
      }

      if (typeof JSZip === "undefined") {
        alert("Biblioteca JSZip não carregada. Verifique sua conexão com a internet.");
        return;
      }

      const toast = showToast("Iniciando download de " + filesToZip.length + " arquivo(s) para o ZIP...", "info");
      try {
        const zip = new JSZip();

        for (let i = 0; i < filesToZip.length; i++) {
          const f = filesToZip[i];
          const span = toast.querySelector("span");
          if (span) span.textContent = "Baixando (" + (i + 1) + "/" + filesToZip.length + "): " + f.name;

          const resp = await fetch("/api/download?container=" + encodeURIComponent(activeContainer) + "&blob=" + encodeURIComponent(f.fullPath), {
            headers: getAuthHeaders()
          });

          if (!resp.ok) {
            console.warn("Falha ao baixar " + f.name + " para o ZIP");
            continue;
          }

          const buf = await resp.arrayBuffer();
          zip.file(f.name, buf);
        }

        const span = toast.querySelector("span");
        if (span) span.textContent = "Compactando arquivo ZIP...";
        const zipBlob = await zip.generateAsync({ type: "blob" });

        const zipUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = zipUrl;
        a.download = (activeContainer || "datalake") + "_lote_" + new Date().toISOString().slice(0, 10) + ".zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(zipUrl);

        toast.remove();
        showToast("ZIP gerado e baixado com sucesso!", "success");
      } catch (err) {
        toast.remove();
        alert("Erro ao gerar ZIP: " + err.message);
      }
    }

    // RENOMEAR / MOVER (ADLS Gen2)
    function openRenameModal(fullPath, isFolder) {
      document.getElementById("renameSourcePath").value = fullPath;
      document.getElementById("renameIsFolder").value = isFolder ? "true" : "false";
      document.getElementById("renameSourceDisplay").textContent = fullPath;
      document.getElementById("renameNewPathInput").value = fullPath;
      document.getElementById("renameModalTitle").textContent = isFolder ? "Renomear / Mover Pasta" : "Renomear / Mover Arquivo";
      document.getElementById("renameModal").classList.remove("hidden");
      setTimeout(() => {
        const input = document.getElementById("renameNewPathInput");
        input.focus();
        input.select();
      }, 50);
    }

    function closeRenameModal() {
      document.getElementById("renameModal").classList.add("hidden");
    }

    async function submitRename() {
      const sourcePath = document.getElementById("renameSourcePath").value.trim();
      const newPath = document.getElementById("renameNewPathInput").value.trim();
      const btn = document.getElementById("renameSubmitBtn");

      if (!newPath) {
        alert("Informe o novo nome ou caminho.");
        return;
      }
      if (sourcePath === newPath) {
        closeRenameModal();
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Salvando...';

      try {
        const resp = await fetch("/api/rename", {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({
            container: activeContainer,
            sourcePath: sourcePath,
            newPath: newPath
          })
        });

        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(errText);
        }

        const res = await resp.json();
        closeRenameModal();
        showToast(res.message || "Item renomeado/movido com sucesso!", "success");
        await loadDirectory();
      } catch (err) {
        alert("Erro ao renomear/mover: " + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = 'Salvar Alteração';
      }
    }

    // PREVIEW DE ARQUIVO & DATA DISCOVERY
    function switchPreviewTab(tab) {
      currentModalState.activeTab = tab;
      const btnData = document.getElementById("tabBtnPreviewData");
      const btnMeta = document.getElementById("tabBtnPreviewMeta");
      const viewData = document.getElementById("previewDataView");
      const viewMeta = document.getElementById("previewMetadataView");

      if (tab === "data") {
        btnData.className = "px-2.5 py-1 font-semibold rounded-md bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs flex items-center";
        btnMeta.className = "px-2.5 py-1 font-semibold rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center";
        viewData.classList.remove("hidden");
        viewMeta.classList.add("hidden");
      } else {
        btnMeta.className = "px-2.5 py-1 font-semibold rounded-md bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs flex items-center";
        btnData.className = "px-2.5 py-1 font-semibold rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center";
        viewMeta.classList.remove("hidden");
        viewData.classList.add("hidden");
        renderPreviewMetadata();
      }
    }

    function renderPreviewMetadata() {
      const container = document.getElementById("previewMetadataContent");
      const meta = currentModalState.metadata || {};
      
      let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">';
      
      const addCard = (label, val, canCopy = false) => {
        let copyBtn = "";
        if (canCopy && val) {
          copyBtn = '<button onclick="copyToClipboard(\\'' + escapeQuotes(String(val)) + '\\')" class="ml-2 text-blue-600 dark:text-blue-400 hover:underline"><i class="fa-regular fa-copy"></i> Copiar</button>';
        }
        return '<div class="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">' +
          '<div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">' + label + '</div>' +
          '<div class="font-mono text-slate-800 dark:text-slate-100 break-all font-semibold flex items-center justify-between">' +
          '<span>' + escapeHtml(String(val || "-")) + '</span>' + copyBtn +
          '</div></div>';
      };

      html += addCard("Nome do Blob", meta.name);
      html += addCard("Caminho Completo", meta.fullPath, true);
      html += addCard("Container", meta.container);
      html += addCard("Tamanho do Arquivo", meta.formattedSize + " (" + Number(meta.size || 0).toLocaleString() + " bytes)");
      html += addCard("Content-Type (MIME)", meta.contentType);
      html += addCard("ETag", meta.etag);
      html += addCard("Última Modificação", meta.lastModified);
      html += addCard("Tipo de Blob", meta.blobType || "BlockBlob");

      if (meta.parquetTotalRows !== undefined) {
        html += addCard("Total de Linhas no Parquet", Number(meta.parquetTotalRows).toLocaleString());
        html += addCard("Total de Colunas no Parquet", Number(meta.parquetTotalCols).toLocaleString());
      }

      html += '</div>';
      container.innerHTML = html;
    }

    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        showToast("Copiado para a área de transferência!", "success");
      });
    }

    async function previewFile(fullPath, name, size) {
      const modal = document.getElementById("previewModal");
      const title = document.getElementById("previewTitle");
      const subtitle = document.getElementById("previewSubtitle");
      const content = document.getElementById("previewContent");
      const dlBtn = document.getElementById("previewDownloadBtn");
      const toolbar = document.getElementById("previewDataToolbar");
      const searchInput = document.getElementById("modalSearchInput");
      const copyJsonBtn = document.getElementById("previewCopyJsonBtn");
      const exportCsvBtn = document.getElementById("previewExportCsvBtn");

      // Reset modal state
      currentModalState = {
        fullPath,
        name,
        size,
        columns: [],
        originalRows: [],
        filteredRows: [],
        sortCol: null,
        sortDir: "asc",
        types: {},
        nullCounts: {},
        metadata: {
          name,
          fullPath,
          size,
          formattedSize: formatSize(size),
          container: activeContainer
        },
        activeTab: "data"
      };

      searchInput.value = "";
      toolbar.classList.add("hidden");
      copyJsonBtn.classList.add("hidden");
      exportCsvBtn.classList.add("hidden");
      switchPreviewTab("data");

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

        // Armazena headers HTTP nos metadados
        currentModalState.metadata.contentType = resp.headers.get("content-type") || "-";
        currentModalState.metadata.lastModified = resp.headers.get("last-modified") || "-";
        currentModalState.metadata.etag = resp.headers.get("etag") || "-";
        currentModalState.metadata.blobType = resp.headers.get("x-ms-blob-type") || "BlockBlob";

        const ext = name.split(".").pop().toLowerCase();

        if (ext === "parquet") {
          toolbar.classList.remove("hidden");
          copyJsonBtn.classList.remove("hidden");
          exportCsvBtn.classList.remove("hidden");
          const arrayBuffer = await resp.arrayBuffer();
          await renderParquetPreview(arrayBuffer, content, title, subtitle, fullPath, name);
        } else if (ext === "csv" || ext === "tsv") {
          toolbar.classList.remove("hidden");
          copyJsonBtn.classList.remove("hidden");
          exportCsvBtn.classList.remove("hidden");
          const text = await resp.text();
          renderCsvPreview(text, content, ext === "tsv" ? "\\t" : ",");
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
          content.innerHTML = '<div class="flex justify-center p-4"><img src="' + imgUrl + '" class="max-h-[70vh] rounded-lg shadow-md"></div>';
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

    function closePreviewModal() {
      document.getElementById("previewModal").classList.add("hidden");
      document.getElementById("previewContent").innerHTML = "";
      document.getElementById("previewMetadataContent").innerHTML = "";
    }

    function calculateColumnStats(columns, rows) {
      const types = {};
      const nullCounts = {};

      columns.forEach(col => {
        let nulls = 0;
        let isNum = true;
        let isBool = true;
        let hasVal = false;

        rows.forEach(r => {
          const v = r[col];
          if (v === null || v === undefined || v === "") {
            nulls++;
          } else {
            hasVal = true;
            if (typeof v === "number") {
              // number
            } else if (typeof v === "string" && !isNaN(Number(v)) && v.trim() !== "") {
              // numeric string
            } else {
              isNum = false;
            }
            if (typeof v !== "boolean" && v !== "true" && v !== "false") {
              isBool = false;
            }
          }
        });

        nullCounts[col] = nulls;
        if (!hasVal) types[col] = "null";
        else if (isNum) types[col] = "num";
        else if (isBool) types[col] = "bool";
        else types[col] = "str";
      });

      return { types, nullCounts };
    }

    function renderCsvPreview(csvText, container, delimiter) {
      const lines = csvText.trim().split(/\\r?\\n/).slice(0, 201);
      if (lines.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm">Arquivo CSV vazio.</p>';
        return;
      }

      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ""));
      const rows = [];

      lines.slice(1).forEach(rowStr => {
        if (!rowStr.trim()) return;
        const cols = rowStr.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ""));
        const rowObj = {};
        headers.forEach((h, idx) => {
          rowObj[h] = cols[idx] !== undefined ? cols[idx] : "";
        });
        rows.push(rowObj);
      });

      const { types, nullCounts } = calculateColumnStats(headers, rows);
      currentModalState.columns = headers;
      currentModalState.originalRows = rows;
      currentModalState.filteredRows = [...rows];
      currentModalState.types = types;
      currentModalState.nullCounts = nullCounts;

      renderModalTabularData();
      updateModalRowStats();
    }

    // PARQUET PREVIEW & DECODING (CLIENT-SIDE)
    let hyparquetModule = null;
    let compressorsModule = null;

    async function loadParquetModules() {
      if (!hyparquetModule) {
        hyparquetModule = await import('https://cdn.jsdelivr.net/npm/hyparquet/+esm');
      }
      if (!compressorsModule) {
        try {
          const comp = await import('https://cdn.jsdelivr.net/npm/hyparquet-compressors/+esm');
          compressorsModule = comp.compressors;
        } catch (e) {
          console.warn("Módulo opcional hyparquet-compressors não carregado:", e);
        }
      }
      return { hyparquet: hyparquetModule, compressors: compressorsModule };
    }

    async function renderParquetPreview(arrayBuffer, container, titleEl, subtitleEl, fullPath, name) {
      try {
        const { hyparquet, compressors } = await loadParquetModules();

        const metadata = hyparquet.parquetMetadata(arrayBuffer);
        const schema = hyparquet.parquetSchema(metadata);
        const allColumns = schema.children ? schema.children.map(e => e.element.name) : [];
        const totalCols = allColumns.length;
        const totalRows = Number(metadata.num_rows || 0);

        currentModalState.metadata.parquetTotalRows = totalRows;
        currentModalState.metadata.parquetTotalCols = totalCols;

        subtitleEl.innerHTML += ' <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 ml-2"><i class="fa-solid fa-table-columns mr-1"></i>' + totalCols + ' colunas</span>' +
          ' <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 ml-1"><i class="fa-solid fa-bars mr-1"></i>' + totalRows.toLocaleString() + ' linhas</span>';

        const displayedColumns = allColumns.slice(0, 100);
        const rowsToRead = Math.min(totalRows, 100);

        const readOptions = {
          file: arrayBuffer,
          columns: displayedColumns,
          rowStart: 0,
          rowEnd: rowsToRead
        };
        if (compressors) {
          readOptions.compressors = compressors;
        }

        const rows = await hyparquet.parquetReadObjects(readOptions);

        if (!rows || rows.length === 0) {
          container.innerHTML = '<p class="text-slate-400 text-sm p-4">Arquivo Parquet sem registros ou vazio.</p>';
          return;
        }

        const { types, nullCounts } = calculateColumnStats(displayedColumns, rows);
        currentModalState.columns = displayedColumns;
        currentModalState.originalRows = rows;
        currentModalState.filteredRows = [...rows];
        currentModalState.types = types;
        currentModalState.nullCounts = nullCounts;

        renderModalTabularData();
        updateModalRowStats();
      } catch (err) {
        console.error("Erro ao decodificar Parquet:", err);
        container.innerHTML = '<div class="p-6 bg-red-50 text-red-700 rounded-xl text-center"><p class="font-bold">Falha ao decodificar Parquet</p><p class="text-xs mt-1">' + escapeHtml(err.message || String(err)) + '</p></div>';
      }
    }

    function renderModalTabularData() {
      const container = document.getElementById("previewContent");
      const { columns, filteredRows, types, nullCounts, sortCol, sortDir, originalRows } = currentModalState;

      if (!columns || columns.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-xs p-4">Nenhuma coluna disponível.</p>';
        return;
      }

      let html = '<div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl custom-scroll max-h-[62vh]">';
      html += '<table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left">';
      html += '<thead class="bg-slate-100 dark:bg-slate-800/90 font-bold text-slate-700 dark:text-slate-200 sticky top-0 z-10 shadow-xs"><tr>';
      html += '<th class="px-3 py-2.5 w-12 text-slate-400 dark:text-slate-500 text-center font-mono select-none">#</th>';

      columns.forEach(col => {
        const type = types[col] || "str";
        const nulls = nullCounts[col] || 0;
        const total = originalRows.length || 1;
        const nullPct = Math.round((nulls / total) * 100);

        let sortIcon = '<i class="fa-solid fa-sort text-slate-300 dark:text-slate-600 text-[10px] ml-1"></i>';
        if (sortCol === col) {
          sortIcon = sortDir === "asc"
            ? '<i class="fa-solid fa-sort-up text-blue-600 dark:text-blue-400 text-[10px] ml-1"></i>'
            : '<i class="fa-solid fa-sort-down text-blue-600 dark:text-blue-400 text-[10px] ml-1"></i>';
        }

        let typeBadge = '<span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono uppercase">' + type + '</span>';
        let nullBadge = nullPct > 0 ? '<span class="text-[9px] px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-sans ml-1">' + nullPct + '% null</span>' : '';

        html += '<th class="px-4 py-2.5 whitespace-nowrap border-b border-slate-200 dark:border-slate-800 cursor-pointer select-none hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors" onclick="sortModalTable(\\'' + escapeQuotes(col) + '\\')">';
        html += '<div class="flex items-center justify-between space-x-2">';
        html += '<div class="flex items-center"><span class="font-bold text-slate-800 dark:text-slate-100">' + escapeHtml(col) + '</span>' + sortIcon + '</div>';
        html += '<div class="flex items-center">' + typeBadge + nullBadge + '</div>';
        html += '</div></th>';
      });

      html += '</tr></thead><tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900 font-mono">';

      if (filteredRows.length === 0) {
        html += '<tr><td colspan="' + (columns.length + 1) + '" class="px-6 py-10 text-center text-slate-400 dark:text-slate-500 font-sans">Nenhum registro encontrado com o filtro atual.</td></tr>';
      } else {
        filteredRows.forEach((row, idx) => {
          html += '<tr class="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors">';
          html += '<td class="px-3 py-2 text-center text-slate-400 dark:text-slate-500 whitespace-nowrap text-[11px] font-sans">' + (idx + 1) + '</td>';
          columns.forEach(col => {
            const val = row[col];
            let displayVal = "";
            if (val === null || val === undefined || val === "") {
              displayVal = '<span class="text-slate-300 dark:text-slate-600 italic">null</span>';
            } else if (typeof val === "object") {
              displayVal = escapeHtml(JSON.stringify(val));
            } else {
              displayVal = escapeHtml(String(val));
            }
            html += '<td class="px-4 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300 max-w-xs truncate" title="' + escapeHtml(String(val ?? '')) + '">' + displayVal + '</td>';
          });
          html += '</tr>';
        });
      }

      html += '</tbody></table></div>';
      container.innerHTML = html;
    }

    function sortModalTable(col) {
      if (currentModalState.sortCol === col) {
        currentModalState.sortDir = currentModalState.sortDir === "asc" ? "desc" : "asc";
      } else {
        currentModalState.sortCol = col;
        currentModalState.sortDir = "asc";
      }

      const dir = currentModalState.sortDir === "asc" ? 1 : -1;
      currentModalState.filteredRows.sort((a, b) => {
        const vA = a[col];
        const vB = b[col];
        if (vA == null && vB == null) return 0;
        if (vA == null) return 1;
        if (vB == null) return -1;
        if (typeof vA === "number" && typeof vB === "number") return dir * (vA - vB);
        return dir * String(vA).localeCompare(String(vB), undefined, { numeric: true, sensitivity: "base" });
      });

      renderModalTabularData();
    }

    function filterModalRows(query) {
      const q = (query || "").trim().toLowerCase();
      if (!q) {
        currentModalState.filteredRows = [...currentModalState.originalRows];
      } else {
        const cols = currentModalState.columns;
        currentModalState.filteredRows = currentModalState.originalRows.filter(row => {
          return cols.some(col => String(row[col] ?? "").toLowerCase().includes(q));
        });
      }

      if (currentModalState.sortCol) {
        const col = currentModalState.sortCol;
        const dir = currentModalState.sortDir === "asc" ? 1 : -1;
        currentModalState.filteredRows.sort((a, b) => {
          const vA = a[col];
          const vB = b[col];
          if (vA == null && vB == null) return 0;
          if (vA == null) return 1;
          if (vB == null) return -1;
          if (typeof vA === "number" && typeof vB === "number") return dir * (vA - vB);
          return dir * String(vA).localeCompare(String(vB), undefined, { numeric: true, sensitivity: "base" });
        });
      }

      renderModalTabularData();
      updateModalRowStats();
    }

    function updateModalRowStats() {
      const stats = document.getElementById("modalRowStats");
      if (!stats) return;
      const total = currentModalState.originalRows.length;
      const filtered = currentModalState.filteredRows.length;
      if (filtered === total) {
        stats.textContent = "Exibindo todos os " + total + " registros da amostra";
      } else {
        stats.textContent = "Exibindo " + filtered + " de " + total + " registros";
      }
    }

    function copyModalSampleJson() {
      const data = currentModalState.filteredRows;
      if (!data || data.length === 0) {
        alert("Nenhum dado na amostra para copiar.");
        return;
      }
      navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
        showToast("Amostra (" + data.length + " linhas) copiada como JSON!", "success");
      });
    }

    function exportModalSampleCsv() {
      const { columns, filteredRows, name } = currentModalState;
      if (!filteredRows || filteredRows.length === 0) {
        alert("Nenhum dado na amostra para exportar.");
        return;
      }

      const escapeCsvCell = (val) => {
        if (val === null || val === undefined) return "";
        const str = typeof val === "object" ? JSON.stringify(val) : String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\\n") || str.includes("\\r")) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      const headerLine = columns.map(escapeCsvCell).join(",");
      const dataLines = filteredRows.map(row => columns.map(c => escapeCsvCell(row[c])).join(","));
      const csvContent = "\\uFEFF" + [headerLine, ...dataLines].join("\\r\\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const baseName = name.replace(/\\.[^/.]+$/, "");
      a.download = baseName + "_amostra.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Amostra CSV exportada com sucesso!", "success");
    }

    // DOWNLOAD DIRETO
    async function downloadFileDirect(fullPath, name) {
      const url = "/api/download?container=" + encodeURIComponent(activeContainer) + "&blob=" + encodeURIComponent(fullPath);
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

    // EXCLUIR PASTA RECURSIVAMENTE
    async function confirmDeleteFolder(fullPath, name) {
      const msg = "ATENÇÃO: Deseja realmente excluir a pasta '" + name + "' e TODOS os seus arquivos e subpastas?\\n\\nEsta operação é permanente e removerá todos os dados sob o caminho:\\n" + fullPath;
      if (!confirm(msg)) return;

      const toast = showToast("Excluindo pasta '" + name + "'...", "info");
      try {
        const resp = await fetch("/api/delete-folder", {
          method: "DELETE",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            container: activeContainer,
            folderPath: fullPath
          })
        });

        toast.remove();
        if (resp.ok) {
          const res = await resp.json();
          showToast(res.message || "Pasta excluída com sucesso!", "success");
          await loadDirectory();
        } else {
          const errText = await resp.text();
          alert("Erro ao excluir pasta: " + errText);
        }
      } catch (err) {
        toast.remove();
        alert("Erro de conexão ao excluir pasta: " + err.message);
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

    // UPLOAD DRAG & DROP & PASTA COMPLETA
    let selectedFilesToUpload = [];

    function setupUploadDropZone() {
      const dropZone = document.getElementById("dropZone");
      const fileInput = document.getElementById("fileInput");
      const folderInput = document.getElementById("folderUploadInput");

      dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.classList.add("border-blue-500", "bg-blue-50/50", "dark:bg-slate-800/80");
      };
      dropZone.ondragleave = () => {
        dropZone.classList.remove("border-blue-500", "bg-blue-50/50", "dark:bg-slate-800/80");
      };
      dropZone.ondrop = async (e) => {
        e.preventDefault();
        dropZone.classList.remove("border-blue-500", "bg-blue-50/50", "dark:bg-slate-800/80");
        
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
          const collected = [];
          for (let i = 0; i < e.dataTransfer.items.length; i++) {
            const item = e.dataTransfer.items[i];
            const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
            if (entry) {
              const files = await traverseDirectoryEntry(entry);
              collected.push(...files);
            }
          }
          if (collected.length > 0) {
            handleFilesSelected(collected);
            return;
          }
        }
        if (e.dataTransfer.files) {
          handleFilesSelected(e.dataTransfer.files);
        }
      };

      fileInput.onchange = (e) => {
        if (e.target.files) handleFilesSelected(e.target.files);
      };

      if (folderInput) {
        folderInput.onchange = (e) => {
          if (e.target.files) handleFilesSelected(e.target.files);
        };
      }
    }

    async function traverseDirectoryEntry(entry, path = "") {
      if (entry.isFile) {
        return new Promise((resolve) => {
          entry.file((file) => {
            file.customRelativePath = path + file.name;
            resolve([file]);
          });
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const readAllEntries = async () => {
          const entries = [];
          let batch;
          do {
            batch = await new Promise((resolve) => dirReader.readEntries(resolve));
            if (batch && batch.length) entries.push(...batch);
          } while (batch && batch.length > 0);
          return entries;
        };
        const entries = await readAllEntries();
        const nested = await Promise.all(entries.map((e) => traverseDirectoryEntry(e, path + entry.name + "/")));
        return nested.flat();
      }
      return [];
    }

    function handleFilesSelected(files) {
      selectedFilesToUpload = Array.from(files);
      const list = document.getElementById("selectedFilesList");
      const btn = document.getElementById("startUploadBtn");

      if (selectedFilesToUpload.length > 0) {
        list.classList.remove("hidden");
        list.innerHTML = "";
        selectedFilesToUpload.forEach(f => {
          const relPath = f.customRelativePath || f.webkitRelativePath || f.name;
          const div = document.createElement("div");
          div.className = "text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded flex justify-between";
          div.innerHTML = '<span class="font-medium text-slate-800 dark:text-slate-200 truncate mr-2" title="' + escapeQuotes(relPath) + '">' + escapeHtml(relPath) + '</span><span class="text-slate-400 font-mono shrink-0">' + formatSize(f.size) + '</span>';
          list.appendChild(div);
        });
        btn.disabled = false;
      }
    }

    async function performUpload() {
      if (selectedFilesToUpload.length === 0) return;
      const btn = document.getElementById("startUploadBtn");
      const progressContainer = document.getElementById("uploadProgressContainer");
      const progressBar = document.getElementById("uploadProgressBar");
      const progressText = document.getElementById("uploadProgressText");
      const progressPercent = document.getElementById("uploadProgressPercent");

      btn.disabled = true;
      progressContainer.classList.remove("hidden");

      let successCount = 0;
      const total = selectedFilesToUpload.length;

      for (let i = 0; i < total; i++) {
        const file = selectedFilesToUpload[i];
        const relPath = file.customRelativePath || file.webkitRelativePath || file.name;
        const targetBlob = currentPrefix + relPath;

        const pct = Math.round((i / total) * 100);
        progressBar.style.width = pct + "%";
        progressPercent.textContent = pct + "%";
        progressText.textContent = "Enviando (" + (i + 1) + "/" + total + "): " + relPath;

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
          console.error("Falha ao enviar " + relPath, err);
        }
      }

      progressBar.style.width = "100%";
      progressPercent.textContent = "100%";
      progressText.textContent = "Envio concluído!";

      setTimeout(() => {
        progressContainer.classList.add("hidden");
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-arrow-up-from-bracket mr-1"></i> Iniciar Envio';
        selectedFilesToUpload = [];
        document.getElementById("selectedFilesList").innerHTML = "";
        document.getElementById("selectedFilesList").classList.add("hidden");
        document.getElementById("fileInput").value = "";
        const folderInput = document.getElementById("folderUploadInput");
        if (folderInput) folderInput.value = "";
        showToast(successCount + " arquivo(s) enviado(s) com sucesso!", "success");
        switchTab("files");
        loadDirectory();
      }, 700);
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
      if (ext === "parquet") return "fa-solid fa-table-cells text-emerald-600";
      if (["csv", "tsv", "xlsx"].includes(ext)) return "fa-solid fa-table text-emerald-600";
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

    // ==========================================
    // DELTA LAKE & SQL QUERY CONSOLE (CLIENT-SIDE)
    // ==========================================
    const deltaFolderCache = new Map();
    let alasqlModule = null;

    let currentDeltaState = {
      container: "",
      tablePrefix: "",
      tableName: "",
      activeFiles: [],
      schema: null,
      allRows: [],
      columns: [],
      queryResult: [],
      page: 1,
      pageSize: 50,
      totalPages: 1
    };

    async function loadAlaSQL() {
      if (alasqlModule) return alasqlModule;
      try {
        const mod = await import('https://cdn.jsdelivr.net/npm/alasql@4.6.4/+esm');
        alasqlModule = mod.default || mod;
        return alasqlModule;
      } catch (e) {
        console.warn("[DeltaLake] Falha ao carregar AlaSQL via CDN:", e);
        return null;
      }
    }

    async function checkIfDeltaTableFolder(container, path) {
      const cacheKey = container + ":" + path;
      if (deltaFolderCache.has(cacheKey)) return deltaFolderCache.get(cacheKey);
      try {
        const resp = await fetch("/api/blobs?container=" + encodeURIComponent(container) + "&prefix=" + encodeURIComponent(path + "_delta_log/"), {
          headers: getAuthHeaders()
        });
        if (!resp.ok) {
          deltaFolderCache.set(cacheKey, false);
          return false;
        }
        const data = await resp.json();
        const hasLogs = (data.files && data.files.length > 0) || (data.folders && data.folders.length > 0);
        deltaFolderCache.set(cacheKey, hasLogs);
        return hasLogs;
      } catch (e) {
        deltaFolderCache.set(cacheKey, false);
        return false;
      }
    }

    function closeDeltaQueryModal() {
      const modal = document.getElementById("deltaQueryModal");
      if (modal) modal.classList.add("hidden");
    }

    function setDeltaLoading(show, text = "") {
      const overlay = document.getElementById("deltaLoadingOverlay");
      const textEl = document.getElementById("deltaLoadingText");
      if (!overlay) return;
      if (show) {
        overlay.classList.remove("hidden");
        if (textEl && text) textEl.textContent = text;
      } else {
        overlay.classList.add("hidden");
      }
    }

    async function openDeltaTableModal(container, tablePrefix) {
      const modal = document.getElementById("deltaQueryModal");
      if (!modal) return;
      modal.classList.remove("hidden");

      if (tablePrefix && !tablePrefix.endsWith("/")) {
        tablePrefix += "/";
      }

      const rawName = tablePrefix.replace(/\/$/, "").split("/").pop() || "delta_table";
      currentDeltaState = {
        container,
        tablePrefix,
        tableName: rawName,
        activeFiles: [],
        schema: null,
        allRows: [],
        columns: [],
        queryResult: [],
        page: 1,
        pageSize: 50,
        totalPages: 1
      };

      document.getElementById("deltaModalTitle").textContent = "Delta Table: " + rawName;
      document.getElementById("deltaModalSubtitle").textContent = container + " / " + tablePrefix;
      document.getElementById("deltaModalBadges").innerHTML = '<span class="text-xs text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Identificando...</span>';
      document.getElementById("deltaTableContent").innerHTML = '<p class="text-slate-400 text-xs p-4">Iniciando leitura dos logs...</p>';
      
      const sqlInput = document.getElementById("deltaSqlInput");
      sqlInput.value = "SELECT * FROM delta_table LIMIT 50;";
      sqlInput.onkeydown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          executeDeltaQuery();
        }
      };

      document.getElementById("deltaExecutionStats").innerHTML = '<span>Dica: Pressione <b>Ctrl + Enter</b> para executar</span>';
      setDeltaLoading(true, "Lendo histórico de commits em _delta_log/...");

      try {
        // 1. Listar commits no _delta_log/
        const logResp = await fetch("/api/blobs?container=" + encodeURIComponent(container) + "&prefix=" + encodeURIComponent(tablePrefix + "_delta_log/"), {
          headers: getAuthHeaders()
        });

        if (!logResp.ok) {
          throw new Error("Não foi possível acessar a pasta _delta_log/ (" + logResp.status + ")");
        }

        const logData = await logResp.json();
        const commitFiles = (logData.files || [])
          .filter(f => f.name.endsWith(".json"))
          .sort((a, b) => a.name.localeCompare(b.name));

        if (commitFiles.length === 0) {
          throw new Error("Nenhum arquivo de commit .json encontrado em _delta_log/");
        }

        setDeltaLoading(true, "Processando " + commitFiles.length + " commit(s) Delta Lake...");

        // 2. Resolver commits sequencialmente (add vs remove)
        const activeFilesMap = new Map();
        let detectedSchema = null;

        for (const cf of commitFiles) {
          const cResp = await fetch("/api/preview?container=" + encodeURIComponent(container) + "&blob=" + encodeURIComponent(cf.fullPath), {
            headers: getAuthHeaders()
          });
          if (!cResp.ok) continue;
          const text = await cResp.text();
          const lines = text.split("\n");
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const action = JSON.parse(line);
              if (action.metaData) {
                detectedSchema = action.metaData;
              }
              if (action.add) {
                const path = decodeURIComponent(action.add.path);
                activeFilesMap.set(path, action.add);
              }
              if (action.remove) {
                const path = decodeURIComponent(action.remove.path);
                activeFilesMap.delete(path);
              }
            } catch (jsonErr) {}
          }
        }

        const activeFiles = Array.from(activeFilesMap.values());
        currentDeltaState.activeFiles = activeFiles;
        currentDeltaState.schema = detectedSchema;

        if (activeFiles.length === 0) {
          throw new Error("A Delta Table não possui arquivos Parquet ativos no commit atual.");
        }

        // 3. Teto seguro de leitura de arquivos (50 MB - ADR 0005 & R-5)
        const MAX_BYTES = 52428800;
        let totalSize = 0;
        const filesToLoad = [];
        for (const f of activeFiles) {
          if (totalSize + (f.size || 0) > MAX_BYTES && filesToLoad.length > 0) {
            break;
          }
          filesToLoad.push(f);
          totalSize += (f.size || 0);
        }

        setDeltaLoading(true, "Carregando dados de " + filesToLoad.length + " arquivo(s) Parquet...");

        // 4. Carregar e parsear Parquet com hyparquet
        const { hyparquet, compressors } = await loadParquetModules();
        const loadedRows = [];

        for (let i = 0; i < filesToLoad.length; i++) {
          const f = filesToLoad[i];
          setDeltaLoading(true, "Lendo arquivo " + (i + 1) + " de " + filesToLoad.length + " (" + Math.round((f.size || 0)/1024) + " KB)...");
          const fullBlob = tablePrefix + f.path;
          const fResp = await fetch("/api/preview?container=" + encodeURIComponent(container) + "&blob=" + encodeURIComponent(fullBlob), {
            headers: getAuthHeaders()
          });
          if (!fResp.ok) continue;
          const arrayBuffer = await fResp.arrayBuffer();
          const readOpts = { file: arrayBuffer, rowStart: 0, rowEnd: 2000 };
          if (compressors) readOpts.compressors = compressors;
          const rows = await hyparquet.parquetReadObjects(readOpts);
          if (rows && rows.length > 0) {
            if (f.partitionValues) {
              rows.forEach(r => Object.assign(r, f.partitionValues));
            }
            loadedRows.push(...rows);
          }
          if (loadedRows.length >= 10000) break; // Teto de segurança para estabilidade da UI
        }

        currentDeltaState.allRows = loadedRows;
        currentDeltaState.queryResult = loadedRows;
        const columns = loadedRows.length > 0 ? Object.keys(loadedRows[0]) : [];
        currentDeltaState.columns = columns;

        // Atualizar Badges no Cabeçalho
        const badgesHtml = 
          '<span class="bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-semibold"><i class="fa-solid fa-table-columns mr-1"></i>' + columns.length + ' colunas</span>' +
          '<span class="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-xs px-2 py-0.5 rounded-full font-semibold ml-1"><i class="fa-solid fa-database mr-1"></i>' + activeFiles.length + ' arquivos ativos</span>' +
          '<span class="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full font-medium ml-1">' + loadedRows.length.toLocaleString() + ' linhas carregadas</span>';
        document.getElementById("deltaModalBadges").innerHTML = badgesHtml;

        // Renderizar Primeira Página
        currentDeltaState.page = 1;
        renderDeltaTablePage();

        setDeltaLoading(false);
      } catch (err) {
        console.error("[DeltaLake] Erro ao abrir Delta Table:", err);
        setDeltaLoading(false);
        document.getElementById("deltaTableContent").innerHTML = 
          '<div class="p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-center text-red-700 dark:text-red-300">' +
          '<i class="fa-solid fa-triangle-exclamation text-2xl mb-2"></i>' +
          '<p class="font-bold">Não foi possível carregar a Delta Table</p>' +
          '<p class="text-xs mt-1 text-slate-600 dark:text-slate-400">' + escapeHtml(err.message || String(err)) + '</p>' +
          '</div>';
      }
    }

    function renderDeltaTablePage() {
      const container = document.getElementById("deltaTableContent");
      const { queryResult, page, pageSize } = currentDeltaState;

      if (!queryResult || queryResult.length === 0) {
        container.innerHTML = '<div class="p-8 text-center text-slate-400 text-xs"><i class="fa-solid fa-table text-2xl mb-2 text-slate-300"></i><p>Nenhum registro encontrado para esta consulta.</p></div>';
        document.getElementById("deltaPaginationInfo").textContent = "0 registros";
        document.getElementById("deltaPageIndicator").textContent = "0 / 0";
        document.getElementById("deltaPrevPageBtn").disabled = true;
        document.getElementById("deltaNextPageBtn").disabled = true;
        return;
      }

      const totalRows = queryResult.length;
      const totalPages = Math.ceil(totalRows / pageSize) || 1;
      currentDeltaState.totalPages = totalPages;

      const startIdx = (page - 1) * pageSize;
      const endIdx = Math.min(startIdx + pageSize, totalRows);
      const pageRows = queryResult.slice(startIdx, endIdx);

      const columns = Object.keys(pageRows[0] || {});

      let html = '<div class="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl custom-scroll max-h-[50vh]">';
      html += '<table class="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left">';
      html += '<thead class="bg-slate-100 dark:bg-slate-800/90 font-bold text-slate-700 dark:text-slate-200 sticky top-0 z-10 shadow-xs"><tr>';
      html += '<th class="px-3 py-2.5 w-12 text-slate-400 dark:text-slate-500 text-center font-mono select-none">#</th>';

      columns.forEach(col => {
        html += '<th class="px-3 py-2.5 whitespace-nowrap"><div class="flex items-center space-x-1 font-mono text-slate-800 dark:text-slate-100"><span>' + escapeHtml(col) + '</span></div></th>';
      });
      html += '</tr></thead><tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">';

      pageRows.forEach((row, idx) => {
        const rowNum = startIdx + idx + 1;
        html += '<tr class="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors">';
        html += '<td class="px-3 py-2 text-slate-400 dark:text-slate-500 font-mono text-center select-none">' + rowNum + '</td>';
        columns.forEach(col => {
          html += '<td class="px-3 py-2 whitespace-nowrap text-slate-700 dark:text-slate-300 truncate max-w-xs">' + formatDeltaCellValue(row[col]) + '</td>';
        });
        html += '</tr>';
      });

      html += '</tbody></table></div>';
      container.innerHTML = html;

      // Atualizar Paginação
      document.getElementById("deltaPaginationInfo").textContent = "Exibindo " + (startIdx + 1) + "–" + endIdx + " de " + totalRows.toLocaleString() + " registro(s)";
      document.getElementById("deltaPageIndicator").textContent = page + " / " + totalPages;
      document.getElementById("deltaPrevPageBtn").disabled = page <= 1;
      document.getElementById("deltaNextPageBtn").disabled = page >= totalPages;
    }

    function deltaChangePage(delta) {
      const newPage = currentDeltaState.page + delta;
      if (newPage >= 1 && newPage <= currentDeltaState.totalPages) {
        currentDeltaState.page = newPage;
        renderDeltaTablePage();
      }
    }

    function formatDeltaCellValue(val) {
      if (val === null || val === undefined) return '<span class="text-slate-400 italic font-mono text-[11px]">null</span>';
      if (typeof val === "object") {
        const jsonStr = JSON.stringify(val);
        return '<span class="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded cursor-help" title="' + escapeHtml(jsonStr) + '">' + escapeHtml(jsonStr.length > 60 ? jsonStr.slice(0, 60) + "..." : jsonStr) + '</span>';
      }
      return escapeHtml(String(val));
    }

    function setDeltaSqlTemplate(templateType) {
      const input = document.getElementById("deltaSqlInput");
      if (!input) return;
      if (templateType === "select_all") {
        input.value = "SELECT * FROM delta_table LIMIT 50;";
      } else if (templateType === "count") {
        input.value = "SELECT COUNT(*) AS total_linhas FROM delta_table;";
      }
      executeDeltaQuery();
    }

    async function executeDeltaQuery() {
      const query = (document.getElementById("deltaSqlInput").value || "").trim();
      if (!query) return;
      const statsEl = document.getElementById("deltaExecutionStats");
      const t0 = performance.now();

      try {
        const ala = await loadAlaSQL();
        if (ala) {
          ala('DROP TABLE IF EXISTS delta_table');
          ala('CREATE TABLE delta_table');
          ala.tables.delta_table.data = currentDeltaState.allRows;

          const tName = currentDeltaState.tableName.replace(/[^a-zA-Z0-9_]/g, "_");
          if (tName && tName !== "delta_table") {
            try {
              ala('DROP TABLE IF EXISTS ' + tName);
              ala('CREATE TABLE ' + tName);
              ala.tables[tName].data = currentDeltaState.allRows;
            } catch (tErr) {}
          }

          const res = ala(query);
          const t1 = performance.now();
          const rows = Array.isArray(res) ? res : [res];
          currentDeltaState.queryResult = rows;
          currentDeltaState.page = 1;
          renderDeltaTablePage();
          statsEl.innerHTML = '<span class="text-emerald-600 dark:text-emerald-400 font-semibold"><i class="fa-solid fa-check mr-1"></i> ' + rows.length.toLocaleString() + ' resultado(s) em ' + (t1 - t0).toFixed(1) + ' ms</span>';
        } else {
          // Fallback SQL query simples se AlaSQL offline
          runFallbackSqlQuery(query, t0);
        }
      } catch (err) {
        console.error("[DeltaLake] Erro SQL:", err);
        statsEl.innerHTML = '<span class="text-red-600 dark:text-red-400 font-semibold"><i class="fa-solid fa-circle-exclamation mr-1"></i> Erro SQL: ' + escapeHtml(err.message || String(err)) + '</span>';
      }
    }

    function runFallbackSqlQuery(query, t0) {
      let rows = [...currentDeltaState.allRows];
      const limitMatch = query.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        const lim = parseInt(limitMatch[1], 10);
        rows = rows.slice(0, lim);
      }
      const t1 = performance.now();
      currentDeltaState.queryResult = rows;
      currentDeltaState.page = 1;
      renderDeltaTablePage();
      const statsEl = document.getElementById("deltaExecutionStats");
      statsEl.innerHTML = '<span class="text-emerald-600 dark:text-emerald-400 font-semibold"><i class="fa-solid fa-check mr-1"></i> ' + rows.length.toLocaleString() + ' resultado(s) em ' + (t1 - t0).toFixed(1) + ' ms</span>';
    }

    function copyDeltaQueryResultsJson() {
      const rows = currentDeltaState.queryResult || [];
      if (rows.length === 0) {
        showToast("Nenhum dado para copiar", "info");
        return;
      }
      navigator.clipboard.writeText(JSON.stringify(rows, null, 2)).then(() => {
        showToast("Resultado copiado como JSON (" + rows.length + " registros)", "success");
      });
    }

    function exportDeltaQueryResultsCsv() {
      const rows = currentDeltaState.queryResult || [];
      if (rows.length === 0) {
        showToast("Nenhum dado para exportar", "info");
        return;
      }
      const cols = Object.keys(rows[0] || {});
      const lines = [cols.join(",")];
      rows.forEach(r => {
        const line = cols.map(c => {
          let v = r[c];
          if (v === null || v === undefined) return '""';
          if (typeof v === "object") v = JSON.stringify(v);
          v = String(v).replace(/"/g, '""');
          return '"' + v + '"';
        }).join(",");
        lines.push(line);
      });
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (currentDeltaState.tableName || "delta_query") + "_resultado.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("CSV exportado com sucesso!", "success");
    }
  </script>
</body>
</html>`;
}

