import { renderMarkdown } from '../lib/markdown.js'

export default function Message({ role, content, isError }) {
  const isUser = role === 'user'

  if (isUser) {
    return (
      <div className="msg msg-user">
        <div className="bubble bubble-user">{content}</div>
      </div>
    )
  }

  return (
    <div className="msg msg-assistant">
      <span className="msg-avatar" aria-hidden="true">◆</span>
      <div
        className={`bubble bubble-assistant markdown ${isError ? 'is-error' : ''}`}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
    </div>
  )
}
