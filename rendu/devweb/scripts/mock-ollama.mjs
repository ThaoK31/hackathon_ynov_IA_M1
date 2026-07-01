// Serveur mock Ollama minimal pour les captures d'ecran.
// Repond a /api/tags et /api/chat avec un stream NDJSON.
import http from 'node:http'

const PORT = Number(process.argv[2]) || 11434

const replyTokens = [
  JSON.stringify({ message: { content: 'Voici ' } }),
  JSON.stringify({ message: { content: 'un ' } }),
  JSON.stringify({ message: { content: 'tableau ' } }),
  JSON.stringify({ message: { content: 'rapide ' } }),
  JSON.stringify({ message: { content: ':\n\n' } }),
  JSON.stringify({ message: { content: '| Actif | Valeur | Risque |\n|---|---|---|\n| Actions | 120 k€ | Moyen |\n| Obligations | 80 k€ | Faible |\n| Crypto | 15 k€ | Eleve |' } }),
  JSON.stringify({ message: { content: '', role: 'assistant' }, done: true, prompt_eval_count: 18, eval_count: 42, total_duration: 1_250_000_000 }),
]

function streamResponse(res) {
  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  let i = 0
  const interval = setInterval(() => {
    if (i >= replyTokens.length) {
      clearInterval(interval)
      res.end()
      return
    }
    res.write(replyTokens[i] + '\n')
    i += 1
  }, 80)
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.url === '/api/tags') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ models: [{ name: 'phi35-financial:latest' }] }))
    return
  }

  if (req.url === '/api/chat') {
    streamResponse(res)
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

server.listen(PORT, () => {
  console.log(`Mock Ollama sur http://localhost:${PORT}`)
})
