// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Market Row (magical redesign)
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { motion } from 'framer-motion'
import type { Card } from '../types/game'
import CardComponent from './Card'
import { useGameStore } from '../store/gameStore'

interface MarketRowProps {
  cards: Card[]
  deckSize: number
  discardSize: number
}

// Slight alternating rotation for market cards
const ROTATIONS = [-2.5, 1.5, -1.8, 2.2, -1.2]

export const MarketRow: React.FC<MarketRowProps> = ({ cards, deckSize, discardSize }) => {
  const { turnPhase, drawCard, currentPlayerIndex, players } = useGameStore()
  const currentPlayer = players[currentPlayerIndex]
  const canDraw = turnPhase === 'draw'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-4 flex-wrap">
        {/* Deck */}
        <motion.button
          onClick={() => canDraw && drawCard(undefined)}
          disabled={!canDraw || deckSize === 0}
          whileHover={canDraw && deckSize > 0 ? { scale: 1.06, y: -4 } : {}}
          whileTap={canDraw ? { scale: 0.97 } : {}}
          className="relative flex-shrink-0 rounded-xl overflow-hidden card-back-gradient"
          style={{
            width: 84,
            height: 118,
            border: `2px solid ${canDraw ? '#4d9f5dcc' : '#4a3a5a'}`,
            boxShadow: canDraw
              ? '0 0 20px #4d9f5d66, 0 4px 20px rgba(0,0,0,0.5)'
              : '0 4px 12px rgba(0,0,0,0.4)',
            cursor: canDraw && deckSize > 0 ? 'pointer' : 'not-allowed',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {/* Inset border glow */}
          <div style={{
            position: 'absolute',
            inset: 4,
            border: `1px solid ${canDraw ? '#4d9f5d44' : '#4a3a5a22'}`,
            borderRadius: 8,
            background: 'radial-gradient(ellipse at 50% 40%, rgba(139,90,159,0.1), transparent 70%)',
          }} />
          <motion.span
            style={{ fontSize: 28, position: 'relative', zIndex: 1 }}
            animate={canDraw ? { filter: ['drop-shadow(0 0 4px #4d9f5d66)', 'drop-shadow(0 0 10px #4d9f5dcc)', 'drop-shadow(0 0 4px #4d9f5d66)'] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⚗️
          </motion.span>
          <span style={{
            fontFamily: 'Cinzel, serif',
            fontWeight: 700,
            fontSize: 10,
            color: canDraw ? '#4d9f5d' : '#4a3a5a',
            position: 'relative',
            zIndex: 1,
          }}>
            Draw
          </span>
          <span style={{ fontFamily: 'Crimson Text, serif', fontSize: 11, color: '#6b5a7a', position: 'relative', zIndex: 1 }}>
            {deckSize} left
          </span>
        </motion.button>

        {/* Divider */}
        <div style={{ width: 1, height: 80, background: 'linear-gradient(to bottom, transparent, #8b5a9f44, transparent)' }} />

        {/* Market cards */}
        <div className="flex gap-3 items-end flex-wrap">
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-1"
            >
              <CardComponent
                card={card}
                onClick={canDraw ? () => drawCard(i) : undefined}
                disabled={!canDraw}
                rotation={ROTATIONS[i % ROTATIONS.length]}
              />
              {canDraw && (
                <motion.span
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: '#4d9f5d', letterSpacing: '0.15em', textTransform: 'uppercase' }}
                >
                  Take
                </motion.span>
              )}
            </motion.div>
          ))}
          {cards.length === 0 && (
            <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#4a3a5a', fontSize: 14 }}>
              Market is empty
            </p>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 80, background: 'linear-gradient(to bottom, transparent, #8b5a9f44, transparent)' }} />

        {/* Discard pile */}
        <div
          className="flex-shrink-0 rounded-xl overflow-hidden flex flex-col items-center justify-center"
          style={{
            width: 72,
            height: 100,
            background: 'rgba(14,8,22,0.6)',
            border: '1px solid #4a3a5a',
          }}
        >
          <span style={{ fontSize: 22 }}>🗑️</span>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: '#4a3a5a', marginTop: 4, letterSpacing: '0.1em' }}>DISCARD</span>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 12, color: '#6b5a7a' }}>{discardSize}</span>
        </div>
      </div>

      {canDraw && (
        <motion.p
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#4d9f5d', fontSize: 14 }}
        >
          👆 {currentPlayer?.name}: Draw from the deck or take a card from the market
        </motion.p>
      )}
    </div>
  )
}

export default MarketRow
