// Client d'inference Ollama. Le navigateur reste en same-origin : il appelle /api,
// que le proxy (Vite en dev, nginx en prod) relaie vers le serveur d'inference.

const API = '/api'

// Verifie que le serveur repond et recupere la liste des modeles + la latence.
export async function checkConnection() {
  const start = performance.now()
  try {
    const res = await fetch(`${API}/tags`)
    if (!res.ok) return { ok: false, models: [], latencyMs: null, error: `HTTP ${res.status}` }
    const data = await res.json()
    const models = (data.models || []).map((m) => m.name)
    return { ok: true, models, latencyMs: Math.round(performance.now() - start), error: null }
  } catch (err) {
    return { ok: false, models: [], latencyMs: null, error: err.message }
  }
}

// Envoie la conversation et streame la reponse token par token (NDJSON /api/chat).
export async function streamChat({ model, messages, systemPrompt, temperature, maxTokens, signal, onToken }) {
  const payload = {
    model,
    messages: systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages,
    stream: true,
    options: {
      temperature,
      num_predict: maxTokens,
      top_p: 0.9,
      // Penalise la repetition : evite que les petits modeles bouclent
      // (repetition de salutations, sections separees par ---, etc.).
      repeat_penalty: 1.3,
    },
  }

  const res = await fetch(`${API}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    if (res.status === 404) {
      throw new Error(`Le modele « ${model} » est introuvable sur le serveur. Verifie son nom (ollama list) ou change-le dans les Reglages.`)
    }
    throw new Error(`Le serveur a repondu ${res.status}. ${detail}`.trim())
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() // garde la ligne incomplete pour le prochain tour
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      let json
      try {
        json = JSON.parse(trimmed)
      } catch {
        continue
      }
      if (json.error) throw new Error(json.error)
      const token = json.message?.content || ''
      if (token) {
        full += token
        onToken?.(token)
      }
    }
  }

  return full
}
