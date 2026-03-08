import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'

import { getSessionToken } from '@/services/auth'

export interface IncomingChatMessageEvent {
  senderUserId: string
  senderUsername?: string
  receiverUserId: string
  message: string
  sentUtc: string
}

function buildHubUrl(): string {
  const base = (
    import.meta.env.VITE_SIGNALR_HUB_URL
    ?? `${import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7116'}/hubs/chat`
  ).trim()

  return base.replace(/\/+$/, '')
}

const HUB_URL = buildHubUrl()

const HUB_METHODS = {
  sendMessage: import.meta.env.VITE_SIGNALR_SEND_METHOD ?? 'SendMessage',
}

const HUB_EVENTS = {
  receiveMessage: import.meta.env.VITE_SIGNALR_RECEIVE_EVENT ?? 'ReceiveMessage',
}

function formatErrorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const ownProps = Object.getOwnPropertyNames(error).reduce<Record<string, unknown>>(
      (acc, key) => {
        acc[key] = (error as unknown as Record<string, unknown>)[key]
        return acc
      },
      {},
    )

    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: (error as Error & { cause?: unknown }).cause,
      ownProps,
    }
  }

  if (error && typeof error === 'object') {
    return error as Record<string, unknown>
  }

  return {
    value: error,
  }
}

function normalizeMessage(payload: unknown): IncomingChatMessageEvent {
  const fallback: IncomingChatMessageEvent = {
    senderUserId: 'unknown',
    receiverUserId: 'unknown',
    message: '',
    sentUtc: new Date().toISOString(),
  }

  if (typeof payload === 'string') {
    return {
      ...fallback,
      senderUserId: 'server',
      message: payload,
    }
  }

  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>

    return {
      senderUserId: String(p.senderUserId ?? p.userId ?? p.user ?? 'unknown'),
      senderUsername:
        typeof p.senderUsername === 'string' && p.senderUsername.trim()
          ? p.senderUsername
          : undefined,
      receiverUserId: String(p.receiverUserId ?? p.receiver ?? 'unknown'),
      message: String(p.message ?? p.text ?? ''),
      sentUtc: String(p.sentUtc ?? p.createdAt ?? new Date().toISOString()),
    }
  }

  return {
    ...fallback,
    senderUserId: 'server',
    message: 'Unsupported message payload received from hub',
  }
}

export class SignalRChatClient {
  private connection: HubConnection

  constructor() {
    this.connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => getSessionToken(),
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build()
  }

  get state() {
    return this.connection.state
  }

  async connect(onMessage: (message: IncomingChatMessageEvent) => void) {
    if (this.connection.state === HubConnectionState.Connected) {
      return
    }

    this.connection.off(HUB_EVENTS.receiveMessage)
    this.connection.on(HUB_EVENTS.receiveMessage, (...args: unknown[]) => {
      const [first, second, third] = args

      if (
        typeof first === 'string'
        && typeof second === 'string'
        && typeof third === 'string'
      ) {
        onMessage({
          senderUserId: first,
          receiverUserId: second,
          message: third,
          sentUtc: new Date().toISOString(),
        })
        return
      }

      if (typeof first === 'string' && typeof second === 'string') {
        onMessage({
          senderUserId: first,
          receiverUserId: 'unknown',
          message: second,
          sentUtc: new Date().toISOString(),
        })
        return
      }

      onMessage(normalizeMessage(first))
    })

    await this.connection.start()
  }

  async sendMessage(receiverUserId: string, message: string) {
    if (this.connection.state !== HubConnectionState.Connected) {
      throw new Error('SignalR connection is not established')
    }

    const cleanReceiverUserId = receiverUserId.trim()
    const cleanMessage = message.trim()

    if (!cleanReceiverUserId) {
      throw new Error('receiverUserId is required')
    }

    if (!cleanMessage) {
      throw new Error('message is required')
    }

    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!guidRegex.test(cleanReceiverUserId)) {
      throw new Error(`receiverUserId is not a valid GUID: ${cleanReceiverUserId}`)
    }

    const payload = {
      receiverUserId: cleanReceiverUserId,
      message: cleanMessage,
    }

    try {
      await this.connection.invoke(HUB_METHODS.sendMessage, payload)
    } catch (error) {
      const details = {
        hubUrl: HUB_URL,
        method: HUB_METHODS.sendMessage,
        signature: 'SendMessage({ receiverUserId, message })',
        payload,
        error: formatErrorDetails(error),
      }

      console.error('[SignalR] SendMessage payload invoke failed', details)

      const invokeError = new Error(
        `SignalR SendMessage failed for object payload. Details: ${JSON.stringify(details)}`,
      )
      ;(invokeError as Error & { details?: unknown }).details = details
      throw invokeError
    }
  }

  async disconnect() {
    if (this.connection.state === HubConnectionState.Disconnected) {
      return
    }

    await this.connection.stop()
  }
}
