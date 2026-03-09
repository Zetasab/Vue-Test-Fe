<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Message from 'primevue/message'
import ScrollPanel from 'primevue/scrollpanel'

import { useChatStore } from '@/stores/chat'
import { getSessionUser } from '@/services/auth'

const chatStore = useChatStore()
const draftMessage = ref('')
const showAddConversationDialog = ref(false)
const selectedNewConversationUserId = ref('')
const newConversationMessage = ref('')

const activeConversationId = computed(() => chatStore.receiverUserId)
const availableUsers = computed(() => {
  const currentUserId = chatStore.senderUserId.trim()
  return chatStore.users.filter((item) => item.id && item.id !== currentUserId)
})

function formatConversationTime(value: string) {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toLocaleString()
}

function isOwnMessage(senderId: string) {
  return !!senderId && senderId === chatStore.senderUserId
}

function onSend() {
  chatStore.send(draftMessage.value)
  draftMessage.value = ''
}

async function onSelectConversation(conversationUserId: string) {
  await chatStore.selectConversation(conversationUserId)
}

function openAddConversationDialog() {
  selectedNewConversationUserId.value = availableUsers.value[0]?.id ?? ''
  newConversationMessage.value = ''
  showAddConversationDialog.value = true
}

function closeAddConversationDialog() {
  showAddConversationDialog.value = false
}

async function confirmAddConversation() {
  if (!selectedNewConversationUserId.value || !newConversationMessage.value.trim()) {
    return
  }

  await chatStore.createConversationAndSendMessage(
    selectedNewConversationUserId.value,
    newConversationMessage.value,
  )
  closeAddConversationDialog()
}

onMounted(async () => {
  const sessionUsername = getSessionUser() || 'admin'
  chatStore.senderUserId = sessionUsername

  await chatStore.bootstrap()

  const currentUser = chatStore.users.find((user) => user.username === sessionUsername)
  if (currentUser?.id) {
    chatStore.senderUserId = currentUser.id
  }
})

onBeforeUnmount(() => {
  chatStore.disconnect()
})
</script>

<template>
  <main class="chat-page">
    <section class="panel controls">
      <h1>SignalR Chat</h1>

      <h2>Chats</h2>

      <button
        type="button"
        class="add-conversation"
        :disabled="chatStore.loadingUsers || !availableUsers.length"
        @click="openAddConversationDialog"
      >
        Anadir conversacion
      </button>

      <div class="conversation-list">
        <button
          v-for="item in chatStore.conversations"
          :key="item.conversationUserId"
          type="button"
          class="conversation-item"
          :class="{ active: item.conversationUserId === activeConversationId }"
          @click="onSelectConversation(item.conversationUserId)"
        >
          <span class="conversation-title">{{ item.conversationUsername }}</span>
          <small class="conversation-preview">{{ item.lastMessage || 'Sin mensajes' }}</small>
          <small class="conversation-meta">
            {{ formatConversationTime(item.lastMessageUtc) }}
            <strong v-if="item.unreadCount > 0"> · {{ item.unreadCount }} nuevo(s)</strong>
          </small>
        </button>

        <p v-if="chatStore.loadingConversations" class="status">Cargando chats...</p>
        <p
          v-else-if="!chatStore.conversations.length"
          class="status"
        >
          No hay conversaciones disponibles.
        </p>
      </div>

      <div class="actions">
        <button :disabled="chatStore.loading || chatStore.connected" @click="chatStore.connect">
          {{ chatStore.loading ? 'Conectando...' : 'Conectar' }}
        </button>
        <button :disabled="!chatStore.connected" class="secondary" @click="chatStore.disconnect">
          Desconectar
        </button>
      </div>

      <p class="status" :class="{ online: chatStore.connected }">
        {{ chatStore.connected ? 'Conectado al Hub' : 'Sin conexion' }}
      </p>

      <p v-if="chatStore.error" class="error">{{ chatStore.error }}</p>
      <pre v-if="chatStore.errorDetails" class="error-details">{{ chatStore.errorDetails }}</pre>
    </section>

    <section class="panel messages">
      <ScrollPanel class="message-list message-scroll">
        <p v-if="chatStore.loadingHistory" class="status">Cargando mensajes...</p>
        <article
          v-for="item in chatStore.messages"
          :key="item.id"
          class="message-row"
          :class="{ mine: isOwnMessage(item.senderUserId) }"
        >
          <Message
            :severity="isOwnMessage(item.senderUserId) ? 'contrast' : 'secondary'"
            :closable="false"
            class="message-item"
            :class="{ mine: isOwnMessage(item.senderUserId) }"
          >
            <strong>{{ isOwnMessage(item.senderUserId) ? 'Tu' : (item.senderUsername || item.senderUserId) }}</strong>
            <p>{{ item.message }}</p>
            <time>{{ new Date(item.sentUtc).toLocaleTimeString() }}</time>
          </Message>
        </article>
      </ScrollPanel>

      <form class="composer" @submit.prevent="onSend">
        <input
          v-model="draftMessage"
          :disabled="!chatStore.canSend"
          placeholder="Escribe tu mensaje..."
        />
        <button :disabled="!chatStore.canSend">Enviar</button>
      </form>
    </section>

    <div
      v-if="showAddConversationDialog"
      class="dialog-backdrop"
      @click.self="closeAddConversationDialog"
    >
      <section class="dialog-card">
        <h3>Nueva conversacion</h3>
        <p>Selecciona el usuario y escribe el primer mensaje.</p>

        <select v-model="selectedNewConversationUserId" :disabled="chatStore.loadingUsers">
          <option value="" disabled>
            {{ chatStore.loadingUsers ? 'Cargando usuarios...' : 'Selecciona usuario' }}
          </option>
          <option
            v-for="user in availableUsers"
            :key="user.id"
            :value="user.id"
          >
            {{ user.username }}
          </option>
        </select>

        <textarea
          v-model="newConversationMessage"
          rows="4"
          placeholder="Escribe el primer mensaje..."
        />

        <div class="dialog-actions">
          <button type="button" class="secondary" @click="closeAddConversationDialog">
            Cancelar
          </button>
          <button
            type="button"
            :disabled="!selectedNewConversationUserId || !newConversationMessage.trim()"
            @click="confirmAddConversation"
          >
            Crear y enviar
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.chat-page {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1rem;
  min-height: calc(100dvh - var(--app-navbar-height, 0px));
  padding: 1.25rem;
  background: linear-gradient(180deg, #f3f9ff 0%, #ffffff 70%);
  color: #10243f;
}

.panel {
  border: 1px solid #d4e4f6;
  border-radius: 12px;
  background-color: #fff;
  padding: 1rem;
}

.controls {
  display: grid;
  align-content: start;
  gap: 0.75rem;
}

h2 {
  margin: 0.25rem 0 0;
  font-size: 1rem;
  color: #24496f;
}

label {
  display: grid;
  gap: 0.3rem;
  font-size: 0.9rem;
}

select {
  border: 1px solid #c4d6ec;
  border-radius: 8px;
  padding: 0.6rem;
  font-size: 0.95rem;
}

input {
  border: 1px solid #c4d6ec;
  border-radius: 8px;
  padding: 0.6rem;
  font-size: 0.95rem;
}

textarea {
  border: 1px solid #c4d6ec;
  border-radius: 8px;
  padding: 0.6rem;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.conversation-list {
  display: grid;
  gap: 0.5rem;
  max-height: 18rem;
  overflow-y: auto;
  padding-right: 0.15rem;
}

.conversation-item {
  display: grid;
  gap: 0.1rem;
  text-align: left;
  border: 1px solid #dbe8f7;
  border-radius: 10px;
  background: #f7fbff;
  padding: 0.55rem 0.65rem;
  color: #203d5d;
}

.conversation-item.active {
  border-color: #1f74d1;
  background: #eaf4ff;
}

.conversation-title {
  font-weight: 700;
}

.conversation-preview {
  color: #4a607b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-meta {
  color: #68819f;
}

.add-conversation {
  background-color: #2a8c58;
}

button {
  border: 0;
  border-radius: 8px;
  padding: 0.6rem 0.9rem;
  background-color: #1f74d1;
  color: #fff;
  cursor: pointer;
}

button.secondary {
  background-color: #526277;
}

button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.status {
  font-weight: 600;
  color: #7a8797;
}

.status.online {
  color: #1a915c;
}

.error {
  color: #af1f38;
}

.error-details {
  margin: 0;
  border: 1px solid #efc2cb;
  border-radius: 8px;
  background: #fff6f8;
  color: #6d1022;
  padding: 0.6rem;
  font-size: 0.78rem;
  line-height: 1.35;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 12rem;
  overflow: auto;
}

.messages {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 0.8rem;
}

.message-list {
  border: 1px solid #dbe5f3;
  border-radius: 8px;
  background: #f8fbff;
  padding: 0.8rem;
  display: grid;
  gap: 0.5rem;
}

.message-scroll {
  height: 60dvh;
  min-height: 300px;
  max-height: calc(100dvh - var(--app-navbar-height, 0px) - 9rem);
}

.message-row {
  display: flex;
  justify-content: flex-start;
}

.message-row.mine {
  justify-content: flex-end;
}

.message-item {
  display: grid;
  gap: 0.25rem;
  max-width: min(80%, 540px);
  border-radius: 14px 14px 14px 4px;
  margin: 0;
}

.message-item.mine {
  border-radius: 14px 14px 4px 14px;
}

.message-item :deep(.p-message-content) {
  align-items: start;
  gap: 0.25rem;
  padding: 0.6rem 0.75rem;
}

.message-item :deep(.p-message-icon) {
  display: none;
}

.message-item p {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

time {
  font-size: 0.75rem;
  color: #6b7c91;
  justify-self: end;
}

.composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.6rem;
}

.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgb(16 36 63 / 45%);
  display: grid;
  place-items: center;
  padding: 1rem;
}

.dialog-card {
  width: min(100%, 420px);
  display: grid;
  gap: 0.8rem;
  border: 1px solid #d4e4f6;
  border-radius: 12px;
  background: #fff;
  padding: 1rem;
  color: #173759;
}

.dialog-card h3 {
  margin: 0;
}

.dialog-card p {
  margin: 0;
  color: #5a6f8a;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (max-width: 900px) {
  .chat-page {
    grid-template-columns: 1fr;
  }

  .message-scroll {
    height: 50dvh;
  }
}
</style>
