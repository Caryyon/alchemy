// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Multiplayer Store (WebSocket)
// ────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'

export type MultiplayerPhase =
  | 'idle'
  | 'creating'
  | 'waiting'
  | 'joining'
  | 'lobby'
  | 'playing'
  | 'error'

export interface LobbyPlayer {
  id: string
  name: string
  ready: boolean
  isHost: boolean
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

const WS_URL =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'wss://alchemy-ws.wolffbyte.studio'
    : 'ws://localhost:3456'

function send(ws: WebSocket | null, msg: unknown) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

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

      switch (msg.type) {
        case 'room_created':
          set({
            phase: 'lobby',
            roomCode: msg.roomCode as string,
            myPlayerId: msg.playerId as string,
            isHost: true,
            roomInfo: msg.roomInfo as RoomInfo,
          })
          break

        case 'room_joined':
          set({
            phase: 'lobby',
            roomCode: msg.roomCode as string,
            myPlayerId: msg.playerId as string,
            isHost: false,
            roomInfo: msg.roomInfo as RoomInfo,
          })
          break

        case 'player_joined':
        case 'player_ready':
          set({ roomInfo: msg.roomInfo as RoomInfo })
          break

        case 'player_left': {
          const ri = msg.roomInfo as RoomInfo
          set({ roomInfo: ri })
          break
        }

        case 'all_ready':
          set({ roomInfo: msg.roomInfo as RoomInfo })
          break

        case 'game_started':
          set({
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
          set({ currentPlayerId: msg.currentPlayerId as string })
          window.dispatchEvent(new CustomEvent('alchemy:turn_changed', { detail: msg }))
          break

        case 'state_sync':
          window.dispatchEvent(new CustomEvent('alchemy:state_sync', { detail: msg }))
          break

        case 'error':
          set({ error: msg.message as string })
          break

        case 'pong':
          break
      }
    }

    ws.onerror = () => {
      set({ error: 'Connection failed. Make sure the server is running.', phase: 'error' })
    }

    ws.onclose = () => {
      const s = get()
      if (s.phase === 'playing') {
        set({ error: 'Disconnected from server.' })
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
    })
  },
}))
