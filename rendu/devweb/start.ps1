# Lance l'interface de chat TechCorp en une commande (Windows / PowerShell).
#   ./start.ps1
# Pour cibler le serveur d'inference de l'INFRA (autre machine) :
#   $env:OLLAMA_URL = "http://192.168.1.42:11434" ; ./start.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "npm introuvable. Installe Node.js 18+ : https://nodejs.org" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path node_modules)) {
    Write-Host "Installation des dependances (une seule fois)..." -ForegroundColor Cyan
    npm install
}

if (-not $env:OLLAMA_URL) { $env:OLLAMA_URL = "http://localhost:11434" }
Write-Host "Interface -> http://localhost:5173   (Ollama: $env:OLLAMA_URL)" -ForegroundColor Green
npm run dev
