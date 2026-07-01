#!/usr/bin/env bash
# Lance l'interface de chat TechCorp en une commande (Linux / macOS).
#   ./run.sh
# Pour cibler le serveur d'inference de l'INFRA :
#   OLLAMA_URL=http://192.168.1.42:11434 ./run.sh
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm introuvable. Installe Node.js 18+ : https://nodejs.org" >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installation des dependances (une seule fois)..."
  npm install
fi

export OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"
echo "Interface -> http://localhost:5173   (Ollama: $OLLAMA_URL)"
npm run dev
