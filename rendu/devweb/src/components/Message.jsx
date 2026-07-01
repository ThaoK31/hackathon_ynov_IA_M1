import { useState } from 'react'
import { renderMarkdown } from '../lib/markdown.js'
import { formatTime } from '../lib/format.js'
import MessageActions from './MessageActions.jsx'
import { IconPaperclip, IconCopy, IconCheck, IconRetry, IconEdit } from './icons.jsx'

function UserMessage({ id, content, attachments, at, onRetry, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* presse-papier indisponible */
    }
  }

  const startEdit = () => {
    setDraft(content)
    setEditing(true)
  }

  const saveEdit = () => {
    const value = draft.trim()
    if (!value) return
    setEditing(false)
    onEdit(id, value)
  }

  if (editing) {
    return (
      <div className="msg msg-user">
        <div className="msg-user-col editing">
          <textarea
            className="edit-area"
            value={draft}
            autoFocus
            rows={Math.min(8, draft.split('\n').length + 1)}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                saveEdit()
              }
              if (e.key === 'Escape') setEditing(false)
            }}
          />
          <div className="edit-actions">
            <button className="edit-btn" onClick={() => setEditing(false)}>
              Annuler
            </button>
            <button className="edit-btn primary" onClick={saveEdit}>
              Enregistrer &amp; envoyer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="msg msg-user">
      <div className="msg-user-col">
        {attachments?.length > 0 && (
          <div className="attach-chips">
            {attachments.map((a) => (
              <span key={a.id} className="attach-chip is-static">
                <IconPaperclip />
                <span className="attach-name">{a.name}</span>
              </span>
            ))}
          </div>
        )}
        {content && <div className="bubble bubble-user">{content}</div>}
        <div className="msg-actions user-actions">
          {at && <span className="msg-time">{formatTime(at)}</span>}
          <button className="action-btn" onClick={() => onRetry(id)} title="Reessayer" aria-label="Reessayer">
            <IconRetry />
          </button>
          <button className="action-btn" onClick={startEdit} title="Modifier" aria-label="Modifier">
            <IconEdit />
          </button>
          <button className="action-btn" onClick={copy} title={copied ? 'Copie !' : 'Copier'} aria-label="Copier">
            {copied ? <IconCheck /> : <IconCopy />}
          </button>
        </div>
      </div>
    </div>
  )
}

function AssistantMessage({ content, isError, feedback, at, canRetry, onRegenerate, onFeedback }) {
  const copyCode = async (e) => {
    const btn = e.target.closest?.('.code-copy')
    if (!btn) return
    const code = btn.parentElement?.querySelector('pre code')?.textContent ?? ''
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      btn.textContent = 'Copie'
      btn.classList.add('copied')
      setTimeout(() => {
        btn.textContent = 'Copier'
        btn.classList.remove('copied')
      }, 1500)
    } catch {
      btn.textContent = 'Erreur'
      setTimeout(() => {
        btn.textContent = 'Copier'
      }, 1500)
    }
  }

  return (
    <div className="msg msg-assistant">
      <span className="msg-avatar" aria-hidden="true">◆</span>
      <div className="msg-body">
        <div
          className={`bubble bubble-assistant markdown ${isError ? 'is-error' : ''}`}
          onClick={copyCode}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
        {content && (
          <MessageActions
            content={content}
            feedback={feedback}
            isError={isError}
            at={at}
            canRetry={canRetry}
            onRegenerate={onRegenerate}
            onFeedback={onFeedback}
          />
        )}
      </div>
    </div>
  )
}

export default function Message(props) {
  return props.role === 'user' ? <UserMessage {...props} /> : <AssistantMessage {...props} />
}
