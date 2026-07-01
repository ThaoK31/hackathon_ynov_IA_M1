import assert from 'node:assert/strict'
import { renderMarkdown } from '../src/lib/markdown.js'
import { getLocalGuardReply } from '../src/lib/ollama.js'
import { DEFAULT_SETTINGS, loadConversations, loadSettings, pickAvailableModel } from '../src/lib/storage.js'
import { conversationToMarkdown } from '../src/lib/export.js'

globalThis.localStorage = {
  getItem(key) {
    if (key === 'techcorp.settings') return JSON.stringify({ model: 'phi3.5-financial' })
    if (key === 'techcorp.conversations') {
      return JSON.stringify([
        { id: 'empty', title: '', messages: [] },
        { id: 'real', title: 'Analyse', messages: [{ role: 'user', content: 'risque' }] },
      ])
    }
    return null
  },
  setItem() {},
}

const financePrompt =
  "Tu es l'assistant financier de TechCorp Industries. Si la question sort du domaine finance / business, recadre poliment en une phrase."

assert.equal(DEFAULT_SETTINGS.model, 'phi35-financial:latest', 'utiliser le modele Ollama cree par le projet')
assert.equal(loadSettings().model, 'phi35-financial:latest', 'migrer l ancien nom de modele')
assert.equal(
  pickAvailableModel('phi3.5-financial', ['phi35-financial:latest', 'phi3.5:latest']),
  'phi35-financial:latest',
  'corriger un modele absent avec la liste /api/tags',
)
assert.deepEqual(
  loadConversations().map((c) => c.id),
  ['real'],
  'ne pas charger les conversations vides',
)

const brokenPython = renderMarkdown(`\`\`\`python
for imprimeurs les elements icie. Here is a basic script that demonstrates how to use the 'in' keyword in loops within python:
\`\`\``)

assert.equal(brokenPython.includes('code-copy'), false, 'ne pas afficher Copier sur du faux code')
assert.equal(brokenPython.includes('<pre><code>'), false, 'ne pas rendre un faux bloc code')

const validPython = renderMarkdown(`\`\`\`python
fruits = ['pomme', 'banane', 'cerise']
for fruit in fruits:
    print(fruit)
\`\`\``)

assert.equal(validPython.includes('code-copy'), true, 'afficher Copier sur un vrai bloc code')
assert.equal(validPython.includes('<pre><code>'), true, 'rendre un vrai bloc code')

const tableWithBrokenSeparator = renderMarkdown(`| Titre | Description | Duree | Cout |
|---|---|---|---|
| BG #1 | Reunion equipe | 3 mois | 0 euro |
|-------|-----------------------------|----------|
|-------------|-------------|-------------------|`)

assert.equal(tableWithBrokenSeparator.includes('<table>'), true, 'rendre le tableau Markdown')
assert.equal(tableWithBrokenSeparator.includes('md-table-wide'), false, 'ne pas elargir un petit tableau')
assert.equal(tableWithBrokenSeparator.includes('|-------|'), false, 'masquer les separateurs de tableau casses')
assert.equal(tableWithBrokenSeparator.includes('|-------------|'), false, 'masquer les fragments de separateur')

const wideTable = renderMarkdown(`| A | B | C | D | E | F |
|---|---|---|---|---|---|
| 1 | 2 | 3 | 4 | 5 | 6 |`)

assert.equal(wideTable.includes('md-table-wide'), true, 'adapter les tableaux larges')

assert.match(
  getLocalGuardReply([{ role: 'user', content: 'fais du python quoi' }], financePrompt),
  /assistant financier/,
  'recadrer une demande de code generale',
)
assert.match(
  getLocalGuardReply([{ role: 'user', content: 'fais du python pour calculer le benefice' }], financePrompt),
  /assistant financier/,
  'recadrer une demande de code meme avec contexte finance',
)
assert.equal(
  getLocalGuardReply([{ role: 'user', content: 'calcule la marge brute' }], financePrompt),
  null,
  'laisser passer une demande finance normale',
)

const md = conversationToMarkdown({
  title: 'Test export',
  createdAt: 0,
  messages: [
    { role: 'user', content: 'Bonjour' },
    { role: 'assistant', content: 'Salut' },
  ],
})
assert.match(md, /# Test export/, 'titre en markdown')
assert.match(md, /## Vous/, 'role utilisateur')
assert.match(md, /## Assistant/, 'role assistant')

console.log('Rendering checks OK')
