// ────────────────────────────────────────────────────────────────────────────
// Alchemy — WebSocket Relay Server
// Real-time multiplayer room management
// ────────────────────────────────────────────────────────────────────────────

const { WebSocketServer } = require('ws')
const PORT = process.env.PORT || 3456

// rooms: roomCode → { players: Map<ws, playerInfo>, playerCount: number, started: boolean, turnIndex: number, playerOrder: string[] }
const rooms = new Map()

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function broadcast(room, message, excludeWs = null) {
  for (const [ws] of room.players) {
    if (ws !== excludeWs && ws.readyState === 1 /* OPEN */) {
      ws.send(JSON.stringify(message))
    }
  }
}

function broadcastAll(room, message) {
  for (const [ws] of room.players) {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(message))
    }
  }
}

function getRoomInfo(room) {
  const players = []
  for (const [, info] of room.players) {
    players.push({ id: info.id, name: info.name, ready: info.ready, isHost: info.isHost })
  }
  return {
    playerCount: room.playerCount,
    started: room.started,
    players,
    currentPlayerId: room.started ? room.playerOrder[room.turnIndex] : null,
  }
}

const wss = new WebSocketServer({ port: PORT })

wss.on('connection', (ws) => {
  let currentRoomCode = null
  let playerId = null

  ws.on('message', (data) => {
    let msg
    try {
      msg = JSON.parse(data)
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
      return
    }

    switch (msg.type) {
      case 'create_room': {
        // msg: { playerName, playerCount }
        const roomCode = generateRoomCode()
        playerId = `player-${Date.now()}-${Math.random().toString(36).slice(2)}`
        const playerInfo = {
          id: playerId,
          name: msg.playerName || 'Host',
          ready: false,
          isHost: true,
          ws,
        }
        const room = {
          players: new Map([[ws, playerInfo]]),
          playerCount: msg.playerCount || 2,
          started: false,
          turnIndex: 0,
          playerOrder: [],
          gameState: null,
        }
        rooms.set(roomCode, room)
        currentRoomCode = roomCode

        ws.send(JSON.stringify({
          type: 'room_created',
          roomCode,
          playerId,
          isHost: true,
          roomInfo: getRoomInfo(room),
        }))
        console.log(`[${roomCode}] Created by ${playerInfo.name}`)
        break
      }

      case 'join_room': {
        // msg: { roomCode, playerName }
        const room = rooms.get(msg.roomCode)
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }))
          return
        }
        if (room.started) {
          ws.send(JSON.stringify({ type: 'error', message: 'Game already started' }))
          return
        }
        if (room.players.size >= room.playerCount) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }))
          return
        }

        // Handle reconnection: same name re-joining
        let existingEntry = null
        for (const [existWs, info] of room.players) {
          if (info.name === msg.playerName) {
            existingEntry = [existWs, info]
            break
          }
        }

        if (existingEntry) {
          // Reconnect: replace old ws
          const [oldWs, info] = existingEntry
          room.players.delete(oldWs)
          info.ws = ws
          playerId = info.id
          room.players.set(ws, info)
        } else {
          playerId = `player-${Date.now()}-${Math.random().toString(36).slice(2)}`
          room.players.set(ws, {
            id: playerId,
            name: msg.playerName || `Player ${room.players.size + 1}`,
            ready: false,
            isHost: false,
            ws,
          })
        }

        currentRoomCode = msg.roomCode

        ws.send(JSON.stringify({
          type: 'room_joined',
          roomCode: msg.roomCode,
          playerId,
          isHost: false,
          roomInfo: getRoomInfo(room),
        }))

        // Notify others
        broadcast(room, {
          type: 'player_joined',
          roomInfo: getRoomInfo(room),
        }, ws)

        console.log(`[${msg.roomCode}] ${msg.playerName} joined (${room.players.size}/${room.playerCount})`)
        break
      }

      case 'ready': {
        // msg: { roomCode }
        if (!currentRoomCode) return
        const room = rooms.get(currentRoomCode)
        if (!room) return
        const info = room.players.get(ws)
        if (!info) return
        info.ready = true

        broadcastAll(room, {
          type: 'player_ready',
          playerId: info.id,
          roomInfo: getRoomInfo(room),
        })

        // Check if all ready and host can start
        const allReady = [...room.players.values()].every(p => p.ready)
        const atCapacity = room.players.size >= room.playerCount
        if (allReady && atCapacity) {
          broadcastAll(room, { type: 'all_ready', roomInfo: getRoomInfo(room) })
        }
        break
      }

      case 'start_game': {
        // msg: { roomCode, gameState } — host sends initial game state
        if (!currentRoomCode) return
        const room = rooms.get(currentRoomCode)
        if (!room) return
        const info = room.players.get(ws)
        if (!info || !info.isHost) {
          ws.send(JSON.stringify({ type: 'error', message: 'Only host can start' }))
          return
        }

        room.started = true
        room.gameState = msg.gameState
        // Build player order from the joined order
        room.playerOrder = [...room.players.values()].map(p => p.id)
        room.turnIndex = 0

        broadcastAll(room, {
          type: 'game_started',
          gameState: msg.gameState,
          playerOrder: room.playerOrder,
          currentPlayerId: room.playerOrder[0],
        })
        console.log(`[${currentRoomCode}] Game started with ${room.players.size} players`)
        break
      }

      case 'game_action': {
        // msg: { action, payload }
        // Relay to all players; server tracks turn order
        if (!currentRoomCode) return
        const room = rooms.get(currentRoomCode)
        if (!room || !room.started) return
        const info = room.players.get(ws)
        if (!info) return

        // Validate it's this player's turn
        const currentExpectedId = room.playerOrder[room.turnIndex]
        if (info.id !== currentExpectedId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' }))
          return
        }

        // Relay action to everyone (including sender for confirmation)
        broadcastAll(room, {
          type: 'game_action',
          action: msg.action,
          payload: msg.payload,
          fromPlayerId: info.id,
        })

        // Update server-side game state if provided
        if (msg.newGameState) {
          room.gameState = msg.newGameState
        }

        break
      }

      case 'end_turn': {
        if (!currentRoomCode) return
        const room = rooms.get(currentRoomCode)
        if (!room || !room.started) return
        const info = room.players.get(ws)
        if (!info) return

        if (info.id !== room.playerOrder[room.turnIndex]) {
          ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' }))
          return
        }

        room.turnIndex = (room.turnIndex + 1) % room.playerOrder.length
        const nextPlayerId = room.playerOrder[room.turnIndex]

        // Update game state if provided
        if (msg.newGameState) {
          room.gameState = msg.newGameState
        }

        broadcastAll(room, {
          type: 'turn_changed',
          currentPlayerId: nextPlayerId,
          gameState: msg.newGameState || room.gameState,
        })
        break
      }

      case 'sync_state': {
        // Host broadcasts full game state (after any action)
        if (!currentRoomCode) return
        const room = rooms.get(currentRoomCode)
        if (!room) return
        const info = room.players.get(ws)
        if (!info) return

        room.gameState = msg.gameState
        broadcast(room, {
          type: 'state_sync',
          gameState: msg.gameState,
        }, ws)
        break
      }

      case 'ping': {
        ws.send(JSON.stringify({ type: 'pong' }))
        break
      }

      default:
        ws.send(JSON.stringify({ type: 'error', message: `Unknown type: ${msg.type}` }))
    }
  })

  ws.on('close', () => {
    if (!currentRoomCode) return
    const room = rooms.get(currentRoomCode)
    if (!room) return

    const info = room.players.get(ws)
    room.players.delete(ws)

    if (info) {
      console.log(`[${currentRoomCode}] ${info.name} disconnected`)
      broadcast(room, {
        type: 'player_left',
        playerId: info.id,
        playerName: info.name,
        roomInfo: getRoomInfo(room),
      })
    }

    // Clean up empty rooms
    if (room.players.size === 0) {
      rooms.delete(currentRoomCode)
      console.log(`[${currentRoomCode}] Room cleaned up`)
    }
  })

  ws.on('error', (err) => {
    console.error('WS error:', err.message)
  })
})

console.log(`🧪 Alchemy WS server running on :${PORT}`)
