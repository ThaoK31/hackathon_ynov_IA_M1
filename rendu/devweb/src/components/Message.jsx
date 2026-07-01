import { renderMarkdown } from '../lib/markdown.js'
import MessageActions from './MessageActions.jsx'
import { IconPaperclip } from './icons.jsx'

export default function Message({ role, content, isError, feedback, attachments, canRetry, onRegenerate, onFeedback }) {
  if (role === 'user') {
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
        </div>
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
