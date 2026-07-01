import { useEffect, useState } from 'react'

// Signature de l'interface : un verbe qui tourne pendant la generation.
const VERBS = [
  'Cogitation',
  'Analyse',
  'Modelisation',
  'Estimation',
  'Reflexion',
  'Ponderation',
  'Synthese',
  'Decryptage',
  'Raisonnement',
  'Compilation',
  'Extrapolation',
  'Mijotage',
  'Ruminations',
  'Elucubration',
  'Tergiversation',
  'Percolation',
  'Maceration',
  'Carburation',
]

function pick(exclude) {
  let word = exclude
  while (word === exclude) word = VERBS[Math.floor(Math.random() * VERBS.length)]
  return word
}

export default function TypingIndicator() {
  const [word, setWord] = useState(() => pick())

  useEffect(() => {
    const id = setInterval(() => setWord((w) => pick(w)), 2600)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="typing">
      <span className="typing-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span key={word} className="typing-word">
        {word}…
      </span>
    </div>
  )
}
