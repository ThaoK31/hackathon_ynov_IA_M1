// Client d'inference Ollama. Le navigateur reste en same-origin : il appelle /api,
// que le proxy (Vite en dev, nginx en prod) relaie vers le serveur d'inference.

const API = '/api'
const RESPONSE_GUARD =
  'Consignes de sortie: reponds en francais, une seule fois, sans fragments anglais inutiles. Si la demande est hors finance/business, recadre poliment en une phrase. Ne fournis pas de code de programmation; si une demande de code arrive, propose plutot une explication metier ou une formule financiere. Pour un tableau, reste compact: 3 a 5 colonnes, libelles courts, cellules courtes. Ne recommence jamais le meme bloc ni la meme phrase.'
const DEGENERATE_MESSAGE =
  "La reponse du modele a ete interrompue car elle contenait des fragments incoherents. Reformule la demande sur un cas finance/business, ou change de modele dans les Reglages."
const REPETITION_MESSAGE =
  'La reponse du modele a ete interrompue car elle repetait les memes fragments. Essaie une question plus courte ou baisse la longueur max dans les Reglages.'

const codeRequestPattern =
  /\b(code|snippet|script|python|javascript|typescript|boucle|fonction|for|while|framework|markdown)\b/i
const defaultFinancePromptPattern = /assistant financier|finance\s*\/\s*business|TechCorp Industries/i
const badOutputMarkerPattern =
  /\b(markdwonkbeat|heree|icie|élés fruit|eles fruit|clon|Euxin|forever onward|request code example)\b/gi

function withGuard(systemPrompt) {
  return systemPrompt ? `${systemPrompt}\n\n${RESPONSE_GUARD}` : RESPONSE_GUARD
}

function countMatches(text, pattern) {
  pattern.lastIndex = 0
  return Array.from(text.matchAll(pattern)).length
}

function hasRepeatedPhrase(text) {
  const words = text.toLowerCase().match(/[a-z0-9_'-]{3,}/g) || []
  if (words.length < 45) return false
  const seen = new Set()
  for (let i = 0; i <= words.length - 10; i += 1) {
    const phrase = words.slice(i, i + 10).join(' ')
    if (seen.has(phrase)) return true
    seen.add(phrase)
  }
  return false
}

function looksRepetitive(text) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length < 650) return false
  for (const size of [180, 260, 360]) {
    const tail = normalized.slice(-size)
    const previous = normalized.slice(-size * 3, -size)
    if (tail.length === size && previous.split(tail).length > 2) return true
  }
  const lastSentence = normalized.split(/[.!?]\s+/).filter(Boolean).at(-1)
  if (!lastSentence || lastSentence.length < 80) return false
  return normalized.slice(0, -lastSentence.length).includes(lastSentence)
}

function looksDegenerate(text) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length < 180) return false
  if (countMatches(normalized, badOutputMarkerPattern) >= 2) return true
  return normalized.length > 450 && hasRepeatedPhrase(normalized)
}

export function getLocalGuardReply(messages, systemPrompt) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.content || ''
  if (!defaultFinancePromptPattern.test(systemPrompt || '')) return null
  if (!codeRequestPattern.test(lastUser)) return null
  return "Je suis configure comme assistant financier de TechCorp, pas comme assistant de programmation. Je peux t'expliquer une formule, un indicateur ou un calcul metier, mais pas produire du code."
}

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
// Renvoie { content, metrics } ou leve une erreur.
export async function streamChat({ model, messages, systemPrompt, temperature, maxTokens, signal, onToken, onReplace }) {
  const startedAt = performance.now()
  const payload = {
    model,
    messages: [{ role: 'system', content: withGuard(systemPrompt) }, ...messages],
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
  let serverMetrics = null
  let stopped = false
  const stopWithMessage = async (message) => {
    if (stopped) return
    stopped = true
    full = message
    if (onReplace) onReplace(message)
    else onToken?.(`\n\n_${message}_`)
    await reader.cancel().catch(() => {})
  }

  while (true) {
    if (stopped) break
    const { done, value } = await reader.read()
    if (done) {
      // Traite le buffer restant a la fin du stream.
      if (buffer.trim()) processLine(buffer.trim())
      break
    }
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() // garde la ligne incomplete pour le prochain tour
    for (const line of lines) {
      if (stopped) break
      processLine(line)
    }
  }

  return { content: full, metrics: buildMetrics(startedAt, model, temperature, serverMetrics) }

  function processLine(line) {
    const trimmed = line.trim()
    if (!trimmed) return
    let json
    try {
      json = JSON.parse(trimmed)
    } catch {
      return
    }
    if (json.error) throw new Error(json.error)
    if (json.done) serverMetrics = json
    const token = json.message?.content || ''
    if (token) {
      full += token
      onToken?.(token)
      if (looksDegenerate(full)) {
        stopWithMessage(DEGENERATE_MESSAGE)
        return
      }
      if (looksRepetitive(full)) {
        stopWithMessage(REPETITION_MESSAGE)
        return
      }
    }
  }
}

function buildMetrics(startedAt, model, temperature, serverMetrics) {
  const durationMs = Math.round(performance.now() - startedAt)
  return {
    durationMs,
    model,
    temperature,
    tokensIn: serverMetrics?.prompt_eval_count ?? null,
    tokensOut: serverMetrics?.eval_count ?? null,
  }
}
