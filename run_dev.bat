@echo off
title Cloudflare Worker - Azure Data Lake Explorer
cd /d "%~dp0"

echo =========================================================
echo    Iniciando Azure Explorer no Cloudflare Workers (Local)
echo =========================================================

if not exist "node_modules" (
    echo [INFO] Instalando dependencias do projeto...
    call npm install
)

echo [INFO] Iniciando Wrangler Dev em http://localhost:8787 ...
call npm run dev
pause

