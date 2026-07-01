import { useEffect, useRef, useState } from 'react'
import ModelPicker from './ModelPicker.jsx'
import { IconArrowUp, IconStop, IconPaperclip } from './icons.jsx'
import { isAccepted, readAttachment, ACCEPTED_EXT } from '../lib/attachments.js'

const ACCEPT_ATTR = `${ACCEPTED_EXT.map((e) => `.${e}`).join(',')},text/*`

export default function Composer({ streaming, models, model, lastUserMessage, onSend, onStop, onModelChange }) {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState([])
  const [error, setError] = useState('')
  const taRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`
  }, [text])

  const addFiles = async (files) => {
    for (const file of Array.from(files)) {
      if (!isAccepted(file)) {
        setError(`Type non supporte : ${file.name}. Formats acceptes : ${ACCEPTED_EXT.join(', ')}.`)
        continue
      }
      try {
        const att = await readAttachment(file)
        setAttachments((prev) => [...prev, att])
        setError('')
      } catch (e) {
        setError(e.message)
      }
    }
  }

  // Coller un fichier depuis le presse-papier (Ctrl+V).
  const onPaste = (e) => {
    const files = e.clipboardData?.files
    if (files && files.length) {
      e.preventDefault()
      addFiles(files)
    }
  }

  const removeAttachment = (id) => setAttachments((prev) => prev.filter((a) => a.id !== id))

  const submit = () => {
    const value = text.trim()
    if ((!value && attachments.length === 0) || streaming) return
    onSend(value, attachments)
    setText('')
    setAttachments([])
    setError('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
      return
    }
    if (e.key === 'ArrowUp' && text === '' && lastUserMessage) {
      e.preventDefault()
      setText(lastUserMessage)
    }
  }

  const canSend = Boolean(text.trim()) || attachments.length > 0

  return (
    <div className="composer">
      {attachments.length > 0 && (
        <div className="composer-attachments">
          {attachments.map((a) => (
            <span key={a.id} className="attach-chip">
              <IconPaperclip />
              <span className="attach-name">{a.name}</span>
              <span className="attach-meta">
                {Math.max(1, Math.round(a.chars / 1000))} k car.{a.truncated ? ' · tronque' : ''}
              </span>
              <button className="attach-remove" onClick={() => removeAttachment(a.id)} aria-label="Retirer la piece jointe">
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {error && <p className="composer-error">{error}</p>}

      <div className="composer-box">
        <button
          className="attach-btn"
          onClick={() => fileRef.current?.click()}
          title="Joindre un fichier texte"
          aria-label="Joindre un fichier"
        >
          <IconPaperclip />
        </button>
        <input
          ref={fileRef}
          type="file"
          hidden
          multiple
          accept={ACCEPT_ATTR}
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <textarea
          ref={taRef}
          rows={1}
          value={text}
          placeholder="Posez votre question…"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          aria-label="Message"
        />
        <div className="composer-actions">
          <ModelPicker models={models} model={model} onChange={onModelChange} />
          {streaming ? (
            <button className="btn-send is-stop" onClick={onStop} title="Arreter" aria-label="Arreter la generation">
              <IconStop />
            </button>
          ) : (
            <button className="btn-send" onClick={submit} disabled={!canSend} title="Envoyer (Entree)" aria-label="Envoyer">
              <IconArrowUp />
            </button>
          )}
        </div>
      </div>
      <p className="composer-note">Reponses generees par IA — verifiez les chiffres importants avant d'agir.</p>
    </div>
  )
}
