// ────────────────────────────────────────────────────────────────────────────
// Alchemy — WebSocket Relay Server
// Real-time multiplayer room management with persistence
// ────────────────────────────────────────────────────────────────────────────

const { WebSocketServer } = require('ws')
const fs = require('fs')
const PORT = process.env.PORT || 3456

// ── Data Directory Setup ────────────────────────────────────────────────────
const DATA_DIR = './data'
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR)

const ROOMS_FILE = DATA_DIR + '/rooms.json'
const SESSIONS_FILE = DATA_DIR + '/sessions.json'

// ── UUID Generator (no deps) ────────────────────────────────────────────────
function generateToken() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// rooms: roomCode → { players: Map<ws|string, playerInfo>, playerCount, started, turnIndex, playerOrder, gameState }
const rooms = new Map()

// sessions: token → { roomCode, playerId, playerName, isHost }
const sessions = new Map()

// ── Persistence Functions ───────────────────────────────────────────────────
function persistRooms() {
  const serializable = {}
  for (const [code, room] of rooms) {
    const playersArray = []
    for (const [key, info] of room.players) {
      playersArray.push({
        id: info.id,
        name: info.name,
        ready: info.ready,
        isHost: info.isHost,
        token: info.token,
        connected: info.connected,
      })
    }
    serializable[code] = {
      playerCount: room.playerCount,
      started: room.started,
      turnIndex: room.turnIndex,
      playerOrder: room.playerOrder,
      gameState: room.gameState,
      players: playersArray,
    }
  }
  try {
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(serializable, null, 2))
  } catch (e) {
    console.error('Failed to persist rooms:', e.message)
  }
}

function persistSessions() {
  const obj = {}
  for (const [token, s] of sessions) {
    obj[token] = s
  }
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2))
  } catch (e) {
    console.error('Failed to persist sessions:', e.message)
  }
}

function loadPersistedData() {
  // Load sessions
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const obj = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'))
      for (const [token, s] of Object.entries(obj)) {
        sessions.set(token, s)
      }
      console.log(`Loaded ${sessions.size} sessions from disk`)
    }
  } catch (e) {
    console.error('Failed to load sessions:', e.message)
  }

  // Load rooms
  try {
    if (fs.existsSync(ROOMS_FILE)) {
      const obj = JSON.parse(fs.readFileSync(ROOMS_FILE, 'utf8'))
      for (const [code, r] of Object.entries(obj)) {
        // Restore room with null ws for all players (they must reconnect)
        const playerMap = new Map()
        for (const p of r.players) {
          // Key by player ID during restore; will re-key by ws on reconnect
          playerMap.set(p.id, { ...p, ws: null, connected: false, cleanupTimer: null })
        }
        rooms.set(code, {
          players: playerMap,
          playerCount: r.playerCount,
          started: r.started,
          turnIndex: r.turnIndex,
          playerOrder: r.playerOrder,
          gameState: r.gameState,
          _restored: true,
        })
      }
      console.log(`Loaded ${rooms.size} rooms from disk`)
    }
  } catch (e) {
    console.error('Failed to load rooms:', e.message)
  }
}

loadPersistedData()

// ── Helper Functions ────────────────────────────────────────────────────────
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function broadcast(room, message, excludeWs = null) {
  for (const [key, info] of room.players) {
    const ws = info.ws
    if (ws && ws !== excludeWs && ws.readyState === 1 /* OPEN */) {
      ws.send(JSON.stringify(message))
    }
  }
}

function broadcastAll(room, message) {
  for (const [key, info] of room.players) {
    const ws = info.ws
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify(message))
    }
  }
}

function getRoomInfo(room) {
  const players = []
  for (const [key, info] of room.players) {
    players.push({
      id: info.id,
      name: info.name,
      ready: info.ready,
      isHost: info.isHost,
      connected: info.connected !== false, // Default to true if not set
    })
  }
  return {
    playerCount: room.playerCount,
    started: room.started,
    players,
    currentPlayerId: room.started ? room.playerOrder[room.turnIndex] : null,
  }
}

// ── WebSocket Server ────────────────────────────────────────────────────────
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
        const token = generateToken()

        const playerInfo = {
          id: playerId,
          name: msg.playerName || 'Host',
          ready: false,
          isHost: true,
          ws,
          token,
          connected: true,
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

        // Store session
        sessions.set(token, {
          roomCode,
          playerId,
          playerName: msg.playerName || 'Host',
          isHost: true,
        })

        persistRooms()
        persistSessions()

        ws.send(JSON.stringify({
          type: 'room_created',
          roomCode,
          playerId,
          isHost: true,
          roomInfo: getRoomInfo(room),
          token,
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

        // Count connected players for capacity check
        let connectedCount = 0
        for (const [key, info] of room.players) {
          if (info.connected !== false) connectedCount++
        }

        if (connectedCount >= room.playerCount) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room is full' }))
          return
        }

        // Handle reconnection: same name re-joining pre-game
        let existingEntry = null
        for (const [existKey, info] of room.players) {
          if (info.name === msg.playerName) {
            existingEntry = [existKey, info]
            break
          }
        }

        let token
        if (existingEntry) {
          // Reconnect: replace old ws
          const [oldKey, info] = existingEntry
          room.players.delete(oldKey)
          info.ws = ws
          info.connected = true
          playerId = info.id
          token = info.token
          room.players.set(ws, info)
        } else {
          playerId = `player-${Date.now()}-${Math.random().toString(36).slice(2)}`
          token = generateToken()
          const playerInfo = {
            id: playerId,
            name: msg.playerName || `Player ${room.players.size + 1}`,
            ready: false,
            isHost: false,
            ws,
            token,
            connected: true,
          }
          room.players.set(ws, playerInfo)

          // Store session
          sessions.set(token, {
            roomCode: msg.roomCode,
            playerId,
            playerName: msg.playerName || `Player ${room.players.size}`,
            isHost: false,
          })
        }

        currentRoomCode = msg.roomCode

        persistRooms()
        persistSessions()

        ws.send(JSON.stringify({
          type: 'room_joined',
          roomCode: msg.roomCode,
          playerId,
          isHost: false,
          roomInfo: getRoomInfo(room),
          token,
        }))

        // Notify others
        broadcast(room, {
          type: 'player_joined',
          roomInfo: getRoomInfo(room),
        }, ws)

        console.log(`[${msg.roomCode}] ${msg.playerName} joined (${room.players.size}/${room.playerCount})`)
        break
      }

      case 'reconnect': {
        // msg: { token, roomCode }
        const session = sessions.get(msg.token)
        if (!session) {
          ws.send(JSON.stringify({ type: 'error', message: 'Session expired. Please rejoin.' }))
          return
        }

        const room = rooms.get(session.roomCode)
        if (!room) {
          sessions.delete(msg.token)
          persistSessions()
          ws.send(JSON.stringify({ type: 'error', message: 'Room no longer exists.' }))
          return
        }

        // Find player in room (handle both ws-keyed and id-keyed maps from restore)
        let foundInfo = null
        let oldKey = null
        for (const [key, info] of room.players) {
          if (info.id === session.playerId || info.token === msg.token) {
            foundInfo = info
            oldKey = key
            break
          }
        }

        if (!foundInfo) {
          ws.send(JSON.stringify({ type: 'error', message: 'Player not found in room.' }))
          return
        }

        // Re-attach ws
        room.players.delete(oldKey)
        foundInfo.ws = ws
        foundInfo.connected = true
        room.players.set(ws, foundInfo)

        playerId = foundInfo.id
        currentRoomCode = session.roomCode

        // Cancel any cleanup timer
        if (foundInfo.cleanupTimer) {
          clearTimeout(foundInfo.cleanupTimer)
          foundInfo.cleanupTimer = null
        }

        persistRooms()

        ws.send(JSON.stringify({
          type: 'reconnected',
          roomCode: session.roomCode,
          playerId: foundInfo.id,
          isHost: foundInfo.isHost,
          roomInfo: getRoomInfo(room),
          gameState: room.gameState,
          currentPlayerId: room.started ? room.playerOrder[room.turnIndex] : null,
          playerOrder: room.playerOrder,
        }))

        broadcast(room, {
          type: 'player_reconnected',
          playerId: foundInfo.id,
          playerName: foundInfo.name,
          roomInfo: getRoomInfo(room),
        }, ws)

        console.log(`[${session.roomCode}] ${foundInfo.name} reconnected`)
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

        persistRooms()

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

        persistRooms()

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
          persistRooms()
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

        persistRooms()

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
        persistRooms()

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
    if (!info) return

    console.log(`[${currentRoomCode}] ${info.name} disconnected`)

    if (room.started) {
      // Mark disconnected but keep in room for potential reconnect
      info.connected = false
      info.ws = null

      // Re-key by id instead of ws so they can be found on reconnect
      room.players.delete(ws)
      room.players.set(info.id, info)

      broadcast(room, {
        type: 'player_disconnected',
        playerId: info.id,
        playerName: info.name,
        roomInfo: getRoomInfo(room),
      })

      // Set 5-minute cleanup timer
      info.cleanupTimer = setTimeout(() => {
        room.players.delete(info.id)
        // Clean up session too
        if (info.token) {
          sessions.delete(info.token)
          persistSessions()
        }
        if (room.players.size === 0) {
          rooms.delete(currentRoomCode)
          console.log(`[${currentRoomCode}] Room cleaned up (all disconnected)`)
        }
        persistRooms()
      }, 5 * 60 * 1000)

      persistRooms()
    } else {
      // Pre-game: remove immediately
      room.players.delete(ws)
      // Clean up session
      if (info.token) {
        sessions.delete(info.token)
        persistSessions()
      }

      broadcast(room, {
        type: 'player_left',
        playerId: info.id,
        playerName: info.name,
        roomInfo: getRoomInfo(room),
      })

      if (room.players.size === 0) {
        rooms.delete(currentRoomCode)
        console.log(`[${currentRoomCode}] Room cleaned up (empty)`)
      }
      persistRooms()
    }
  })

  ws.on('error', (err) => {
    console.error('WS error:', err.message)
  })
})

console.log(`🧪 Alchemy WS server running on :${PORT}`)
