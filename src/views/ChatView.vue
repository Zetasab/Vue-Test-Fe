<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useChatStore } from '@/stores/chat'
import { getSessionUser, logout } from '@/services/auth'

const chatStore = useChatStore()
const draftMessage = ref('')
const router = useRouter()

const receiverCandidates = computed(() => {
  const senderId = chatStore.senderUserId?.trim()
  return chatStore.users.filter((user) => user.id && user.id !== senderId)
})

function onSend() {
  chatStore.send(draftMessage.value)
  draftMessage.value = ''
}

async function onLogout() {
  await chatStore.disconnect()
  logout()
  await router.push('/login')
}

onMounted(async () => {
  const sessionUsername = getSessionUser() || 'admin'
  chatStore.senderUserId = sessionUsername

  await chatStore.bootstrap()

  const currentUser = chatStore.users.find((user) => user.username === sessionUsername)
  if (currentUser?.id) {
    chatStore.senderUserId = currentUser.id
  }

  const selectedIsInvalid = !receiverCandidates.value.some(
    (user) => user.id === chatStore.receiverUserId,
  )

  if (selectedIsInvalid) {
    chatStore.receiverUserId = receiverCandidates.value[0]?.id ?? ''
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

      <button class="logout" @click="onLogout">Cerrar sesion</button>

      <label>
        Receiver User ID
        <select v-model="chatStore.receiverUserId" :disabled="chatStore.loadingUsers">
          <option value="" disabled>
            {{ chatStore.loadingUsers ? 'Cargando usuarios...' : 'Selecciona usuario' }}
          </option>
          <option
            v-for="user in receiverCandidates"
            :key="user.id"
            :value="user.id"
          >
            {{ user.username }} 
          </option>
        </select>
      </label>

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
      <div class="message-list">
        <article v-for="item in chatStore.messages" :key="item.id" class="message-item">
          <strong>{{ item.senderUsername || item.senderUserId }}</strong>
          <small>Para: {{ item.receiverUserId }}</small>
          <p>{{ item.message }}</p>
          <time>{{ new Date(item.sentUtc).toLocaleTimeString() }}</time>
        </article>
      </div>

      <form class="composer" @submit.prevent="onSend">
        <input
          v-model="draftMessage"
          :disabled="!chatStore.canSend"
          placeholder="Escribe tu mensaje..."
        />
        <button :disabled="!chatStore.canSend">Enviar</button>
      </form>
    </section>
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

.logout {
  justify-self: end;
  background-color: #af1f38;
}

label {
  display: grid;
  gap: 0.3rem;
  font-size: 0.9rem;
}

input {
  border: 1px solid #c4d6ec;
  border-radius: 8px;
  padding: 0.6rem;
  font-size: 0.95rem;
}

select {
  border: 1px solid #c4d6ec;
  border-radius: 8px;
  padding: 0.6rem;
  font-size: 0.95rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
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
  border: 1px solid #e6eef8;
  border-radius: 8px;
  background: #fcfeff;
  max-height: calc(100dvh - var(--app-navbar-height, 0px) - 9rem);
  overflow-y: auto;
  padding: 0.8rem;
}

.message-item {
  border-bottom: 1px solid #eef4fb;
  padding: 0.55rem 0;
}

.message-item p {
  margin: 0.25rem 0;
}

.message-item small {
  display: block;
  color: #6b7c91;
}

time {
  font-size: 0.75rem;
  color: #6b7c91;
}

.composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.6rem;
}

@media (max-width: 900px) {
  .chat-page {
    grid-template-columns: 1fr;
  }

  .message-list {
    max-height: 50dvh;
  }
}
</style>
