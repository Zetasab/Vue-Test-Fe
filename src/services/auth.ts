import { getApiErrorStatus, post } from './baseService'
import { getInfo } from './info'

export const AUTH_SESSION_KEY = 'auth.session'
export const AUTH_SAVED_CREDENTIALS_KEY = 'auth.savedCredentials'

const AUTH_LOGIN_ENDPOINT = import.meta.env.VITE_AUTH_LOGIN_ENDPOINT ?? '/users/users/login'

export interface AuthSession {
  username: string
  loggedAt: string
  token?: string
}

export interface SavedCredentials {
  username: string
  password: string
}

export interface UserLogin {
  username: string
  password: string
}

export interface UserResponse {
  username?: string
  token?: string
  [key: string]: unknown
}

export function isLoggedIn(): boolean {
  const raw = sessionStorage.getItem(AUTH_SESSION_KEY)
  if (!raw) {
    return false
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>
    return !!parsed.username
  } catch {
    return false
  }
}

export function getSessionUser(): string {
  const raw = sessionStorage.getItem(AUTH_SESSION_KEY)
  if (!raw) {
    return ''
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>
    return parsed.username ?? ''
  } catch {
    return ''
  }
}

export function getSessionToken(): string {
  const raw = sessionStorage.getItem(AUTH_SESSION_KEY)
  if (!raw) {
    return ''
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>
    return typeof parsed.token === 'string' ? parsed.token.trim() : ''
  } catch {
    return ''
  }
}

export async function login(username: string, password: string): Promise<boolean> {
  const payload: UserLogin = {
    username: username.trim(),
    password,
  }

  if (!payload.username || !payload.password) {
    return false
  }

  // Required request chain: first GET /info, then POST login.
  await getInfo()

  try {
    const response = await post<UserResponse, UserLogin>(AUTH_LOGIN_ENDPOINT, payload)

    const session: AuthSession = {
      username:
        typeof response.username === 'string' && response.username.trim()
          ? response.username
          : payload.username,
      loggedAt: new Date().toISOString(),
      token: typeof response.token === 'string' ? response.token : undefined,
    }

    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
    return true
  } catch (error) {
    if (getApiErrorStatus(error) === 401) {
      return false
    }

    throw error
  }
}

export function logout(): void {
  sessionStorage.removeItem(AUTH_SESSION_KEY)
}

export function loadSavedCredentials(): SavedCredentials {
  const raw = localStorage.getItem(AUTH_SAVED_CREDENTIALS_KEY)
  if (!raw) {
    return {
      username: '',
      password: '',
    }
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SavedCredentials>
    return {
      username: parsed.username ?? '',
      password: parsed.password ?? '',
    }
  } catch {
    return {
      username: '',
      password: '',
    }
  }
}

export function saveCredentials(username: string, password: string): void {
  const payload: SavedCredentials = {
    username: username.trim(),
    password,
  }

  localStorage.setItem(AUTH_SAVED_CREDENTIALS_KEY, JSON.stringify(payload))
}

export function clearSavedCredentials(): void {
  localStorage.removeItem(AUTH_SAVED_CREDENTIALS_KEY)
}
