import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { ChatConversationSummary } from '@/models/chats/chat-conversation-summary.model'
import type { UserModel } from '@/models/users/user.model'
import { getConversations } from '@/services/chats/chat.service'
import type { IncomingChatMessageEvent } from '@/services/signalrChat'
import { SignalRChatClient } from '@/services/signalrChat'
import { getAllUsers } from '@/services/users/user.service'

export interface ChatMessage extends IncomingChatMessageEvent {
  id: string
}

export const useChatStore = defineStore('chat', () => {
  const client = new SignalRChatClient()

  const connected = ref(false)
  const loading = ref(false)
  const senderUserId = ref('')
  const receiverUserId = ref('')
  const users = ref<UserModel[]>([])
  const conversations = ref<ChatConversationSummary[]>([])
  const messages = ref<ChatMessage[]>([])
  const error = ref('')
  const errorDetails = ref('')
  const loadingUsers = ref(false)
  const loadingConversations = ref(false)
  const loadingHistory = ref(false)

  const canSend = computed(
    () => connected.value && !!receiverUserId.value.trim(),
  )

  function addMessage(message: IncomingChatMessageEvent) {
    const currentSenderId = senderUserId.value.trim()
    const selectedConversationId = receiverUserId.value.trim()

    if (selectedConversationId && currentSenderId) {
      const isFromCurrentUser = message.senderUserId === currentSenderId
      const otherUserId = isFromCurrentUser ? message.receiverUserId : message.senderUserId

      if (otherUserId !== selectedConversationId) {
        return
      }
    }

    messages.value.push({
      ...message,
      id: crypto.randomUUID(),
    })
  }

  async function loadConversationHistory(otherUserId: string, limit = 20) {
    const cleanOtherUserId = otherUserId.trim()
    if (!cleanOtherUserId) {
      messages.value = []
      return
    }

    if (!connected.value) {
      await connect()
    }

    loadingHistory.value = true
    error.value = ''

    try {
      const history = await client.getHistory(cleanOtherUserId, limit)
      messages.value = history.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
      }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load message history'
      messages.value = []
    } finally {
      loadingHistory.value = false
    }
  }

  async function connect() {
    if (connected.value || loading.value) {
      return
    }

    loading.value = true
    error.value = ''
    errorDetails.value = ''

    try {
      await client.connect(addMessage)
      connected.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to connect to SignalR Hub'
      connected.value = false
    } finally {
      loading.value = false
    }
  }

  async function fetchUsers() {
    loadingUsers.value = true
    error.value = ''
    errorDetails.value = ''

    try {
      const list = await getAllUsers()
      users.value = Array.isArray(list) ? list.filter((item) => item?.isActive !== false) : []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load users'
      users.value = []
    } finally {
      loadingUsers.value = false
    }
  }

  async function fetchConversations(limit = 30) {
    loadingConversations.value = true
    error.value = ''

    try {
      conversations.value = await getConversations(limit)

      const selectedIsInvalid = !conversations.value.some(
        (item) => item.conversationUserId === receiverUserId.value,
      )

      if (selectedIsInvalid) {
        receiverUserId.value = conversations.value[0]?.conversationUserId ?? ''
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load conversations'
      conversations.value = []
    } finally {
      loadingConversations.value = false
    }
  }

  async function selectConversation(conversationUserId: string) {
    const cleanConversationUserId = conversationUserId.trim()
    receiverUserId.value = cleanConversationUserId
    await loadConversationHistory(cleanConversationUserId)
  }

  async function createConversationAndSendMessage(userId: string, message: string) {
    const cleanUserId = userId.trim()
    const cleanMessage = message.trim()

    if (!cleanUserId || !cleanMessage) {
      return
    }

    const exists = conversations.value.some((item) => item.conversationUserId === cleanUserId)

    if (!exists) {
      const selectedUser = users.value.find((item) => item.id === cleanUserId)
      conversations.value = [
        {
          conversationUserId: cleanUserId,
          conversationUsername: selectedUser?.username ?? 'Usuario',
          lastMessage: '',
          lastMessageUtc: new Date(0).toISOString(),
          unreadCount: 0,
        },
        ...conversations.value,
      ]
    }

    receiverUserId.value = cleanUserId

    if (!connected.value) {
      await connect()
    }

    await send(cleanMessage)
    await loadConversationHistory(cleanUserId)
  }

  async function bootstrap() {
    await Promise.all([fetchUsers(), fetchConversations(), connect()])

    if (receiverUserId.value.trim()) {
      await loadConversationHistory(receiverUserId.value.trim())
    }
  }

  async function send(text: string) {
    const clean = text.trim()
    if (!clean || !canSend.value) {
      return
    }

    try {
      await client.sendMessage(receiverUserId.value.trim(), clean)
      errorDetails.value = ''
    } catch (err) {
      const details = {
        senderUserId: senderUserId.value,
        receiverUserId: receiverUserId.value,
        message: clean,
        error:
          err instanceof Error
            ? {
                name: err.name,
                message: err.message,
                stack: err.stack,
                details: (err as Error & { details?: unknown }).details,
              }
            : err,
      }

      console.error('[ChatStore] Failed to send message', {
        senderUserId: senderUserId.value,
        receiverUserId: receiverUserId.value,
        message: clean,
        error: err,
      })
      console.log('[ChatStore] Failed to send message details', details)
      error.value = err instanceof Error ? err.message : 'Failed to send message'
      errorDetails.value = JSON.stringify(details, null, 2)
    }
  }

  async function disconnect() {
    try {
      await client.disconnect()
    } finally {
      connected.value = false
    }
  }

  return {
    connected,
    loading,
    senderUserId,
    receiverUserId,
    users,
    conversations,
    messages,
    error,
    errorDetails,
    loadingUsers,
    loadingConversations,
    loadingHistory,
    canSend,
    connect,
    fetchUsers,
    fetchConversations,
    loadConversationHistory,
    selectConversation,
    createConversationAndSendMessage,
    bootstrap,
    send,
    disconnect,
  }
})
