# Vue-Test-Fe

> Proyecto de prueba para aprender Vue 3 + TypeScript.
>
> Este repositorio **no representa** la forma en que trabajo profesionalmente en produccion.
> Es un sandbox para practicar arquitectura frontend, consumo de APIs y chat en tiempo real con SignalR.

---

## Que es este proyecto

`Vue-Test-Fe` es una app frontend hecha con:

- `Vue 3` + `Vite`
- `TypeScript`
- `Vue Router`
- `Pinia`
- `PrimeVue` (tema `Aura`)
- `SignalR` para chat en tiempo real

La idea principal es practicar:

- Autenticacion simple en frontend
- Consumo de endpoints REST
- Rutas protegidas
- Estructura por modulos (`models`, `services`, `views`)
- Integracion de chat en tiempo real

---

## Como funciona (resumen rapido)

1. El usuario entra por `/login`.
2. Si el login es correcto, se guarda una sesion en `sessionStorage` (`auth.session`).
3. El router protege vistas con `meta.requiresAuth`.
4. Los servicios en `src/services` consumen la API con `fetch` centralizado en `baseService.ts`.
5. Si una llamada responde `401`, se limpia sesion y se redirige a `/login`.
6. El modulo de chat usa SignalR y envia token con `accessTokenFactory`.

---

## Mapa del proyecto

```text
src/
  models/        # Tipos y modelos de dominio (games, users, base)
  services/      # Capa de acceso a API, auth y SignalR
  stores/        # Estado global con Pinia
  router/        # Rutas y guards de autenticacion
  views/         # Pantallas (login, game, chats, filtros)
  App.vue        # Shell principal
  main.ts        # Bootstrap de Vue + plugins
```

---

## Rutas principales

- `/login`: acceso de usuario
- `/`: home (protegida)
- `/game`: vista de juego (protegida)
- `/game-filter`: filtro de juegos (protegida)
- `/chats`: chat (protegida, habilitada en local/dev)

Nota: la ruta `/chats` solo se habilita en `DEV` o en `localhost/127.0.0.1/::1`.

---

## Variables de entorno

Configura un archivo `.env` (puedes usar `.env.example` como base):

```env
VITE_API_BASE_URL=https://localhost:7116
VITE_AUTH_LOGIN_ENDPOINT=/users/users/login

VITE_SIGNALR_HUB_URL=https://localhost:7116/hubs/chat
VITE_SIGNALR_SEND_METHOD=SendMessage
VITE_SIGNALR_RECEIVE_EVENT=ReceiveMessage
```

Notas:

- Si `VITE_API_BASE_URL` no existe, se usa fallback segun entorno (dev/prod).
- Si no defines variables de SignalR, se usan valores por defecto.

---

## Requisitos

- `Node.js` `^20.19.0` o `>=22.12.0`
- `npm`

---

## Scripts

```bash
npm install        # Instala dependencias
npm run dev        # Levanta entorno local con Vite
npm run build      # Type-check + build de produccion
npm run preview    # Sirve build local para revisar
npm run lint       # Ejecuta oxlint + eslint con fix
npm run format     # Formatea src/ con Prettier
```

---

## Setup recomendado

- IDE: [VS Code](https://code.visualstudio.com/)
- Extension: [Vue (Official) / Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- Devtools: [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)

---

## Objetivo de aprendizaje

Este repo existe para experimentar y aprender:

- Probar ideas rapido
- Validar integraciones con backend
- Practicar patrones de frontend en Vue

Si encuentras decisiones de codigo "simples" o "de prueba", es intencional por el contexto del proyecto.
