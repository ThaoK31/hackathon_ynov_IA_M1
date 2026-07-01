// Rendu Markdown minimal et SUR : on echappe d'abord tout le HTML, puis on
// re-applique une poignee de regles (gras, italique, code, titres, listes,
// tableaux). Aucune balise brute ne survit -> pas de risque d'injection depuis
// la sortie du modele.

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inline(s) {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

// Une ligne de separation de tableau : |---|:--:|---| (contient au moins un tiret).
const isTableSep = (l) => l.includes('-') && /^\s*\|?[\s:|-]+\|?\s*$/.test(l)
const isTableRow = (l) => l.includes('|')

function tableCells(line) {
  let s = line.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(0, -1)
  return s.split('|').map((c) => c.trim())
}

export function renderMarkdown(text) {
  const lines = escapeHtml(text).split('\n')
  const out = []
  let para = []
  let inList = false
  let inCode = false

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join('<br>'))}</p>`)
      para = []
    }
  }
  const closeList = () => {
    if (inList) {
      out.push('</ul>')
      inList = false
    }
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // Bloc de code ```...```
    if (line.trim().startsWith('```')) {
      if (inCode) {
        out.push('</code></pre>')
        inCode = false
      } else {
        flushPara()
        closeList()
        out.push('<pre><code>')
        inCode = true
      }
      i += 1
      continue
    }
    if (inCode) {
      out.push(line)
      i += 1
      continue
    }

    // Tableau : ligne d'entete suivie d'une ligne de separation.
    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      flushPara()
      closeList()
      const header = tableCells(line)
      const rows = []
      i += 2
      while (i < lines.length && lines[i].trim() !== '' && isTableRow(lines[i]) && !isTableSep(lines[i])) {
        rows.push(tableCells(lines[i]))
        i += 1
      }
      out.push('<div class="md-table"><table><thead><tr>')
      header.forEach((h) => out.push(`<th>${inline(h)}</th>`))
      out.push('</tr></thead><tbody>')
      rows.forEach((r) => {
        out.push('<tr>')
        for (let c = 0; c < header.length; c += 1) out.push(`<td>${inline(r[c] ?? '')}</td>`)
        out.push('</tr>')
      })
      out.push('</tbody></table></div>')
      continue
    }

    // Liste a puces
    const li = line.match(/^\s*[-*]\s+(.+)$/)
    if (li) {
      flushPara()
      if (!inList) {
        out.push('<ul>')
        inList = true
      }
      out.push(`<li>${inline(li[1])}</li>`)
      i += 1
      continue
    }
    closeList()

    // Titre ## / ### / ####
    const heading = line.match(/^#{2,4}\s+(.+)$/)
    if (heading) {
      flushPara()
      out.push(`<h3>${inline(heading[1])}</h3>`)
      i += 1
      continue
    }

    if (line.trim() === '') {
      flushPara()
      i += 1
      continue
    }
    para.push(line)
    i += 1
  }

  flushPara()
  closeList()
  if (inCode) out.push('</code></pre>')
  return out.join('')
}
