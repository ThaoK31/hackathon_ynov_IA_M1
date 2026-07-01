import { useEffect, useRef, useState } from 'react'
import Message from './Message.jsx'
import TypingIndicator from './TypingIndicator.jsx'
import { IconArrowDown } from './icons.jsx'

export default function MessageList({ messages, streaming, onRegenerate, onFeedback, onRetry, onEdit }) {
  const containerRef = useRef(null)
  const endRef = useRef(null)
  const stick = useRef(true) // faut-il suivre le bas automatiquement ?
  const [showJump, setShowJump] = useState(false)

  // On ne recolle en bas que si l'utilisateur y est deja (sinon on le laisse lire plus haut).
  const onScroll = () => {
    const el = containerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    stick.current = nearBottom
    setShowJump(!nearBottom)
  }

  const scrollToBottom = () => {
    stick.current = true
    setShowJump(false)
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (stick.current) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
      setShowJump(false)
    }
  }, [messages, streaming])

  let lastAssistant = -1
  for (let k = messages.length - 1; k >= 0; k -= 1) {
    if (messages[k].role === 'assistant') {
      lastAssistant = k
      break
    }
  }

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
          return (
            <Message
              key={m.id}
              {...m}
              canRetry={i === lastAssistant && !streaming}
              onRegenerate={onRegenerate}
              onFeedback={(value) => onFeedback(m.id, value)}
              onRetry={onRetry}
              onEdit={onEdit}
            />
          )
        })}
        <div ref={endRef} />
      </div>
      {showJump && (
        <button className="jump-bottom" onClick={scrollToBottom} title="Descendre" aria-label="Descendre en bas de la conversation">
          <IconArrowDown />
        </button>
      )}
    </div>
  )
}
