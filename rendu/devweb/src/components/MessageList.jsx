import { useEffect, useRef } from 'react'
import Message from './Message.jsx'
import TypingIndicator from './TypingIndicator.jsx'

export default function MessageList({ messages, streaming }) {
  const containerRef = useRef(null)
  const endRef = useRef(null)
  const stick = useRef(true) // faut-il suivre le bas automatiquement ?

  // On ne recolle en bas que si l'utilisateur y est deja (sinon on le laisse lire plus haut).
  const onScroll = () => {
    const el = containerRef.current
    if (!el) return
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  useEffect(() => {
    if (stick.current) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  return (
    <div className="messages" ref={containerRef} onScroll={onScroll}>
      <div className="messages-inner">
        {messages.map((m, i) => {
          const isLast = i === messages.length - 1
          if (isLast && streaming && m.role === 'assistant' && !m.content) {
            return (
              <div key={m.id} className="msg msg-assistant">
                <span className="msg-avatar" aria-hidden="true">◆</span>
                <div className="bubble bubble-assistant">
                  <TypingIndicator />
                </div>
              </div>
            )
          }
          return <Message key={m.id} {...m} />
        })}
        <div ref={endRef} />
      </div>
    </div>
  )
}
