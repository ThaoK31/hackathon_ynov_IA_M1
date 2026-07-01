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
  return (
    s
      .replace(/`([^`<]{1,90})`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Gras ouvert mais jamais ferme (frequent avec les petits modeles) :
      // on met en gras jusqu'a la fin plutot que de laisser les ** en clair.
      .replace(/\*\*([^*]+)$/, '<strong>$1</strong>')
      // Marqueurs orphelins restants : on les retire.
      .replace(/\*\*/g, '')
  )
}

// Une ligne de separation de tableau : |---|:--:|---| (contient au moins un tiret).
const isTableSep = (l) => l.includes('-') && /^\s*\|?[\s:|-]+\|?\s*$/.test(l)
const isTableRow = (l) => (l.match(/\|/g) || []).length >= 2
const codeFence = (l) => l.trim().startsWith('```')

function tableCells(line) {
  let s = line.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(0, -1)
  const cells = s.split('|').map((c) => c.trim())
  // Supprime les cellules vides creees par des || en debut/fin de ligne.
  while (cells.length && cells[0] === '') cells.shift()
  while (cells.length && cells[cells.length - 1] === '') cells.pop()
  return cells
}

// Le modele fusionne parfois la ligne de separation avec la premiere ligne de
// donnees : "|---|---|---|| A | B |". On la coupe en deux pour recuperer un
// tableau valide.
function repairTableLine(line) {
  const m = line.match(/^(\|[-:\s|]+\|)(\s*\|.*)$/)
  if (m) return `${m[1]}\n${m[2].trim()}`
  return line
}

function normalizeMarkdown(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/```([a-zA-Z0-9_-]*)/g, '\n```$1\n')
    .split('\n')
    .map(repairTableLine)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
}

const noisyModelPattern =
  /\b(markdwonkbeat|heree|icie|clon|Euxin|forever onward|request code example|Here is a basic script)\b/i
const assignmentPattern = /^\s*[A-Za-z_][A-Za-z0-9_]*\s*=\s*.+/
const callPattern = /^\s*[A-Za-z_][A-Za-z0-9_.]*\s*\([^)]*\)\s*$/
const pythonControlPattern = /^\s*(if|while|with|try|except|elif)\b.+:\s*$/
const pythonForPattern = /^\s*for\s+[A-Za-z_][A-Za-z0-9_]*(\s*,\s*[A-Za-z_][A-Za-z0-9_]*)?\s+in\s+.+:\s*$/

function meaningfulCodeLines(code) {
  return code
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*'))
}

function hasCodeSignal(line) {
  return (
    /^(from|import)\s+\w+/.test(line) ||
    /^(def|class)\s+[A-Za-z_][A-Za-z0-9_]*\b.*:\s*$/.test(line) ||
    pythonForPattern.test(line) ||
    pythonControlPattern.test(line) ||
    /^(return|break|continue)\b/.test(line) ||
    /^print\s*\(/.test(line) ||
    assignmentPattern.test(line) ||
    callPattern.test(line)
  )
}

function isCodeLike(code) {
  const compact = code.trim()
  if (!compact) return false
  const lines = meaningfulCodeLines(compact)
  if (!lines.length) return false
  if (lines.some((line) => noisyModelPattern.test(line) && !hasCodeSignal(line))) return false
  return lines.some(hasCodeSignal)
}

function softenLongCodeLines(code) {
  return code
    .split('\n')
    .map((line) => {
      if (line.length < 140 || line.includes('://')) return line
      return line
        .replace(/\s+(?=(def|class|if __name__|if |for |while |return |print\(|import |from )\b)/g, '\n')
        .replace(/\s+(?=[A-Za-z_][A-Za-z0-9_]*\s*=)/g, '\n')
        .replace(/:\s+(?=(return|print\(|[A-Za-z_][A-Za-z0-9_]*\s*=))/g, ':\n  ')
    })
    .join('\n')
}

function stripPromptIntro(code) {
  const lines = code.split('\n')
  while (
    lines.length > 1 &&
    /^\s*#/.test(lines[0]) &&
    /\b(Here is|Pouvez-vous|fournir|exemple de code|basic example|Question)\b/i.test(lines[0])
  ) {
    lines.shift()
  }
  return lines.join('\n').trim()
}

function renderCodeBlock(rawCode) {
  const code = stripPromptIntro(softenLongCodeLines(rawCode.trim()))
  if (!isCodeLike(code)) return `<p>${inline(code.split('\n').filter(Boolean).join('<br>'))}</p>`
  return `<div class="md-code"><button type="button" class="code-copy" title="Copier le bloc de code" aria-label="Copier le bloc de code">Copier</button><pre><code>${code}</code></pre></div>`
}

export function renderMarkdown(text) {
  const lines = escapeHtml(normalizeMarkdown(text)).split('\n')
  const out = []
  let para = []
  let inList = false

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
    if (codeFence(line)) {
      flushPara()
      closeList()
      i += 1
      const codeLines = []
      while (i < lines.length && !codeFence(lines[i])) {
        codeLines.push(lines[i])
        i += 1
      }
      if (i < lines.length && codeFence(lines[i])) i += 1
      out.push(renderCodeBlock(codeLines.join('\n')))
      continue
    }

    // Separation de tableau cassee : contient des pipes et des tirets mais
    // aussi du bruit (ex: "|------|------Singulares------||-------").
    const isBrokenTableSep = (l) => {
      const t = l.trim()
      const pipeCount = (t.match(/\|/g) || []).length
      const dashCount = (t.match(/-/g) || []).length
      return pipeCount >= 2 && dashCount >= 3
    }

    const canStartTable = (ls, idx) => {
      if (!isTableRow(ls[idx])) return false
      const header = tableCells(ls[idx])
      if (header.length < 2) return false
      const next = ls[idx + 1] ?? ''
      const nextCells = tableCells(next)
      return (
        isTableSep(next) ||
        isBrokenTableSep(next) ||
        (isTableRow(next) && nextCells.length === header.length)
      )
    }

    const normalizeRow = (cells, size) => {
      const row = cells.slice(0, size)
      while (row.length < size) row.push('')
      return row
    }

    // Tableau : entete + separation (propre ou cassee) ou ligne suivante avec
    // le meme nombre de colonnes.
    if (canStartTable(lines, i)) {
      flushPara()
      closeList()
      const header = tableCells(line)
      const colCount = header.length
      const rows = []
      i += 1
      while (i < lines.length) {
        const current = lines[i]
        if (current.trim() === '') break
        if (isTableSep(current) || isBrokenTableSep(current)) {
          i += 1
          continue
        }
        if (!isTableRow(current)) break
        const cells = tableCells(current)
        if (cells.length < 2) break
        rows.push(normalizeRow(cells, colCount))
        i += 1
      }
      const tableClass = header.length > 5 ? 'md-table md-table-wide' : 'md-table'
      out.push(`<div class="${tableClass}"><table><thead><tr>`)
      header.forEach((h) => out.push(`<th>${inline(h)}</th>`))
      out.push('</tr></thead><tbody>')
      rows.forEach((r) => {
        out.push('<tr>')
        for (let c = 0; c < colCount; c += 1) out.push(`<td>${inline(r[c] ?? '')}</td>`)
        out.push('</tr>')
      })
      out.push('</tbody></table></div>')
      continue
    }

    if (isTableSep(line) || isBrokenTableSep(line)) {
      flushPara()
      closeList()
      i += 1
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
  return out.join('')
}
