import { useState } from 'react'
import { IconSearch } from './icons.jsx'

export default function Sidebar({
  conversations,
  activeId,
  open,
  theme,
  onSelect,
  onNew,
  onDelete,
  onToggle,
  onToggleTheme,
  onOpenSettings,
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const filtered = q
    ? conversations.filter(
        (c) =>
          (c.title || '').toLowerCase().includes(q) ||
          c.messages.some((m) => m.content.toLowerCase().includes(q)),
      )
    : conversations

  return (
    <aside className={`sidebar ${open ? '' : 'sidebar-collapsed'}`}>
      <div className="sidebar-top">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">◆</span>
          <span className="brand-name">TechCorp <span className="brand-accent">AI</span></span>
        </div>
        <button className="icon-btn" onClick={onToggle} title="Reduire le menu" aria-label="Reduire le menu">
          ⟨
        </button>
      </div>

      <button className="btn-new" onClick={onNew}>
        <span className="btn-new-plus">+</span> Nouvelle conversation
      </button>

      {conversations.length > 0 && (
        <div className="search">
          <IconSearch />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            aria-label="Rechercher une conversation"
          />
        </div>
      )}

      <nav className="history">
        <div className="history-label">Historique</div>
        {conversations.length === 0 && <p className="history-empty">Aucune conversation pour l'instant.</p>}
        {conversations.length > 0 && filtered.length === 0 && <p className="history-empty">Aucun resultat.</p>}
        {filtered.map((c) => (
          <div
            key={c.id}
            className={`conv ${c.id === activeId ? 'active' : ''}`}
            onClick={() => onSelect(c.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(c.id)}
          >
            <span className="conv-title">{c.title || 'Nouvelle conversation'}</span>
            <button
              className="conv-del"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(c.id)
              }}
              title="Supprimer"
              aria-label="Supprimer la conversation"
            >
              ✕
            </button>
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="ghost-btn" onClick={onToggleTheme}>
          {theme === 'dark' ? '☀  Theme clair' : '☾  Theme sombre'}
        </button>
        <button className="ghost-btn" onClick={onOpenSettings}>
          ⚙  Reglages
        </button>
      </div>
    </aside>
  )
}
