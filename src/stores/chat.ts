import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { IncomingChatMessage } from '@/services/signalrChat'
import { SignalRChatClient } from '@/services/signalrChat'

export interface ChatMessage extends IncomingChatMessage {
  id: string
}

export const useChatStore = defineStore('chat', () => {
  const client = new SignalRChatClient()

  const connected = ref(false)
  const loading = ref(false)
  const room = ref('general')
  const user = ref('')
  const messages = ref<ChatMessage[]>([])
  const error = ref('')

  const canSend = computed(() => connected.value && !!user.value.trim())

  function addMessage(message: IncomingChatMessage) {
    messages.value.push({
      ...message,
      id: crypto.randomUUID(),
    })
  }

  async function connect() {
    loading.value = true
    error.value = ''

    try {
      await client.connect(addMessage)
      connected.value = true
      if (room.value.trim()) {
        await client.joinRoom(room.value.trim())
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to connect to SignalR Hub'
      connected.value = false
    } finally {
      loading.value = false
    }
  }

  async function reconnectToRoom(nextRoom: string) {
    room.value = nextRoom

    if (!connected.value || !room.value.trim()) {
      return
    }

    try {
      await client.joinRoom(room.value.trim())
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Could not join room'
    }
  }

  async function send(text: string) {
    const clean = text.trim()
    if (!clean || !canSend.value) {
      return
    }

    try {
      await client.sendMessage(user.value.trim(), clean, room.value.trim() || undefined)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send message'
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
    room,
    user,
    messages,
    error,
    canSend,
    connect,
    reconnectToRoom,
    send,
    disconnect,
  }
})
