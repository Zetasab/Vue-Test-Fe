const DEFAULT_DEV_API_BASE_URL = 'https://localhost:7116'
const DEFAULT_PROD_API_BASE_URL = 'https://zetatestapi-test-production.up.railway.app'
const AUTH_SESSION_KEY = 'auth.session'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL
  ?? (import.meta.env.DEV ? DEFAULT_DEV_API_BASE_URL : DEFAULT_PROD_API_BASE_URL)
).replace(/\/+$/, '')

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, body: unknown, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

function logoutOnUnauthorized() {
  sessionStorage.removeItem(AUTH_SESSION_KEY)

  if (typeof window === 'undefined') {
    return
  }

  const isLoginRoute = window.location.pathname === '/login'
  if (isLoginRoute) {
    return
  }

  const redirectTo = `${window.location.pathname}${window.location.search}`
  const target = `/login?redirect=${encodeURIComponent(redirectTo)}`
  window.location.assign(target)
}

function getAuthTokenFromSession(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  const raw = sessionStorage.getItem(AUTH_SESSION_KEY)
  if (!raw) {
    return ''
  }

  try {
    const parsed = JSON.parse(raw) as { token?: unknown }
    return typeof parsed.token === 'string' ? parsed.token.trim() : ''
  } catch {
    return ''
  }
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''

  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  try {
    const text = await response.text()
    return text || null
  } catch {
    return null
  }
}

function toApiErrorMessage(status: number, body: unknown): string {
  if (typeof body === 'string' && body.trim()) {
    return body
  }

  if (body && typeof body === 'object') {
    const maybeBody = body as Record<string, unknown>
    if (typeof maybeBody.message === 'string' && maybeBody.message.trim()) {
      return maybeBody.message
    }

    if (typeof maybeBody.title === 'string' && maybeBody.title.trim()) {
      return maybeBody.title
    }
  }

  return `Request failed with status ${status}`
}

async function request<TResponse>(
  method: string,
  path: string,
  body?: unknown,
  init?: Omit<RequestInit, 'method' | 'body'>,
): Promise<TResponse> {
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')

  const token = getAuthTokenFromSession()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const hasBody = body !== undefined
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const url = buildUrl(path)
  console.log(`[API] ${method} ${url}`)

  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    console.error(`[API] ${method} ${url} failed before receiving a response.`, error)
    throw error
  }

  const parsedBody = await parseBody(response)

  if (response.status !== 200) {
    console.warn(`[API] ${method} ${url} responded with status ${response.status}.`, parsedBody)
  }

  if (!response.ok) {
    if (response.status === 401) {
      logoutOnUnauthorized()
    }

    throw new ApiError(response.status, parsedBody, toApiErrorMessage(response.status, parsedBody))
  }

  return parsedBody as TResponse
}

export function getApiErrorStatus(error: unknown): number | null {
  if (error instanceof ApiError) {
    return error.status
  }

  return null
}

export function get<TResponse>(path: string, init?: Omit<RequestInit, 'method'>) {
  return request<TResponse>('GET', path, undefined, init)
}

export function post<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  init?: Omit<RequestInit, 'method' | 'body'>,
) {
  return request<TResponse>('POST', path, body, init)
}

export function put<TResponse = void, TBody = unknown>(
  path: string,
  body: TBody,
  init?: Omit<RequestInit, 'method' | 'body'>,
) {
  return request<TResponse>('PUT', path, body, init)
}

export function del<TResponse = void>(
  path: string,
  init?: Omit<RequestInit, 'method' | 'body'>,
) {
  return request<TResponse>('DELETE', path, undefined, init)
}
