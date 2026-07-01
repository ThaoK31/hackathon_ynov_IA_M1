// Persistance locale (localStorage) : conversations, reglages, theme.
// Front-only, aucune donnee ne quitte le navigateur.

const KEYS = {
  conversations: 'techcorp.conversations',
  activeId: 'techcorp.activeId',
  settings: 'techcorp.settings',
  theme: 'techcorp.theme',
}

export const DEFAULT_SETTINGS = {
  // URL du serveur d'inference. Vide = cible du .env (OLLAMA_URL) ou Ollama local.
  // Renseignee ici, elle est reglable a chaud (sans redemarrer Vite) et le proxy
  // retombe automatiquement sur le Ollama local si elle ne repond pas.
  endpoint: '',
  model: 'phi35-financial:latest',
  // Temperature basse + longueur mesuree : le modele (3.8B) donne une reponse
  // propre puis s'arrete, au lieu de radoter et de degenerer sur une longue plage.
  temperature: 0.2,
  maxTokens: 800,
  systemPrompt:
    "Tu es l'assistant financier de TechCorp Industries. Reponds en francais, de facon claire et concise. Donne UNE seule reponse, sans la repeter ni proposer plusieurs variantes. Mets en gras les termes cles. Si la question sort du domaine finance / business, recadre poliment en une phrase.",
}

export function pickAvailableModel(current, models = []) {
  if (!models.length || models.includes(current)) return current
  return models.find((m) => m === DEFAULT_SETTINGS.model) || models.find((m) => m.includes('financial')) || models[0]
}

const hasMessages = (conversation) => Array.isArray(conversation.messages) && conversation.messages.length > 0

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / mode prive : on ignore silencieusement */
  }
}

export const loadConversations = () => read(KEYS.conversations, []).filter(hasMessages)
export const saveConversations = (v) => write(KEYS.conversations, v)
export const loadActiveId = () => read(KEYS.activeId, null)
export const saveActiveId = (v) => write(KEYS.activeId, v)
export const loadSettings = () => {
  const settings = { ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) }
  return { ...settings, model: settings.model === 'phi3.5-financial' ? DEFAULT_SETTINGS.model : settings.model }
}
export const saveSettings = (v) => write(KEYS.settings, v)
export const loadTheme = () => read(KEYS.theme, 'dark')
export const saveTheme = (v) => write(KEYS.theme, v)
