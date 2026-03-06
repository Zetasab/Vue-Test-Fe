/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_SIGNALR_HUB_URL?: string
	readonly VITE_SIGNALR_JOIN_METHOD?: string
	readonly VITE_SIGNALR_SEND_METHOD?: string
	readonly VITE_SIGNALR_RECEIVE_EVENT?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
