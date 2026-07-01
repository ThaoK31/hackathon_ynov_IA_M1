import { useState } from 'react'
import { formatTime } from '../lib/format.js'
import { IconCopy, IconCheck, IconThumbUp, IconThumbDown, IconRetry, IconSpeaker, IconSpeakerOff } from './icons.jsx'

export default function MessageActions({ content, feedback, isError, at, canRetry, onRegenerate, onFeedback }) {
  const [copied, setCopied] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const ttsAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* presse-papier indisponible (contexte non securise) */
    }
  }

  const speak = () => {
    const synth = window.speechSynthesis
    if (!synth) return
    if (speaking) {
      synth.cancel()
      setSpeaking(false)
      return
    }
    // On enleve la syntaxe markdown pour une lecture propre.
    const clean = content.replace(/[*_`#>|]/g, ' ').replace(/\s+/g, ' ').trim()
    const utter = new SpeechSynthesisUtterance(clean)
    utter.lang = 'fr-FR'
    utter.onend = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)
    synth.cancel()
    synth.speak(utter)
    setSpeaking(true)
  }

  // Sur un message d'erreur, seule l'action « reessayer » a du sens.
  if (isError) {
    return canRetry ? (
      <div className="msg-actions is-visible">
        <button className="action-btn" onClick={onRegenerate} title="Reessayer" aria-label="Reessayer">
          <IconRetry />
        </button>
      </div>
    ) : null
  }

  const visible = canRetry || Boolean(feedback)

  return (
    <div className={`msg-actions ${visible ? 'is-visible' : ''}`}>
      {at && <span className="msg-time">{formatTime(at)}</span>}
      <button className="action-btn" onClick={copy} title={copied ? 'Copie !' : 'Copier'} aria-label="Copier">
        {copied ? <IconCheck /> : <IconCopy />}
      </button>
      <button
        className={`action-btn ${feedback === 'up' ? 'is-up' : ''}`}
        onClick={() => onFeedback('up')}
        title="Bonne reponse"
        aria-label="Bonne reponse"
      >
        <IconThumbUp />
      </button>
      <button
        className={`action-btn ${feedback === 'down' ? 'is-down' : ''}`}
        onClick={() => onFeedback('down')}
        title="Mauvaise reponse"
        aria-label="Mauvaise reponse"
      >
        <IconThumbDown />
      </button>
      {canRetry && (
        <button className="action-btn" onClick={onRegenerate} title="Regenerer" aria-label="Regenerer">
          <IconRetry />
        </button>
      )}
      {ttsAvailable && (
        <button
          className={`action-btn ${speaking ? 'is-active' : ''}`}
          onClick={speak}
          title={speaking ? 'Arreter la lecture' : 'Lire a voix haute'}
          aria-label="Lire a voix haute"
        >
          {speaking ? <IconSpeakerOff /> : <IconSpeaker />}
        </button>
      )}
    </div>
  )
}
