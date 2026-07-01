import { useEffect, useMemo, useRef, useState } from 'react'

export default function CommandPalette({
  open,
  theme,
  active,
  onClose,
  onNewConversation,
  onOpenSettings,
  onToggleTheme,
  onCopyLastResponse,
  onExport,
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)

  const actions = useMemo(() => {
    const list = [
      { id: 'new', label: 'Nouvelle conversation', shortcut: 'Ctrl K', action: onNewConversation },
      { id: 'settings', label: 'Ouvrir les reglages', shortcut: 'Ctrl ,', action: onOpenSettings },
      {
        id: 'theme',
        label: theme === 'dark' ? 'Passer en theme clair' : 'Passer en theme sombre',
        action: onToggleTheme,
      },
      { id: 'copy', label: 'Copier la derniere reponse', action: onCopyLastResponse, disabled: !active },
      { id: 'export', label: 'Exporter la conversation', action: onExport, disabled: !active },
    ]
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((a) => a.label.toLowerCase().includes(q))
  }, [query, theme, active, onNewConversation, onOpenSettings, onToggleTheme, onCopyLastResponse, onExport])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    setSelected(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((i) => (i + 1) % actions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((i) => (i - 1 + actions.length) % actions.length)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const action = actions[selected]
        if (action && !action.disabled) {
          action.action()
          onClose()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, actions, selected, onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Commandes">
        <input
          ref={inputRef}
          className="command-input"
          placeholder="Tapez une commande..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="command-list">
          {actions.map((a, i) => (
            <li
              key={a.id}
              className={`command-item ${i === selected ? 'is-selected' : ''} ${a.disabled ? 'is-disabled' : ''}`}
              onMouseEnter={() => setSelected(i)}
              onClick={() => {
                if (!a.disabled) {
                  a.action()
                  onClose()
                }
              }}
            >
              <span className="command-label">{a.label}</span>
              {a.shortcut && <kbd className="command-shortcut">{a.shortcut}</kbd>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
