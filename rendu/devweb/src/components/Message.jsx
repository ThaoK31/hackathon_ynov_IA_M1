import { renderMarkdown } from '../lib/markdown.js'
import MessageActions from './MessageActions.jsx'

export default function Message({ role, content, isError, feedback, canRetry, onRegenerate, onFeedback }) {
  if (role === 'user') {
    return (
      <div className="msg msg-user">
        <div className="bubble bubble-user">{content}</div>
      </div>
    )
  }

  return (
    <div className="msg msg-assistant">
      <span className="msg-avatar" aria-hidden="true">◆</span>
      <div className="msg-body">
        <div
          className={`bubble bubble-assistant markdown ${isError ? 'is-error' : ''}`}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
        {content && (
          <MessageActions
            content={content}
            feedback={feedback}
            isError={isError}
            canRetry={canRetry}
            onRegenerate={onRegenerate}
            onFeedback={onFeedback}
          />
        )}
      </div>
    </div>
  )
}
