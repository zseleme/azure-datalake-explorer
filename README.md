# ⚡ Azure Data Lake Explorer no Cloudflare Workers

Aplicação web serverless completa e ultra rápida rodando no **Cloudflare Workers**. Permite navegar, visualizar, baixar e enviar arquivos para o **Azure Data Lake / Blob Storage** com as credenciais salvas de forma 100% privada no **`localStorage` do navegador do usuário**.

---

## 🔒 Segurança e Privacidade Total (Página Pública)

- **Zero banco de dados e Zero credenciais no Worker**: O Cloudflare Worker é um Edge Proxy stateless. Nenhuma credencial do Azure é salva no projeto ou nos servidores da Cloudflare.
- **Credenciais no Navegador**: Ao abrir a aplicação pela primeira vez, uma janela solicita suas credenciais do Azure e as guarda **exclusivamente no `localStorage` do seu navegador**. Cada usuário que acessar a URL pública usará suas próprias credenciais.
- **Desconexão**: Você pode limpar as credenciais a qualquer momento clicando no botão **Credenciais -> Desconectar**.

---

## 🔑 Como Colocar as Credenciais (No Navegador)

1. Inicie o servidor local:
   ```bash
   npm run dev
   # ou dê um duplo clique no run_dev.bat
   ```
2. Acesse no navegador:
   👉 **`http://localhost:8787`**
3. Uma janela modal intitulada **"Credenciais Azure"** aparecerá na tela (ou você pode clicar no botão **"Credenciais"** no topo):
   - **Storage Account Name**: Apenas o nome da conta (ex: `meustorage`, sem `.blob.core.windows.net`).
   - **Tenant ID**: Directory (tenant) ID no Microsoft Entra ID.
   - **Client ID**: Application (client) ID do seu App Registration.
   - **Client Secret**: O valor do segredo (`Value`) gerado em Certificates & Secrets.
   - **Containers**: Containers que deseja visualizar, separados por vírgula (ex: `raw, squad1, squad2`).
4. Clique em **"Testar Conexão"** para verificar se o Entra ID aceitou suas chaves.
5. Clique em **"Salvar e Conectar"**.

---

## 📋 Como Obter as Credenciais no Portal do Azure

1. **Storage Account Name**:
   - Acesse **Storage accounts** no Portal do Azure.
   - Copie apenas o nome da conta.

2. **Tenant ID e Client ID**:
   - No Portal do Azure, vá em **Microsoft Entra ID** (antigo Azure AD).
   - Clique em **App registrations** > Selecione seu App (ou crie um em **New registration**).
   - Na aba **Overview**, você encontrará o **Application (client) ID** e o **Directory (tenant) ID**.

3. **Client Secret**:
   - No seu App Registration, vá em **Certificates & secrets** > **Client secrets**.
   - Clique em **New client secret** e adicione.
   - **Atenção**: Copie o valor da coluna **Value** (e não o Secret ID).

4. **⚠️ Permissão RBAC Obrigatória (Evita Erro 403)**:
   - Sem esta permissão, o Azure rejeitará o acesso com erro `403 Forbidden`.
   - Acesse sua **Storage Account** no Portal do Azure.
   - No menu lateral, clique em **Access Control (IAM)** > **+ Add** > **Add role assignment**.
   - Selecione a função **Storage Blob Data Contributor** (para leitura, upload e exclusão) ou **Storage Blob Data Reader** (somente leitura).
   - Na aba **Members**, escolha **User, group, or service principal**, clique em **Select members** e selecione o seu App Registration (Client ID).
   - Avance e clique em **Review + assign**.

---

## 🚀 Como Rodar Localmente

1. Abra o terminal na pasta do projeto:
   ```bash
   npm install
   npm run dev
   ```
2. Acesse no navegador:
   👉 **`http://localhost:8787`**

---

## 🌐 Como Publicar na Cloudflare (Deploy Público)

1. Faça login no terminal:
   ```bash
   npx wrangler login
   ```
2. Publique com um único comando:
   ```bash
   npm run deploy
   ```
3. Sua aplicação estará no ar com URL pública protegida por HTTPS:
   👉 `https://azure-datalake-explorer.<seu-subdominio>.workers.dev`
   *(Qualquer pessoa que acessar precisará informar as credenciais dela no próprio navegador).*
