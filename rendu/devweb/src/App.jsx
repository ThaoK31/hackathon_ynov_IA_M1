import { useCallback, useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import StatusBadge from './components/StatusBadge.jsx'
import EmptyState from './components/EmptyState.jsx'
import MessageList from './components/MessageList.jsx'
import Composer from './components/Composer.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import { checkConnection, getLocalGuardReply, streamChat } from './lib/ollama.js'
import * as store from './lib/storage.js'
import { expandUserContent } from './lib/attachments.js'

const uid = () =>
  crypto?.randomUUID ? crypto.randomUUID() : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const titleFrom = (text) => text.replace(/\s+/g, ' ').trim().slice(0, 42) || 'Nouvelle conversation'
const startsOnNewChat = () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('new')

export default function App() {
  const [conversations, setConversations] = useState(store.loadConversations)
  const [activeId, setActiveId] = useState(() => (startsOnNewChat() ? null : store.loadActiveId()))
  const [settings, setSettings] = useState(store.loadSettings)
  const [theme, setTheme] = useState(store.loadTheme)
  const [connection, setConnection] = useState({ checking: true, ok: false, models: [], latencyMs: null, error: null })
  const [streaming, setStreaming] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 760)
  const abortRef = useRef(null)

  // Persistance
  useEffect(() => store.saveConversations(conversations), [conversations])
  useEffect(() => store.saveActiveId(activeId), [activeId])
  useEffect(() => store.saveSettings(settings), [settings])
  useEffect(() => {
    store.saveTheme(theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (!connection.ok || connection.models.length === 0) return
    setSettings((prev) => {
      const model = store.pickAvailableModel(prev.model, connection.models)
      return model === prev.model ? prev : { ...prev, model }
    })
  }, [connection.ok, connection.models])

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

  const openNewConversation = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
      setStreaming(false)
    }
    setConversations((prev) => prev.filter((c) => c.messages?.length > 0))
    setActiveId(null)
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
        openNewConversation()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openNewConversation])

  // Coeur de la generation : ajoute une reponse assistant vide au contexte fourni
  // (qui doit se terminer par un message user) puis streame dedans.
  const runAssistant = useCallback(
    async (convId, context) => {
      const localReply = getLocalGuardReply(context, settings.systemPrompt)
      if (localReply) {
        const asstMsg = { id: uid(), role: 'assistant', content: localReply, at: Date.now() }
        setConversations((prev) =>
          prev.map((c) => (c.id !== convId ? c : { ...c, messages: [...context, asstMsg] })),
        )
        return
      }

      const asstMsg = { id: uid(), role: 'assistant', content: '', at: Date.now() }
      setConversations((prev) =>
        prev.map((c) => (c.id !== convId ? c : { ...c, messages: [...context, asstMsg] })),
      )

      setStreaming(true)
      const controller = new AbortController()
      abortRef.current = controller

      try {
        await streamChat({
          model: settings.model,
          messages: context.map((m) => ({ role: m.role, content: expandUserContent(m) })),
          systemPrompt: settings.systemPrompt,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          signal: controller.signal,
          onToken: (tok) => updateMessage(convId, asstMsg.id, (m) => ({ ...m, content: m.content + tok })),
          onReplace: (text) => updateMessage(convId, asstMsg.id, (m) => ({ ...m, content: text })),
        })
      } catch (err) {
        if (err.name === 'AbortError') {
          updateMessage(convId, asstMsg.id, (m) => ({ ...m, content: m.content || '_Generation interrompue._' }))
        } else {
          updateMessage(convId, asstMsg.id, (m) => ({ ...m, content: err.message, isError: true }))
        }
      } finally {
        if (abortRef.current === controller) {
          setStreaming(false)
          abortRef.current = null
        }
      }
    },
    [settings, updateMessage],
  )

  const send = useCallback(
    async (text, attachments = []) => {
      const value = (text || '').trim()
      if (streaming || (!value && attachments.length === 0)) return
      let conv = active
      const userMsg = { id: uid(), role: 'user', content: value, attachments, at: Date.now() }
      const title = value
        ? titleFrom(value)
        : attachments[0]
          ? `Document : ${attachments[0].name}`
          : 'Nouvelle conversation'

      if (!conv) {
        conv = { id: uid(), title, messages: [], createdAt: Date.now() }
        setConversations((prev) => [conv, ...prev.filter((c) => c.messages?.length > 0)])
        setActiveId(conv.id)
      } else if (!conv.title) {
        setConversations((prev) => prev.map((c) => (c.id !== conv.id ? c : { ...c, title })))
      }
      await runAssistant(conv.id, [...conv.messages, userMsg])
    },
    [active, streaming, runAssistant],
  )

  // Regenere la derniere reponse de l'assistant.
  const regenerate = useCallback(async () => {
    if (streaming || !active) return
    const msgs = active.messages
    const end = msgs.length && msgs[msgs.length - 1].role === 'assistant' ? msgs.length - 1 : msgs.length
    const context = msgs.slice(0, end)
    if (!context.length || context[context.length - 1].role !== 'user') return
    await runAssistant(active.id, context)
  }, [active, streaming, runAssistant])

  const setFeedback = useCallback(
    (convId, msgId, value) => {
      updateMessage(convId, msgId, (m) => ({ ...m, feedback: m.feedback === value ? null : value }))
    },
    [updateMessage],
  )

  // Reessayer depuis un message user : on regenere la reponse a ce message
  // (on retire ce qui suit).
  const regenerateFrom = useCallback(
    async (userMsgId) => {
      if (streaming || !active) return
      const idx = active.messages.findIndex((m) => m.id === userMsgId)
      if (idx < 0 || active.messages[idx].role !== 'user') return
      await runAssistant(active.id, active.messages.slice(0, idx + 1))
    },
    [active, streaming, runAssistant],
  )

  // Editer un message user puis renvoyer : on remplace son contenu et on
  // regenere a partir de la (les messages suivants sont abandonnes).
  const editAndResend = useCallback(
    async (userMsgId, newText) => {
      if (streaming || !active) return
      const value = newText.trim()
      if (!value) return
      const idx = active.messages.findIndex((m) => m.id === userMsgId)
      if (idx < 0) return
      const edited = { ...active.messages[idx], content: value, at: Date.now() }
      await runAssistant(active.id, [...active.messages.slice(0, idx), edited])
    },
    [active, streaming, runAssistant],
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
        onNew={openNewConversation}
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
          <MessageList
            key={active.id}
            messages={active.messages}
            streaming={streaming}
            onRegenerate={regenerate}
            onFeedback={(msgId, value) => setFeedback(active.id, msgId, value)}
            onRetry={regenerateFrom}
            onEdit={editAndResend}
          />
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
