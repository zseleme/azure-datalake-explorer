const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getGitInfo() {
  try {
    const commit = execSync('git rev-parse --short HEAD', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    const commitFull = execSync('git rev-parse HEAD', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    const message = execSync('git log -1 --format=%s', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    return { commit, commitFull, branch, message };
  } catch (e) {
    return {
      commit: process.env.CF_PAGES_COMMIT_SHA
        ? process.env.CF_PAGES_COMMIT_SHA.slice(0, 7)
        : (process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : 'dev'),
      commitFull: process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || 'dev',
      branch: process.env.CF_PAGES_BRANCH || process.env.GITHUB_REF_NAME || 'main',
      message: 'Build manual'
    };
  }
}

const pkgPath = path.resolve(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const gitInfo = getGitInfo();
const now = new Date();
const buildTime = now.toISOString();

// Formata data brasileira para exibição legível
const buildDateFormatted = now.toLocaleString('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

const versionInfo = {
  name: pkg.name || 'azure-datalake-explorer',
  version: pkg.version || '1.1.0',
  gitCommit: gitInfo.commit,
  gitCommitFull: gitInfo.commitFull,
  gitBranch: gitInfo.branch,
  commitMessage: gitInfo.message,
  buildTime: buildTime,
  buildDateFormatted: buildDateFormatted
};

const targetPath = path.resolve(__dirname, '..', 'src', 'version.ts');
const fileContent = `// ARQUIVO GERADO AUTOMATICAMENTE NO BUILD/DEPLOY - NÃO EDITAR MANUALMENTE
export interface VersionInfo {
  name: string;
  version: string;
  gitCommit: string;
  gitCommitFull: string;
  gitBranch: string;
  commitMessage: string;
  buildTime: string;
  buildDateFormatted: string;
}

export const APP_VERSION: VersionInfo = ${JSON.stringify(versionInfo, null, 2)};
`;

fs.writeFileSync(targetPath, fileContent, 'utf8');
console.log(`[build-version] Gerado src/version.ts -> v${versionInfo.version} (${versionInfo.gitCommit}) [${versionInfo.buildDateFormatted}]`);
