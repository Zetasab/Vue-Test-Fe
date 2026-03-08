import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { UserModel } from '@/models/users/user.model'
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
  const messages = ref<ChatMessage[]>([])
  const error = ref('')
  const errorDetails = ref('')
  const loadingUsers = ref(false)

  const canSend = computed(
    () => connected.value && !!receiverUserId.value.trim(),
  )

  function addMessage(message: IncomingChatMessageEvent) {
    messages.value.push({
      ...message,
      id: crypto.randomUUID(),
    })
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

  async function bootstrap() {
    await Promise.all([fetchUsers(), connect()])
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
    messages,
    error,
    errorDetails,
    loadingUsers,
    canSend,
    connect,
    fetchUsers,
    bootstrap,
    send,
    disconnect,
  }
})
