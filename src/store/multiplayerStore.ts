// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Multiplayer Store (WebSocket) with Reconnection Support
// ────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'

export type MultiplayerPhase =
  | 'idle'
  | 'creating'
  | 'waiting'
  | 'joining'
  | 'lobby'
  | 'playing'
  | 'reconnecting'
  | 'error'

export interface LobbyPlayer {
  id: string
  name: string
  ready: boolean
  isHost: boolean
  connected?: boolean
}

export interface RoomInfo {
  playerCount: number
  started: boolean
  players: LobbyPlayer[]
  currentPlayerId: string | null
}

interface MultiplayerState {
  phase: MultiplayerPhase
  roomCode: string | null
  myPlayerId: string | null
  myName: string
  isHost: boolean
  roomInfo: RoomInfo | null
  error: string | null
  ws: WebSocket | null
  currentPlayerId: string | null
  sessionToken: string | null
  reconnectAttempts: number
  isReconnecting: boolean

  // Actions
  connect: (name: string, roomCode?: string, playerCount?: number) => void
  sendReady: () => void
  startGame: (gameState: unknown) => void
  sendAction: (action: string, payload: unknown, newGameState?: unknown) => void
  sendEndTurn: (newGameState?: unknown) => void
  syncState: (gameState: unknown) => void
  disconnect: () => void
  setMyName: (name: string) => void
  clearError: () => void
}

// ── Session Persistence ─────────────────────────────────────────────────────
const SESSION_KEY = 'alchemy_session'

interface SavedSession {
  token: string
  roomCode: string
  playerId: string
  playerName: string
  isHost: boolean
}

function saveSession(data: SavedSession) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data))
  } catch {
    // localStorage not available
  }
}

function loadSession(): SavedSession | null {
  try {
    const s = localStorage.getItem(SESSION_KEY)
    return s ? JSON.parse(s) : null
  } catch {
    return null
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // localStorage not available
  }
}

// ── WebSocket URL ───────────────────────────────────────────────────────────
const WS_URL =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'wss://alchemy-ws.wolffbyte.studio'
    : 'ws://localhost:3456'

function send(ws: WebSocket | null, msg: unknown) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

// ── Reconnection Logic ──────────────────────────────────────────────────────
function scheduleReconnect() {
  const state = useMultiplayerStore.getState()
  const attempts = state.reconnectAttempts
  const delay = Math.min(1000 * Math.pow(2, attempts), 30000)

  setTimeout(() => {
    const session = loadSession()
    if (!session) {
      // Can't reconnect without session
      useMultiplayerStore.setState({
        isReconnecting: false,
        phase: 'idle',
        error: 'Session expired. Please rejoin.',
      })
      return
    }

    // Create a new WS and try to reconnect
    const ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'reconnect',
        token: session.token,
        roomCode: session.roomCode,
      }))
    }

    ws.onmessage = (event) => {
      let msg: Record<string, unknown>
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }

      handleMessage(msg, ws, session.playerName)
    }

    ws.onerror = () => {
      useMultiplayerStore.setState((prev) => ({
        reconnectAttempts: prev.reconnectAttempts + 1,
      }))
      scheduleReconnect()
    }

    ws.onclose = () => {
      const currentState = useMultiplayerStore.getState()
      if (currentState.isReconnecting && currentState.phase === 'reconnecting') {
        useMultiplayerStore.setState((prev) => ({
          reconnectAttempts: prev.reconnectAttempts + 1,
        }))
        scheduleReconnect()
      }
    }

    useMultiplayerStore.setState({ ws })
  }, delay)
}

// ── Message Handler ─────────────────────────────────────────────────────────
function handleMessage(msg: Record<string, unknown>, ws: WebSocket, name: string) {
  switch (msg.type) {
    case 'room_created':
      saveSession({
        token: msg.token as string,
        roomCode: msg.roomCode as string,
        playerId: msg.playerId as string,
        playerName: name,
        isHost: true,
      })
      useMultiplayerStore.setState({
        phase: 'lobby',
        roomCode: msg.roomCode as string,
        myPlayerId: msg.playerId as string,
        isHost: true,
        roomInfo: msg.roomInfo as RoomInfo,
        sessionToken: msg.token as string,
        ws,
      })
      break

    case 'room_joined':
      saveSession({
        token: msg.token as string,
        roomCode: msg.roomCode as string,
        playerId: msg.playerId as string,
        playerName: name,
        isHost: false,
      })
      useMultiplayerStore.setState({
        phase: 'lobby',
        roomCode: msg.roomCode as string,
        myPlayerId: msg.playerId as string,
        isHost: false,
        roomInfo: msg.roomInfo as RoomInfo,
        sessionToken: msg.token as string,
        ws,
      })
      break

    case 'reconnected':
      useMultiplayerStore.setState({
        phase: (msg.roomInfo as RoomInfo)?.started ? 'playing' : 'lobby',
        roomCode: msg.roomCode as string,
        myPlayerId: msg.playerId as string,
        isHost: msg.isHost as boolean,
        roomInfo: msg.roomInfo as RoomInfo,
        currentPlayerId: msg.currentPlayerId as string | null,
        isReconnecting: false,
        reconnectAttempts: 0,
        error: null,
        ws,
      })
      if (msg.gameState) {
        window.dispatchEvent(
          new CustomEvent('alchemy:state_sync', {
            detail: { gameState: msg.gameState },
          })
        )
      }
      break

    case 'player_joined':
    case 'player_ready':
      useMultiplayerStore.setState({ roomInfo: msg.roomInfo as RoomInfo })
      break

    case 'player_left':
      useMultiplayerStore.setState({ roomInfo: msg.roomInfo as RoomInfo })
      break

    case 'player_disconnected':
      useMultiplayerStore.setState({ roomInfo: msg.roomInfo as RoomInfo })
      window.dispatchEvent(
        new CustomEvent('alchemy:player_disconnected', { detail: msg })
      )
      break

    case 'player_reconnected':
      useMultiplayerStore.setState({ roomInfo: msg.roomInfo as RoomInfo })
      window.dispatchEvent(
        new CustomEvent('alchemy:player_reconnected', { detail: msg })
      )
      break

    case 'all_ready':
      useMultiplayerStore.setState({ roomInfo: msg.roomInfo as RoomInfo })
      break

    case 'game_started':
      useMultiplayerStore.setState({
        phase: 'playing',
        currentPlayerId: msg.currentPlayerId as string,
      })
      // The game state is handled by the game store via event
      window.dispatchEvent(new CustomEvent('alchemy:game_started', { detail: msg }))
      break

    case 'game_action':
      window.dispatchEvent(new CustomEvent('alchemy:game_action', { detail: msg }))
      break

    case 'turn_changed':
      useMultiplayerStore.setState({ currentPlayerId: msg.currentPlayerId as string })
      window.dispatchEvent(new CustomEvent('alchemy:turn_changed', { detail: msg }))
      break

    case 'state_sync':
      window.dispatchEvent(new CustomEvent('alchemy:state_sync', { detail: msg }))
      break

    case 'error':
      if (useMultiplayerStore.getState().isReconnecting) {
        // Reconnect failed — clear session and stop
        clearSession()
        useMultiplayerStore.setState({
          error: msg.message as string,
          isReconnecting: false,
          phase: 'error',
        })
      } else {
        useMultiplayerStore.setState({ error: msg.message as string })
      }
      break

    case 'pong':
      break
  }
}

// ── Store ───────────────────────────────────────────────────────────────────
export const useMultiplayerStore = create<MultiplayerState>((set, get) => ({
  phase: 'idle',
  roomCode: null,
  myPlayerId: null,
  myName: '',
  isHost: false,
  roomInfo: null,
  error: null,
  ws: null,
  currentPlayerId: null,
  sessionToken: null,
  reconnectAttempts: 0,
  isReconnecting: false,

  setMyName: (name) => set({ myName: name }),
  clearError: () => set({ error: null }),

  connect: (name, roomCode, playerCount) => {
    const state = get()
    if (state.ws) {
      state.ws.close()
    }

    set({ phase: roomCode ? 'joining' : 'creating', error: null, myName: name })

    const ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      if (roomCode) {
        // Join existing room
        send(ws, { type: 'join_room', roomCode, playerName: name })
      } else {
        // Create new room
        send(ws, { type: 'create_room', playerName: name, playerCount: playerCount ?? 2 })
      }
    }

    ws.onmessage = (event) => {
      let msg: Record<string, unknown>
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }

      handleMessage(msg, ws, name)
    }

    ws.onerror = () => {
      set({ error: 'Connection failed. Make sure the server is running.', phase: 'error' })
    }

    ws.onclose = () => {
      const s = get()
      if (s.phase === 'playing' || s.phase === 'lobby') {
        set({ isReconnecting: true, phase: 'reconnecting' })
        scheduleReconnect()
      }
    }

    set({ ws })
  },

  sendReady: () => {
    const { ws } = get()
    send(ws, { type: 'ready' })
  },

  startGame: (gameState) => {
    const { ws } = get()
    send(ws, { type: 'start_game', gameState })
  },

  sendAction: (action, payload, newGameState) => {
    const { ws } = get()
    send(ws, { type: 'game_action', action, payload, newGameState })
  },

  sendEndTurn: (newGameState) => {
    const { ws } = get()
    send(ws, { type: 'end_turn', newGameState })
  },

  syncState: (gameState) => {
    const { ws } = get()
    send(ws, { type: 'sync_state', gameState })
  },

  disconnect: () => {
    const { ws } = get()
    clearSession()
    if (ws) ws.close()
    set({
      phase: 'idle',
      roomCode: null,
      myPlayerId: null,
      isHost: false,
      roomInfo: null,
      ws: null,
      currentPlayerId: null,
      error: null,
      sessionToken: null,
      reconnectAttempts: 0,
      isReconnecting: false,
    })
  },
}))

// ── Session Restore on Load ─────────────────────────────────────────────────
export function attemptSessionRestore(): boolean {
  const session = loadSession()
  if (!session) return false

  useMultiplayerStore.setState({
    isReconnecting: true,
    myName: session.playerName,
    phase: 'reconnecting',
    roomCode: session.roomCode,
    myPlayerId: session.playerId,
    isHost: session.isHost,
    sessionToken: session.token,
  })

  scheduleReconnect()
  return true
}
