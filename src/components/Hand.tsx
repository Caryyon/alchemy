// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Player Hand (magical redesign with fan layout)
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Card as CardType, SpellCard } from '../types/game'
import CardComponent from './Card'
import { useGameStore } from '../store/gameStore'

interface HandProps {
  playerId: string
  isActive: boolean
}

export const Hand: React.FC<HandProps> = ({ playerId, isActive }) => {
  const { players, currentPlayerIndex, turnPhase, castSpell, playIngredient, resolvePendingAction } = useGameStore()
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [targetMode, setTargetMode] = useState<string | null>(null)

  const playerIdx = players.findIndex((p) => p.id === playerId)
  const player = players[playerIdx]
  if (!player) return null

  const currentPlayer = players[currentPlayerIndex]
  const isCurrentPlayer = playerId === currentPlayer?.id

  const handleCardClick = (card: CardType) => {
    if (!isActive || !isCurrentPlayer) return
    if (turnPhase !== 'action') return

    if (selectedCard === card.id) {
      setSelectedCard(null)
      setTargetMode(null)
      return
    }

    if (card.type === 'ingredient') {
      playIngredient(card.id)
      setSelectedCard(null)
      return
    }

    if (card.type === 'scroll') {
      resolvePendingAction({ scrollCardId: card.id })
      setSelectedCard(null)
      return
    }

    if (card.type === 'spell') {
      const spell = card as SpellCard
      const needsTarget = [
        'steal_ingredient', 'discard_random', 'destroy_ingredient',
        'show_hand_steal', 'hex', 'swap_hands', 'shadowweave', 'drain',
      ].includes(spell.effect.kind)

      if (needsTarget) {
        setSelectedCard(card.id)
        setTargetMode(card.id)
        return
      }
      castSpell(card.id)
      setSelectedCard(null)
    }
  }

  const handleTargetPlayer = (targetId: string) => {
    if (targetMode) {
      castSpell(targetMode, targetId)
      setTargetMode(null)
      setSelectedCard(null)
    }
  }

  const otherPlayers = players.filter((p) => p.id !== playerId)
  const allCards: CardType[] = [...player.hand]

  return (
    <div className="flex flex-col gap-3">
      {/* Target selection banner */}
      <AnimatePresence>
        {targetMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-2 flex-wrap items-center"
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              background: 'rgba(139,90,159,0.15)',
              border: '1px solid #8b5a9f66',
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ fontFamily: 'Cinzel, serif', color: '#8b5a9f', fontSize: 13, fontWeight: 700 }}
            >
              🎯 Choose a target:
            </motion.span>
            {otherPlayers.map((p) => (
              <motion.button
                key={p.id}
                onClick={() => handleTargetPlayer(p.id)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 700,
                  fontSize: 12,
                  background: 'linear-gradient(135deg, #8b5a9fcc, #8b5a9f88)',
                  color: '#fff',
                  border: '1px solid #8b5a9f',
                  cursor: 'pointer',
                  boxShadow: '0 0 12px #8b5a9f44',
                }}
              >
                {p.name}
              </motion.button>
            ))}
            <button
              onClick={() => { setTargetMode(null); setSelectedCard(null) }}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontFamily: 'Crimson Text, serif',
                fontSize: 13,
                color: '#6b5a7a',
                background: 'transparent',
                border: '1px solid #4a3a5a',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hand cards */}
      <motion.div className="flex flex-wrap gap-3 items-end">
        <AnimatePresence>
          {allCards.length === 0 ? (
            <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#4a3a5a', fontSize: 14 }}>
              Your hand is empty.
            </p>
          ) : (
            allCards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30, rotate: -5 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 200 }}
              >
                <CardComponent
                  card={card}
                  onClick={isActive && isCurrentPlayer ? () => handleCardClick(card) : undefined}
                  selected={selectedCard === card.id}
                  disabled={!isActive || !isCurrentPlayer || turnPhase !== 'action'}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Spell deck */}
      {player.spellDeck.length > 0 && isCurrentPlayer && (
        <div>
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: '0.15em', color: '#8b5a9f', textTransform: 'uppercase', marginBottom: 8 }}>
            ✨ Spell Deck
          </p>
          <div className="flex flex-wrap gap-3">
            {player.spellDeck.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <CardComponent
                  card={card}
                  onClick={isActive && isCurrentPlayer ? () => handleCardClick(card) : undefined}
                  selected={selectedCard === card.id}
                  disabled={!isActive || !isCurrentPlayer || turnPhase !== 'action'}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Hand
