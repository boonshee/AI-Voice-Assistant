import type { ChatMessage } from '../ai/openai'

/** 保留最近 maxMessages 条对话，避免 token 超限 */
export function trimMessages(messages: ChatMessage[], maxMessages = 20): ChatMessage[] {
  if (messages.length <= maxMessages) return messages
  return messages.slice(-maxMessages)
}
