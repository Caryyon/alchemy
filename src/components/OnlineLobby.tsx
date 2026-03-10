// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Online Multiplayer Lobby
// ────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMultiplayerStore } from '../store/multiplayerStore'
import { useGameStore } from '../store/gameStore'

interface OnlineLobbyProps {
  onBack: () => void
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({ onBack }) => {
  const {
    phase,
    roomCode,
    myPlayerId,
    myName,
    isHost,
    roomInfo,
    error,
    connect,
    sendReady,
    startGame,
    disconnect,
    setMyName,
    clearError,
  } = useMultiplayerStore()

  const { startGame: localStartGame } = useGameStore()

  const [name, setName] = useState(myName || 'Alchemist')
  const [playerCount, setPlayerCount] = useState(2)
  const [roomCodeInput, setRoomCodeInput] = useState('')

  // Check URL hash for room code on mount
  useEffect(() => {
    const hash = window.location.hash.replace('#', '').trim().toUpperCase()
    if (hash.length === 6) {
      setRoomCodeInput(hash)
    }
  }, [])

  const handleBack = () => {
    disconnect()
    onBack()
  }

  const handleCreateRoom = () => {
    if (!name.trim()) return
    setMyName(name.trim())
    connect(name.trim(), undefined, playerCount)
  }

  const handleJoinRoom = () => {
    const code = roomCodeInput.trim().toUpperCase()
    if (!name.trim() || code.length !== 6) return
    setMyName(name.trim())
    connect(name.trim(), code)
  }

  const handleReady = () => {
    sendReady()
  }

  const handleStartGame = () => {
    if (!isHost || !roomInfo) return
    const players = [...(roomInfo.players || [])]
    const names = players.map(p => p.name)
    // Use simple class assignment - cycle through classes
    const classIds = ['druid', 'mage', 'sorcerer', 'bard', 'witch']
    const classes = players.map((_, i) => classIds[i % classIds.length])
    localStartGame(players.length, classes, names)
    startGame({ started: true })
  }

  const shareUrl = roomCode
    ? `${window.location.origin}${window.location.pathname}#${roomCode}`
    : ''

  const handleCopyUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).catch(() => {})
    }
  }

  // ── Error ───────────────────────────────────────────────────────────────
  if (error && phase === 'error') {
    return (
      <div className="w-full flex flex-col items-center gap-6" style={{ maxWidth: 480 }}>
        <div className="w-full parchment rounded-2xl p-6" style={{ border: '1px solid #b8503055', textAlign: 'center' }}>
          <p style={{ fontSize: 32 }}>⚠️</p>
          <h3 style={{ fontFamily: 'Cinzel, serif', color: '#d4774a', fontSize: 16, margin: '8px 0' }}>Connection Error</h3>
          <p style={{ fontFamily: 'Crimson Text, serif', color: '#b8a898', fontStyle: 'italic' }}>{error}</p>
          <button onClick={() => { clearError(); handleBack() }} style={backBtnStyle}>← Back</button>
        </div>
      </div>
    )
  }

  // ── Idle: show create/join ──────────────────────────────────────────────
  if (phase === 'idle' || phase === 'creating' || phase === 'joining') {
    const loading = phase === 'creating' || phase === 'joining'

    // Check if we have a hash code to auto-join
    const hashCode = window.location.hash.replace('#', '').trim().toUpperCase()
    const hasHashRoom = hashCode.length === 6

    return (
      <div className="w-full flex flex-col items-center gap-5" style={{ maxWidth: 480 }}>
        <div className="w-full flex items-center gap-4">
          <button onClick={handleBack} style={backBtnStyle}>← Back</button>
          <h2 style={{ fontFamily: 'Cinzel, serif', color: '#8b5a9f', fontSize: 20, margin: 0 }}>
            🌐 Play Online
          </h2>
        </div>

        {error && (
          <div style={{ color: '#d4774a', fontFamily: 'Crimson Text, serif', fontStyle: 'italic', fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        <div className="w-full parchment rounded-2xl p-6 flex flex-col gap-5" style={{ border: '1px solid #8b5a9f44' }}>
          {/* Name input */}
          <div>
            <label style={labelStyle}>Your Alchemist Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
              placeholder="Enter your name..."
              maxLength={20}
            />
          </div>

          {hasHashRoom ? (
            // Auto-join flow
            <>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#b8a898', fontSize: 15 }}>
                  You've been invited to room:
                </p>
                <p style={{ fontFamily: 'Cinzel Decorative, serif', color: '#c9a84c', fontSize: 28, letterSpacing: '0.2em' }}>
                  {hashCode}
                </p>
              </div>
              <motion.button
                onClick={handleJoinRoom}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={loading || !name.trim()}
                style={{
                  ...brewBtnStyle,
                  background: 'linear-gradient(135deg, #3a1060, #8b5a9f)',
                  border: '2px solid #8b5a9f',
                }}
              >
                {loading ? <LoadingDots /> : `✨ Join Room ${hashCode}`}
              </motion.button>
              <button
                onClick={() => { window.location.hash = ''; setRoomCodeInput('') }}
                style={{ fontFamily: 'Crimson Text, serif', color: '#6b5a7a', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Or create a new room instead →
              </button>
            </>
          ) : (
            // Create or join
            <>
              {/* Player count */}
              <div>
                <label style={labelStyle}>Number of Players</label>
                <div className="flex gap-3 mt-2">
                  {[2, 3, 4].map(n => (
                    <motion.button
                      key={n}
                      onClick={() => setPlayerCount(n)}
                      whileHover={{ scale: 1.08 }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: playerCount === n ? 'radial-gradient(circle at 35% 35%, #8b5a9fcc, #8b5a9f88)' : 'rgba(26,18,40,0.6)',
                        border: `2px solid ${playerCount === n ? '#8b5a9f' : '#4a3a5a'}`,
                        color: playerCount === n ? '#fff' : '#6b5a7a',
                        fontFamily: 'Cinzel, serif',
                        fontWeight: 700,
                        fontSize: 18,
                        cursor: 'pointer',
                        boxShadow: playerCount === n ? '0 0 16px #8b5a9f66' : 'none',
                      }}
                    >
                      {n}
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.button
                onClick={handleCreateRoom}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={loading || !name.trim()}
                style={brewBtnStyle}
              >
                {loading ? <LoadingDots /> : '✨ Create Room'}
              </motion.button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: '#4a3a5a' }} />
                <span style={{ fontFamily: 'Crimson Text, serif', color: '#6b5a7a', fontSize: 13 }}>or join</span>
                <div style={{ flex: 1, height: 1, background: '#4a3a5a' }} />
              </div>

              <div className="flex gap-3">
                <input
                  value={roomCodeInput}
                  onChange={e => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="ROOM CODE"
                  style={{
                    ...inputStyle,
                    fontFamily: 'Cinzel Decorative, serif',
                    letterSpacing: '0.25em',
                    fontSize: 18,
                    flex: 1,
                    textAlign: 'center',
                  }}
                  maxLength={6}
                />
                <motion.button
                  onClick={handleJoinRoom}
                  whileHover={{ scale: 1.03 }}
                  disabled={loading || !name.trim() || roomCodeInput.length !== 6}
                  style={{
                    ...brewBtnStyle,
                    padding: '10px 20px',
                    fontSize: 14,
                    background: 'linear-gradient(135deg, #3a1060, #8b5a9f)',
                    border: '2px solid #8b5a9f',
                  }}
                >
                  Join
                </motion.button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Lobby waiting room ──────────────────────────────────────────────────
  if (phase === 'lobby') {
    const myInfo = roomInfo?.players.find(p => p.id === myPlayerId)
    const allReady = roomInfo?.players.every(p => p.ready) ?? false
    const atCapacity = (roomInfo?.players.length ?? 0) >= (roomInfo?.playerCount ?? 2)

    return (
      <div className="w-full flex flex-col items-center gap-5" style={{ maxWidth: 520 }}>
        <div className="w-full flex items-center gap-4">
          <button onClick={handleBack} style={backBtnStyle}>✕ Leave</button>
          <h2 style={{ fontFamily: 'Cinzel, serif', color: '#8b5a9f', fontSize: 20, margin: 0 }}>
            ⚗️ Room Lobby
          </h2>
        </div>

        {/* Room code display */}
        <div className="w-full parchment rounded-2xl p-6 flex flex-col gap-4" style={{ border: '1px solid #c9a84c44' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#8b7a6a', fontSize: 14, margin: 0 }}>
              Room Code
            </p>
            <motion.p
              animate={{ textShadow: ['0 0 10px #c9a84c88', '0 0 25px #c9a84ccc', '0 0 10px #c9a84c88'] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                fontFamily: 'Cinzel Decorative, serif',
                color: '#c9a84c',
                fontSize: 40,
                letterSpacing: '0.3em',
                margin: '4px 0',
              }}
            >
              {roomCode}
            </motion.p>
          </div>

          {/* Share URL */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              flex: 1,
              background: 'rgba(10,5,18,0.6)',
              border: '1px solid #4a3a5a',
              borderRadius: 8,
              padding: '8px 12px',
              fontFamily: 'Crimson Text, serif',
              color: '#6b5a7a',
              fontSize: 12,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {shareUrl}
            </div>
            <motion.button
              onClick={handleCopyUrl}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: '#4a3a5a',
                border: '1px solid #8b5a9f',
                borderRadius: 8,
                padding: '8px 14px',
                color: '#e8d5b7',
                fontFamily: 'Cinzel, serif',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              📋 Copy
            </motion.button>
          </div>

          <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#6b5a7a', fontSize: 13, textAlign: 'center', margin: 0 }}>
            Share this link with your friends to join!
          </p>
        </div>

        {/* Player list */}
        <div className="w-full parchment rounded-2xl p-5 flex flex-col gap-3" style={{ border: '1px solid #8b5a9f33' }}>
          <h3 style={{ fontFamily: 'Cinzel, serif', color: '#8b5a9f', fontSize: 13, margin: 0, letterSpacing: '0.1em' }}>
            ALCHEMISTS ({roomInfo?.players.length ?? 0}/{roomInfo?.playerCount ?? 2})
          </h3>

          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {roomInfo?.players.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: p.id === myPlayerId ? 'rgba(139,90,159,0.12)' : 'rgba(10,5,18,0.4)',
                    border: `1px solid ${p.id === myPlayerId ? '#8b5a9f66' : '#4a3a5a'}`,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{p.isHost ? '👑' : '🧙'}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: 'Cinzel, serif', color: '#e8d5b7', fontSize: 14 }}>
                      {p.name}
                    </span>
                    {p.isHost && (
                      <span style={{ fontFamily: 'Crimson Text, serif', color: '#c9a84c', fontSize: 11, marginLeft: 8 }}>Host</span>
                    )}
                  </div>
                  <span style={{
                    fontFamily: 'Cinzel, serif',
                    fontSize: 11,
                    color: p.ready ? '#4d9f5d' : '#6b5a7a',
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: p.ready ? '#4d9f5d22' : 'transparent',
                    border: `1px solid ${p.ready ? '#4d9f5d' : '#4a3a5a'}`,
                  }}>
                    {p.ready ? '✓ Ready' : 'Waiting...'}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Waiting slots */}
          {Array.from({ length: Math.max(0, (roomInfo?.playerCount ?? 2) - (roomInfo?.players.length ?? 0)) }, (_, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(10,5,18,0.2)',
              border: '1px dashed #4a3a5a',
            }}>
              <span style={{ fontSize: 20, opacity: 0.4 }}>🧙</span>
              <span style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#4a3a5a', fontSize: 14 }}>
                Waiting for player...
              </span>
              <div className="flex gap-1 ml-auto">
                <span className="wait-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#4a3a5a' }} />
                <span className="wait-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#4a3a5a' }} />
                <span className="wait-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#4a3a5a' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full justify-center">
          {!myInfo?.ready && (
            <motion.button
              onClick={handleReady}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              style={{
                ...brewBtnStyle,
                background: 'linear-gradient(135deg, #2a7a3d, #4d9f5d)',
                border: '2px solid #4d9f5d',
                padding: '12px 32px',
              }}
            >
              ✓ Ready!
            </motion.button>
          )}

          {isHost && allReady && atCapacity && (
            <motion.button
              onClick={handleStartGame}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="brew-button"
              style={brewBtnStyle}
            >
              ✨ Start Game!
            </motion.button>
          )}
        </div>

        {isHost && !allReady && (
          <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#6b5a7a', fontSize: 13 }}>
            Waiting for all players to ready up...
          </p>
        )}
      </div>
    )
  }

  return null
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const backBtnStyle: React.CSSProperties = {
  background: 'rgba(26,18,40,0.7)',
  border: '1px solid #4a3a5a',
  borderRadius: 8,
  padding: '6px 12px',
  color: '#8b7a9a',
  fontFamily: 'Cinzel, serif',
  fontSize: 12,
  cursor: 'pointer',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'Cinzel, serif',
  fontSize: 10,
  letterSpacing: '0.15em',
  color: '#6b5a7a',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(10,5,18,0.6)',
  border: '1px solid #4a3a5a',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#e8d5b7',
  fontFamily: 'Cinzel, serif',
  fontSize: 14,
  outline: 'none',
  width: '100%',
}

const brewBtnStyle: React.CSSProperties = {
  padding: '14px 36px',
  borderRadius: 14,
  fontFamily: 'Cinzel, serif',
  fontWeight: 700,
  fontSize: 16,
  letterSpacing: '0.06em',
  background: 'linear-gradient(135deg, #2a7a3d, #4d9f5d, #8b5a9f)',
  color: '#fff',
  border: '2px solid #4d9f5d',
  cursor: 'pointer',
}

// ── Loading dots ──────────────────────────────────────────────────────────────

function LoadingDots() {
  return (
    <div className="flex gap-1 items-center justify-center">
      <span className="wait-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
      <span className="wait-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
      <span className="wait-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
    </div>
  )
}

export default OnlineLobby
