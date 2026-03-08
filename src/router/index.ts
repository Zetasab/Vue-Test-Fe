import { createRouter, createWebHistory } from 'vue-router'
import ChatsView from '@/views/ChatsView.vue'
import FilterGamesView from '@/views/FilterGamesView.vue'
import GameView from '@/views/GameView.vue'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'

import { isLoggedIn } from '@/services/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/game',
      name: 'game',
      component: GameView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/game-filter',
      name: 'game-filter',
      component: FilterGamesView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/chats',
      name: 'chats',
      component: ChatsView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
  ],
})

router.beforeEach((to) => {
  if (to.name === 'login' && isLoggedIn()) {
    return {
      path: '/',
    }
  }

  if (to.meta.requiresAuth && !isLoggedIn()) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  return true
})

export default router
