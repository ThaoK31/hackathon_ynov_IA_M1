import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { Readable } from 'node:stream'

// Proxy same-origin dynamique : le navigateur appelle /api, Vite relaie vers Ollama.
// Aucun CORS cote navigateur. La cible est choisie a chaque requete :
//   1. l'en-tete x-ollama-url (URL reglable a chaud depuis les Reglages), sinon
//   2. OLLAMA_URL (.env), sinon
//   3. http://localhost:11434
// Et si la cible echoue (Colab eteint, 404...), on RETOMBE sur le Ollama local.
// La reponse porte x-ollama-source: infra|local pour afficher la source dans l'UI.
const LOCAL = 'http://localhost:11434'

function ollamaProxy(envTarget) {
  return {
    name: 'ollama-dynamic-proxy',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res) => {
        const clean = (u) => (u || '').trim().replace(/\/+$/, '')
        const primary = clean(req.headers['x-ollama-url']) || clean(envTarget) || LOCAL
        const path = req.url.startsWith('/') ? req.url : `/${req.url}`

        // Corps de la requete (POST). Rien pour GET/HEAD.
        let body
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          const chunks = []
          for await (const c of req) chunks.push(c)
          body = Buffer.concat(chunks)
        }

        // Timeout sur l'ARRIVEE des entetes seulement : si la cible ne repond
        // pas a temps (tunnel eteint qui hang), on annule et on bascule local.
        // Une fois les entetes recus, on laisse le flux couler (streaming lent).
        const call = (base, timeoutMs) => {
          const controller = new AbortController()
          const timer = setTimeout(() => controller.abort(), timeoutMs)
          return fetch(`${base}/api${path}`, {
            method: req.method,
            headers: { 'content-type': req.headers['content-type'] || 'application/json' },
            body,
            signal: controller.signal,
          }).then(
            (r) => {
              clearTimeout(timer)
              return r
            },
            (e) => {
              clearTimeout(timer)
              throw e
            },
          )
        }

        // Cible principale (timeout court), puis fallback local si elle echoue.
        let upstream
        let source = primary === LOCAL ? 'local' : 'infra'
        try {
          upstream = await call(primary, 15000)
          if (!upstream.ok && primary !== LOCAL) throw new Error(`HTTP ${upstream.status}`)
        } catch {
          if (primary === LOCAL) {
            res.statusCode = 502
            res.end(JSON.stringify({ error: 'Ollama local injoignable sur localhost:11434' }))
            return
          }
          try {
            upstream = await call(LOCAL, 15000)
            source = 'local'
          } catch {
            res.statusCode = 502
            res.end(JSON.stringify({ error: 'Aucun serveur Ollama joignable (ni distant ni local)' }))
            return
          }
        }

        res.statusCode = upstream.status
        res.setHeader('content-type', upstream.headers.get('content-type') || 'application/json')
        res.setHeader('x-ollama-source', source)
        if (upstream.body) Readable.fromWeb(upstream.body).pipe(res)
        else res.end()
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), ollamaProxy(env.OLLAMA_URL)],
    server: { host: true, port: 5173 },
  }
})
