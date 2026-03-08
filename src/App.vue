<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { logout } from '@/services/auth'

const route = useRoute()
const router = useRouter()

const showNavbar = computed(() => route.name !== 'login')
const showChat = computed(() => {
  if (import.meta.env.DEV) {
    return true
  }

  const host = window.location.hostname.toLowerCase()
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
})

async function onLogout() {
  logout()
  await router.push('/login')
}
</script>

<template>
  <div class="app-shell" :class="{ 'has-navbar': showNavbar }">
    <header v-if="showNavbar" class="navbar">
      <RouterLink to="/" class="brand">Vue Test FE</RouterLink>

      <nav class="links">
        <RouterLink to="/" class="link">Home</RouterLink>
        <RouterLink to="/game" class="link">Game</RouterLink>
        <RouterLink to="/game-filter" class="link">Filter Games</RouterLink>
        <RouterLink v-if="showChat" to="/chats" class="link">Chats</RouterLink>
      </nav>

      <button class="logout" @click="onLogout">Logout</button>
    </header>

    <RouterView />
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #1f2937;
}

.app-shell {
  --app-navbar-height: 0px;
  min-height: 100dvh;
}

.app-shell.has-navbar {
  --app-navbar-height: 70px;
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1.1rem;
  border-bottom: 2px solid #35495e;
  background: linear-gradient(90deg, #35495e 0%, #2f4154 50%, #263646 100%);
}

.brand {
  color: #42b883;
  text-decoration: none;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.links {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  justify-self: center;
}

.link {
  color: #e7fff5;
  text-decoration: none;
  padding: 0.45rem 0.7rem;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: 120ms ease;
}

.link:hover {
  border-color: #42b883;
  background: rgba(66, 184, 131, 0.12);
}

.link.router-link-exact-active {
  background: #42b883;
  border-color: #42b883;
  color: #0e1f2a;
  font-weight: 700;
}

.logout {
  justify-self: end;
  border: 1px solid #42b883;
  border-radius: 8px;
  padding: 0.45rem 0.8rem;
  background: transparent;
  color: #e7fff5;
  font: inherit;
  cursor: pointer;
  transition: 120ms ease;
}

.logout:hover {
  background: #42b883;
  color: #0e1f2a;
}

@media (max-width: 640px) {
  .navbar {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .brand,
  .logout,
  .links {
    justify-self: center;
  }
}
</style>
