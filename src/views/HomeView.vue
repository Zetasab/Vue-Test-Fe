<script setup lang="ts">
import { useRouter } from 'vue-router'

import { logout } from '../services/auth'

const router = useRouter()

async function onLogout() {
  logout()
  await router.push('/login')
}
</script>

<template>
  <main class="home-page">
    <section class="hero">
      <h1>Zeta Test FE</h1>
      <p>Esta es la pagina principal. Desde aqui puedes entrar al juego o al chat.</p>

      <div class="actions">
        <RouterLink class="action-link" to="/game">Ir a Game</RouterLink>
        <RouterLink class="action-link" to="/game-filter">Ir a Filter Games</RouterLink>
        <RouterLink class="action-link" to="/chats">Ir a Chats</RouterLink>
        <button class="logout" @click="onLogout">Cerrar sesion</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  min-height: calc(100dvh - var(--app-navbar-height, 0px));
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background: radial-gradient(circle at 10% 10%, #e7f4ff, #f6fbff 55%, #ffffff 100%);
}

.hero {
  width: min(100%, 44rem);
  border: 1px solid #dbe8f5;
  border-radius: 16px;
  padding: 1.5rem;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(16, 36, 63, 0.08);
}

h1 {
  margin: 0 0 0.5rem;
  color: #14375f;
}

p {
  margin: 0;
  color: #3b5b7a;
}

.actions {
  margin-top: 1.25rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.action-link,
.logout {
  border: 0;
  border-radius: 10px;
  padding: 0.65rem 1rem;
  background: #1f74d1;
  color: #fff;
  text-decoration: none;
  cursor: pointer;
  font: inherit;
}

.logout {
  background: #9b2240;
}
</style>
