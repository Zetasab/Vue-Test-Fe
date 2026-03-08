<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useChatStore } from '@/stores/chat'
import { getSessionUser, logout } from '@/services/auth'

const chatStore = useChatStore()
const draftMessage = ref('')
const router = useRouter()

function onSend() {
  chatStore.send(draftMessage.value)
  draftMessage.value = ''
}

async function onLogout() {
  await chatStore.disconnect()
  logout()
  await router.push('/login')
}

onMounted(() => {
  chatStore.user = getSessionUser() || 'admin'
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
        Usuario
        <input v-model="chatStore.user" placeholder="admin" />
      </label>

      <label>
        Sala
        <input
          :value="chatStore.room"
          placeholder="general"
          @change="chatStore.reconnectToRoom(($event.target as HTMLInputElement).value)"
        />
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
    </section>

    <section class="panel messages">
      <div class="message-list">
        <article v-for="item in chatStore.messages" :key="item.id" class="message-item">
          <strong>{{ item.user }}</strong>
          <p>{{ item.message }}</p>
          <time>{{ new Date(item.createdAt).toLocaleTimeString() }}</time>
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
  min-height: 100dvh;
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

.messages {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 0.8rem;
}

.message-list {
  border: 1px solid #e6eef8;
  border-radius: 8px;
  background: #fcfeff;
  max-height: calc(100dvh - 9rem);
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
