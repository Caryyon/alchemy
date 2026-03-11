// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Connection Status Indicator
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMultiplayerStore } from '../store/multiplayerStore'

export const ConnectionStatus: React.FC = () => {
  const { isReconnecting, reconnectAttempts, error, phase } = useMultiplayerStore()

  // Only show when relevant
  if (!isReconnecting && !error && phase !== 'reconnecting') {
    // Show subtle connected indicator in playing/lobby state
    if (phase === 'playing' || phase === 'lobby') {
      return (
        <div className="flex items-center gap-1.5">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: '#4d9f5d' }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span
            style={{
              fontFamily: 'Crimson Text, serif',
              fontSize: 10,
              color: '#4d9f5d',
            }}
          >
            Connected
          </span>
        </div>
      )
    }
    return null
  }

  return (
    <AnimatePresence>
      {(isReconnecting || phase === 'reconnecting') && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="flex items-center gap-2"
        >
          <motion.div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: '#c9a84c' }}
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <div className="flex flex-col">
            <span
              style={{
                fontFamily: 'Cinzel, serif',
                fontSize: 10,
                fontWeight: 600,
                color: '#c9a84c',
              }}
            >
              Reconnecting...
            </span>
            {reconnectAttempts > 0 && (
              <span
                style={{
                  fontFamily: 'Crimson Text, serif',
                  fontSize: 9,
                  color: '#8b7a8a',
                }}
              >
                Attempt {reconnectAttempts + 1}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {error && !isReconnecting && phase !== 'reconnecting' && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="flex items-center gap-2"
        >
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: '#d4774a' }}
          />
          <span
            style={{
              fontFamily: 'Crimson Text, serif',
              fontSize: 10,
              color: '#d4774a',
              maxWidth: 140,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {error}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Reconnecting Overlay ────────────────────────────────────────────────────
export const ReconnectingOverlay: React.FC = () => {
  const { isReconnecting, reconnectAttempts, phase } = useMultiplayerStore()

  if (!isReconnecting && phase !== 'reconnecting') return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="rounded-xl p-6 text-center"
        style={{
          background: 'linear-gradient(160deg, rgba(26,18,40,0.98), rgba(14,8,22,0.99))',
          border: '2px solid #c9a84c',
          boxShadow: '0 0 40px #c9a84c44',
          maxWidth: 300,
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 40, marginBottom: 12 }}
        >
          ⚗️
        </motion.div>

        <h2
          style={{
            fontFamily: 'Cinzel, serif',
            fontWeight: 700,
            fontSize: 18,
            color: '#c9a84c',
            marginBottom: 8,
          }}
        >
          Reconnecting...
        </h2>

        <p
          style={{
            fontFamily: 'Crimson Text, serif',
            color: '#8b7a8a',
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          Lost connection to the server. Attempting to restore your session.
        </p>

        <div className="flex justify-center gap-1 mb-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="wait-dot w-2 h-2 rounded-full"
              style={{ background: '#c9a84c' }}
            />
          ))}
        </div>

        {reconnectAttempts > 2 && (
          <p
            style={{
              fontFamily: 'Crimson Text, serif',
              fontStyle: 'italic',
              color: '#6b5a7a',
              fontSize: 11,
            }}
          >
            Still trying... (attempt {reconnectAttempts + 1})
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}

export default ConnectionStatus
