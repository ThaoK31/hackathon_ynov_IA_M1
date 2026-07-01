// Persistance locale (localStorage) : conversations, reglages, theme.
// Front-only, aucune donnee ne quitte le navigateur.

const KEYS = {
  conversations: 'techcorp.conversations',
  activeId: 'techcorp.activeId',
  settings: 'techcorp.settings',
  theme: 'techcorp.theme',
}

export const DEFAULT_SETTINGS = {
  model: 'phi3.5-financial',
  temperature: 0.3,
  maxTokens: 2048,
  systemPrompt:
    "Tu es l'assistant financier de TechCorp Industries. Reponds en francais, de facon claire et concise. Donne UNE seule reponse, sans la repeter ni proposer plusieurs variantes. Mets en gras les termes cles. Si la question sort du domaine finance / business, recadre poliment en une phrase.",
}

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

export const loadConversations = () => read(KEYS.conversations, [])
export const saveConversations = (v) => write(KEYS.conversations, v)
export const loadActiveId = () => read(KEYS.activeId, null)
export const saveActiveId = (v) => write(KEYS.activeId, v)
export const loadSettings = () => ({ ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) })
export const saveSettings = (v) => write(KEYS.settings, v)
export const loadTheme = () => read(KEYS.theme, 'dark')
export const saveTheme = (v) => write(KEYS.theme, v)
