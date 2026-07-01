# Lance l'interface de chat TechCorp en une commande (Windows / PowerShell).
#   ./start.ps1
# Pour cibler le serveur d'inference de l'INFRA :
#   copier .env.example en .env puis renseigner OLLAMA_URL
#   ou lancer : $env:OLLAMA_URL = "http://192.168.1.42:11434" ; ./start.ps1
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Read-DotEnvValue($name, $path) {
    if (-not (Test-Path $path)) { return $null }
    $line = Get-Content $path |
        Where-Object { $_ -match "^\s*$name\s*=" } |
        Select-Object -Last 1
    if (-not $line) { return $null }
    return ($line -replace "^\s*$name\s*=\s*", "").Trim().Trim('"').Trim("'")
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "npm introuvable. Installe Node.js 18+ : https://nodejs.org" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path node_modules)) {
    Write-Host "Installation des dependances (une seule fois)..." -ForegroundColor Cyan
    npm install
}

if (-not $env:OLLAMA_URL) {
    $envValue = Read-DotEnvValue "OLLAMA_URL" ".env"
    $env:OLLAMA_URL = if ($envValue) { $envValue } else { "http://localhost:11434" }
}
Write-Host "Interface -> http://localhost:5173   (Ollama: $env:OLLAMA_URL)" -ForegroundColor Green
npm run dev
