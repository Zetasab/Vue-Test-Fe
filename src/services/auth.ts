export const AUTH_SESSION_KEY = 'auth.session'
export const AUTH_SAVED_CREDENTIALS_KEY = 'auth.savedCredentials'

export interface AuthSession {
  username: string
  loggedAt: string
}

export interface SavedCredentials {
  username: string
  password: string
}

const DEFAULT_USER = 'admin'
const DEFAULT_PASSWORD = 'password'

export function isLoggedIn(): boolean {
  const raw = sessionStorage.getItem(AUTH_SESSION_KEY)
  if (!raw) {
    return false
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>
    return parsed.username === DEFAULT_USER
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

export function login(username: string, password: string): boolean {
  const cleanUser = username.trim()

  if (cleanUser !== DEFAULT_USER || password !== DEFAULT_PASSWORD) {
    return false
  }

  const session: AuthSession = {
    username: cleanUser,
    loggedAt: new Date().toISOString(),
  }

  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
  return true
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
