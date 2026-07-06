import type { ChatMessage } from '../ai/openai'

interface Props {
  message: ChatMessage
}

export function ChatMessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`message-row ${isUser ? 'message-row-user' : 'message-row-assistant'}`}>
      <div className="message-wrap">
        <span className="message-label">{isUser ? '你' : 'AI'}</span>
        <div className={`message-bubble ${isUser ? 'message-bubble-user' : 'message-bubble-assistant'}`}>
          {message.content}
        </div>
      </div>
    </div>
  )
}
