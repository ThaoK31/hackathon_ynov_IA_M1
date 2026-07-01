import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy same-origin : le navigateur appelle /api, Vite relaie vers Ollama.
// Aucun CORS, et l'URL du serveur d'inference (INFRA) reste cote serveur.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.OLLAMA_URL || 'http://localhost:11434'
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': { target, changeOrigin: true },
      },
    },
  }
})
