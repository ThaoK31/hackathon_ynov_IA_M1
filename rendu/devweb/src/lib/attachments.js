// Gestion des pieces jointes texte : on lit le contenu cote navigateur et on
// l'injecte dans le contexte du modele. Adapte aux modeles texte comme phi3.5
// (les images ne sont pas prises en charge : il faudrait un modele de vision).

export const ACCEPTED_EXT = ['txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'log', 'xml', 'yml', 'yaml']
export const MAX_FILE_CHARS = 15000 // ~ 4000 tokens : marge de securite pour phi3.5
export const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2 Mo

const uid = () =>
  crypto?.randomUUID ? crypto.randomUUID() : `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export function isAccepted(file) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  return ACCEPTED_EXT.includes(ext) || file.type.startsWith('text/')
}

export async function readAttachment(file) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`« ${file.name} » depasse la taille maximale (2 Mo).`)
  }
  let text = await file.text()
  let truncated = false
  if (text.length > MAX_FILE_CHARS) {
    text = text.slice(0, MAX_FILE_CHARS)
    truncated = true
  }
  return { id: uid(), name: file.name, text, truncated, chars: text.length }
}

// Contenu envoye au modele pour un message user : les pieces jointes sont
// prefixees en contexte, avant la question.
export function expandUserContent(message) {
  if (message.role !== 'user' || !message.attachments?.length) return message.content
  const docs = message.attachments
    .map((a) => `--- Document joint : ${a.name}${a.truncated ? ' (tronque)' : ''} ---\n${a.text}`)
    .join('\n\n')
  return message.content ? `${docs}\n\n${message.content}` : docs
}
