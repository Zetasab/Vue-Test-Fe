import type { ChatConversationSummary } from '@/models/chats/chat-conversation-summary.model'

import { get } from '@/services/baseService'

const CHAT_MESSAGES_ENDPOINT = import.meta.env.VITE_CHAT_MESSAGES_ENDPOINT ?? '/chats/messages'

function asNonEmptyString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function normalizeConversation(item: unknown): ChatConversationSummary {
  const source = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}

  return {
    conversationUserId:
      asNonEmptyString(source.conversationUserId)
      || asNonEmptyString(source.otherUserId)
      || asNonEmptyString(source.userId)
      || asNonEmptyString(source.receiverUserId)
      || asNonEmptyString(source.id),
    conversationUsername:
      asNonEmptyString(source.conversationUsername)
      || asNonEmptyString(source.otherUsername)
      || asNonEmptyString(source.username)
      || asNonEmptyString(source.displayName)
      || 'Sin nombre',
    lastMessage:
      asNonEmptyString(source.lastMessage)
      || asNonEmptyString(source.message)
      || asNonEmptyString(source.preview),
    lastMessageUtc:
      asNonEmptyString(source.lastMessageUtc)
      || asNonEmptyString(source.lastMessageSentUtc)
      || asNonEmptyString(source.sentUtc)
      || asNonEmptyString(source.updatedUtc)
      || asNonEmptyString(source.createdUtc)
      || new Date(0).toISOString(),
    unreadCount:
      asNumber(source.unreadCount)
      || asNumber(source.pendingCount)
      || asNumber(source.newMessages),
  }
}

export async function getConversations(limit?: number): Promise<ChatConversationSummary[]> {
  const query = typeof limit === 'number' ? `?limit=${limit}` : ''
  const response = await get<unknown>(`${CHAT_MESSAGES_ENDPOINT}/conversations${query}`)

  if (!Array.isArray(response)) {
    return []
  }

  return response
    .map(normalizeConversation)
    .filter((item) => !!item.conversationUserId)
}
