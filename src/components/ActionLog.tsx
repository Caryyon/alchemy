// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Action Log (sidebar)
// ────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useActionLog } from '../store/actionLogStore'

export const ActionLog: React.FC = () => {
  const { entries } = useActionLog()

  return (
    <div
      style={{
        background: 'rgba(10,5,18,0.85)',
        border: '1px solid #4a3a5a',
        borderRadius: 12,
        padding: '10px 12px',
        minWidth: 200,
        maxWidth: 260,
        maxHeight: 280,
        overflow: 'hidden',
      }}
    >
      <p style={{
        fontFamily: 'Cinzel, serif',
        fontSize: 9,
        letterSpacing: '0.15em',
        color: '#4a3a5a',
        textTransform: 'uppercase',
        marginBottom: 8,
      }}>
        ✦ Recent Actions
      </p>

      <div className="flex flex-col gap-1.5">
        <AnimatePresence>
          {entries.length === 0 ? (
            <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#4a3a5a', fontSize: 12 }}>
              No actions yet...
            </p>
          ) : (
            entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="action-log-entry"
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: 12, flexShrink: 0 }}>{entry.emoji}</span>
                <span style={{
                  fontFamily: 'Crimson Text, serif',
                  fontSize: 12,
                  color: '#8b7a8a',
                  lineHeight: 1.3,
                }}>
                  {entry.text}
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ActionLog
