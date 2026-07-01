import { useEffect, useRef, useState } from 'react'
import ModelPicker from './ModelPicker.jsx'
import { IconArrowUp, IconStop } from './icons.jsx'

export default function Composer({ streaming, models, model, lastUserMessage, onSend, onStop, onModelChange }) {
  const [text, setText] = useState('')
  const taRef = useRef(null)

  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`
  }, [text])

  const submit = () => {
    const value = text.trim()
    if (!value || streaming) return
    onSend(value)
    setText('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
      return
    }
    // Rappel du dernier message envoye via la fleche haut (quand le champ est vide).
    if (e.key === 'ArrowUp' && text === '' && lastUserMessage) {
      e.preventDefault()
      setText(lastUserMessage)
    }
  }

  return (
    <div className="composer">
      <div className="composer-box">
        <textarea
          ref={taRef}
          rows={1}
          value={text}
          placeholder="Posez votre question…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Message"
        />
        <div className="composer-actions">
          <ModelPicker models={models} model={model} onChange={onModelChange} />
          {streaming ? (
            <button className="btn-send is-stop" onClick={onStop} title="Arreter" aria-label="Arreter la generation">
              <IconStop />
            </button>
          ) : (
            <button
              className="btn-send"
              onClick={submit}
              disabled={!text.trim()}
              title="Envoyer (Entree)"
              aria-label="Envoyer"
            >
              <IconArrowUp />
            </button>
          )}
        </div>
      </div>
      <p className="composer-note">Reponses generees par IA — verifiez les chiffres importants avant d'agir.</p>
    </div>
  )
}
