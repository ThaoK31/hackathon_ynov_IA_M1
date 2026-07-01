// Formatte un timestamp en heure locale courte (ex. 10:23).
export function formatTime(at) {
  if (!at) return ''
  try {
    return new Date(at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
