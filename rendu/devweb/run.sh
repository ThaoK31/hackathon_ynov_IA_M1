#!/usr/bin/env bash
# Lance l'interface de chat TechCorp en une commande (Linux / macOS).
#   ./run.sh
# Pour cibler le serveur d'inference de l'INFRA :
#   copier .env.example en .env puis renseigner OLLAMA_URL
#   ou lancer : OLLAMA_URL=http://192.168.1.42:11434 ./run.sh
set -euo pipefail
cd "$(dirname "$0")"

read_dotenv_value() {
  local name="$1"
  local file="$2"
  [ -f "$file" ] || return 0
  grep -E "^[[:space:]]*$name[[:space:]]*=" "$file" | tail -n 1 | sed -E "s/^[[:space:]]*$name[[:space:]]*=[[:space:]]*//; s/^['\"]//; s/['\"]$//"
}

if ! command -v npm >/dev/null 2>&1; then
  echo "npm introuvable. Installe Node.js 18+ : https://nodejs.org" >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Installation des dependances (une seule fois)..."
  npm install
fi

if [ -z "${OLLAMA_URL:-}" ]; then
  OLLAMA_URL="$(read_dotenv_value OLLAMA_URL .env)"
  export OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"
fi
echo "Interface -> http://localhost:5173   (Ollama: $OLLAMA_URL)"
npm run dev
