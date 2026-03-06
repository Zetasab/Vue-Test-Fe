import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'

export interface IncomingChatMessage {
  user: string
  message: string
  room?: string
  createdAt: string
}

const HUB_URL = import.meta.env.VITE_SIGNALR_HUB_URL ?? 'https://localhost:5001/chathub'

const HUB_METHODS = {
  joinRoom: import.meta.env.VITE_SIGNALR_JOIN_METHOD ?? 'JoinRoom',
  sendMessage: import.meta.env.VITE_SIGNALR_SEND_METHOD ?? 'SendMessage',
}

const HUB_EVENTS = {
  receiveMessage: import.meta.env.VITE_SIGNALR_RECEIVE_EVENT ?? 'ReceiveMessage',
}

function normalizeMessage(payload: unknown): IncomingChatMessage {
  if (typeof payload === 'string') {
    return {
      user: 'Server',
      message: payload,
      createdAt: new Date().toISOString(),
    }
  }

  if (payload && typeof payload === 'object') {
    const maybeMessage = payload as Record<string, unknown>

    return {
      user: String(maybeMessage.user ?? maybeMessage.username ?? 'Anon'),
      message: String(maybeMessage.message ?? maybeMessage.text ?? ''),
      room: maybeMessage.room ? String(maybeMessage.room) : undefined,
      createdAt: String(maybeMessage.createdAt ?? new Date().toISOString()),
    }
  }

  return {
    user: 'Server',
    message: 'Unsupported message payload received from hub',
    createdAt: new Date().toISOString(),
  }
}

export class SignalRChatClient {
  private connection: HubConnection

  constructor() {
    this.connection = new HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build()
  }

  get state() {
    return this.connection.state
  }

  async connect(onMessage: (message: IncomingChatMessage) => void) {
    if (this.connection.state === HubConnectionState.Connected) {
      return
    }

    this.connection.off(HUB_EVENTS.receiveMessage)
    this.connection.on(HUB_EVENTS.receiveMessage, (...args: unknown[]) => {
      const [first, second, third] = args

      if (typeof first === 'string' && typeof second === 'string') {
        onMessage({
          user: first,
          message: second,
          room: typeof third === 'string' ? third : undefined,
          createdAt: new Date().toISOString(),
        })
        return
      }

      onMessage(normalizeMessage(first))
    })

    await this.connection.start()
  }

  async joinRoom(room: string) {
    if (this.connection.state !== HubConnectionState.Connected) {
      throw new Error('SignalR connection is not established')
    }

    await this.connection.invoke(HUB_METHODS.joinRoom, room)
  }

  async sendMessage(user: string, message: string, room?: string) {
    if (this.connection.state !== HubConnectionState.Connected) {
      throw new Error('SignalR connection is not established')
    }

    if (room) {
      await this.connection.invoke(HUB_METHODS.sendMessage, room, user, message)
      return
    }

    await this.connection.invoke(HUB_METHODS.sendMessage, user, message)
  }

  async disconnect() {
    if (this.connection.state === HubConnectionState.Disconnected) {
      return
    }

    await this.connection.stop()
  }
}
