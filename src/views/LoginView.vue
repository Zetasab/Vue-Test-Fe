<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import Button from 'primevue/button'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'

import {
  clearSavedCredentials,
  isLoggedIn,
  loadSavedCredentials,
  login,
  saveCredentials,
} from '@/services/auth'

const router = useRouter()
const route = useRoute()

const saved = loadSavedCredentials()
const username = ref(saved.username)
const userPassword = ref(saved.password)
const remember = ref(!!saved.username && !!saved.password)
const loading = ref(false)
const error = ref('')

const targetPath = computed(() => {
  const redirectQuery = route.query.redirect
  return typeof redirectQuery === 'string' && redirectQuery ? redirectQuery : '/'
})

if (isLoggedIn()) {
  router.replace(targetPath.value)
}

async function onSubmit() {
  loading.value = true
  error.value = ''

  try {
    const success = login(username.value, userPassword.value)

    if (!success) {
      error.value = 'Credenciales invalidas. Usa admin / password.'
      return
    }

    if (remember.value) {
      saveCredentials(username.value, userPassword.value)
    } else {
      clearSavedCredentials()
    }

    await router.replace(targetPath.value)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <Card class="login-card">
      <template #title>
        Iniciar sesion
      </template>

      <template #subtitle>
        Acceso al chat
      </template>

      <template #content>
        <form class="login-form" @submit.prevent="onSubmit">
          <label for="username">Usuario</label>
          <InputText id="username" v-model="username" autocomplete="username" placeholder="admin" />

          <label for="password">Contrasena</label>
          <Password
            id="password"
            v-model="userPassword"
            :feedback="false"
            toggle-mask
            autocomplete="current-password"
            placeholder="password"
          />

          <div class="remember-row">
            <Checkbox id="remember" v-model="remember" binary />
            <label for="remember">Guardar usuario y contrasena en localStorage</label>
          </div>

          <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

          <Button type="submit" label="Entrar" :loading="loading" />
        </form>
      </template>
    </Card>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background: radial-gradient(circle at top left, #d9eeff, #f7fafc 50%, #ffffff 100%);
}

.login-card {
  width: min(100%, 26rem);
}

.login-form {
  display: grid;
  gap: 0.85rem;
}

.remember-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.92rem;
}
</style>
