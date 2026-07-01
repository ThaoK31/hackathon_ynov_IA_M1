export function conversationToMarkdown(conversation) {
  const title = conversation.title || 'Conversation TechCorp AI'
  const date = new Date(conversation.createdAt || Date.now()).toLocaleString('fr-FR')
  let md = `# ${title}\n\n*${date}*\n\n`
  for (const m of conversation.messages) {
    const role = m.role === 'user' ? 'Vous' : 'Assistant'
    md += `## ${role}\n\n${m.content}\n\n`
  }
  return md
}

export function downloadMarkdown(conversation) {
  const md = conversationToMarkdown(conversation)
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const filename = (conversation.title || 'conversation').replace(/[^a-z0-9\u00C0-\u017F]/gi, '_').toLowerCase() + '.md'
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
