import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import StatusBadge from './components/StatusBadge.jsx'
import EmptyState from './components/EmptyState.jsx'
import MessageList from './components/MessageList.jsx'
import Composer from './components/Composer.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import { checkConnection, streamChat } from './lib/ollama.js'
import * as store from './lib/storage.js'

const uid = () =>
  crypto?.randomUUID ? crypto.randomUUID() : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const titleFrom = (text) => text.replace(/\s+/g, ' ').trim().slice(0, 42) || 'Nouvelle conversation'

export default function App() {
  const [conversations, setConversations] = useState(store.loadConversations)
  const [activeId, setActiveId] = useState(store.loadActiveId)
  const [settings, setSettings] = useState(store.loadSettings)
  const [theme, setTheme] = useState(store.loadTheme)
  const [connection, setConnection] = useState({ checking: true, ok: false, models: [], latencyMs: null, error: null })
  const [streaming, setStreaming] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const abortRef = useRef(null)

  // Persistance
  useEffect(() => store.saveConversations(conversations), [conversations])
  useEffect(() => store.saveActiveId(activeId), [activeId])
  useEffect(() => store.saveSettings(settings), [settings])
  useEffect(() => {
    store.saveTheme(theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Health-check du serveur d'inference (au demarrage puis toutes les 15 s)
  useEffect(() => {
    let alive = true
    const ping = async () => {
      const res = await checkConnection()
      if (alive) setConnection({ checking: false, ...res })
    }
    ping()
    const id = setInterval(ping, 15000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  const active = conversations.find((c) => c.id === activeId) || null

  const newConversation = useCallback(() => {
    const conv = { id: uid(), title: '', messages: [], createdAt: Date.now() }
    setConversations((prev) => [conv, ...prev])
    setActiveId(conv.id)
    return conv
  }, [])

  const deleteConversation = useCallback((id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    setActiveId((prev) => (prev === id ? null : prev))
  }, [])

  const updateMessage = useCallback((convId, msgId, updater) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id !== convId ? c : { ...c, messages: c.messages.map((m) => (m.id !== msgId ? m : updater(m))) },
      ),
    )
  }, [])

  // Raccourci clavier : Ctrl/Cmd + K -> nouvelle conversation.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        newConversation()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [newConversation])

  const send = useCallback(
    async (text) => {
      if (streaming || !text.trim()) return

      let conv = active
      if (!conv) conv = newConversation()
      const convId = conv.id

      const userMsg = { id: uid(), role: 'user', content: text }
      const asstMsg = { id: uid(), role: 'assistant', content: '' }

      setConversations((prev) =>
        prev.map((c) =>
          c.id !== convId
            ? c
            : { ...c, title: c.title || titleFrom(text), messages: [...c.messages, userMsg, asstMsg] },
        ),
      )

      setStreaming(true)
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const history = [...conv.messages, userMsg].map(({ role, content }) => ({ role, content }))
        await streamChat({
          model: settings.model,
          messages: history,
          systemPrompt: settings.systemPrompt,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          signal: controller.signal,
          onToken: (tok) => updateMessage(convId, asstMsg.id, (m) => ({ ...m, content: m.content + tok })),
        })
      } catch (err) {
        if (err.name === 'AbortError') {
          updateMessage(convId, asstMsg.id, (m) => ({
            ...m,
            content: m.content || '_Generation interrompue._',
          }))
        } else {
          updateMessage(convId, asstMsg.id, (m) => ({ ...m, content: err.message, isError: true }))
        }
      } finally {
        setStreaming(false)
        abortRef.current = null
      }
    },
    [active, streaming, settings, newConversation, updateMessage],
  )

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const hasMessages = active && active.messages.length > 0
  const lastUserMessage = active
    ? [...active.messages].reverse().find((m) => m.role === 'user')?.content ?? ''
    : ''

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        open={sidebarOpen}
        theme={theme}
        onSelect={setActiveId}
        onNew={newConversation}
        onDelete={deleteConversation}
        onToggle={() => setSidebarOpen((v) => !v)}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="main">
        <header className="topbar">
          {!sidebarOpen && (
            <button className="icon-btn" onClick={() => setSidebarOpen(true)} title="Afficher le menu" aria-label="Afficher le menu">
              ☰
            </button>
          )}
          <div className="topbar-title">{active?.title || 'TechCorp AI'}</div>
          <StatusBadge connection={connection} />
        </header>

        {hasMessages ? (
          <MessageList key={active.id} messages={active.messages} streaming={streaming} />
        ) : (
          <EmptyState onPick={send} />
        )}

        <Composer
          streaming={streaming}
          models={connection.models}
          model={settings.model}
          lastUserMessage={lastUserMessage}
          onSend={send}
          onStop={stop}
          onModelChange={(m) => setSettings((s) => ({ ...s, model: m }))}
        />
      </main>

      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          models={connection.models}
          onClose={() => setSettingsOpen(false)}
          onSave={(draft) => {
            setSettings(draft)
            setSettingsOpen(false)
          }}
        />
      )}
    </div>
  )
}
