// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Player Hand (mobile-first with tap-to-select)
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Card as CardType, SpellCard, IngredientCard } from '../types/game'
import CardComponent from './Card'
import { useGameStore } from '../store/gameStore'
import { MANA_COLORS } from '../data/cards'

interface HandProps {
  playerId: string
  isActive: boolean
}

const MANA_EMOJIS: Record<string, string> = {
  Fire: '🔥',
  Nature: '🌿',
  Lunar: '🌙',
  Arcane: '🔮',
  Shadow: '🕷️',
  Any: '✦',
}

export const Hand: React.FC<HandProps> = ({ playerId, isActive }) => {
  const { players, currentPlayerIndex, turnPhase, castSpell, playIngredient, resolvePendingAction, endTurn } = useGameStore()
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [targetMode, setTargetMode] = useState<string | null>(null)

  const playerIdx = players.findIndex((p) => p.id === playerId)
  const player = players[playerIdx]
  if (!player) return null

  const currentPlayer = players[currentPlayerIndex]
  const isCurrentPlayer = playerId === currentPlayer?.id
  const canAct = isActive && isCurrentPlayer && turnPhase === 'action'

  const handleCardClick = (card: CardType) => {
    if (!canAct) return

    // If clicking the same card, deselect it
    if (selectedCard === card.id) {
      setSelectedCard(null)
      setTargetMode(null)
      return
    }

    // Select the card (don't auto-play on first tap)
    setSelectedCard(card.id)
    setTargetMode(null)
  }

  const handlePlayIngredient = () => {
    const card = [...player.hand, ...player.spellDeck].find(c => c.id === selectedCard)
    if (card?.type === 'ingredient') {
      playIngredient(card.id)
      setSelectedCard(null)
    }
  }

  const handleCastSpell = () => {
    const card = [...player.hand, ...player.spellDeck].find(c => c.id === selectedCard)
    if (card?.type === 'spell') {
      const spell = card as SpellCard
      const needsTarget = [
        'steal_ingredient', 'discard_random', 'destroy_ingredient',
        'show_hand_steal', 'hex', 'swap_hands', 'shadowweave', 'drain',
      ].includes(spell.effect.kind)

      if (needsTarget) {
        setTargetMode(card.id)
        return
      }
      castSpell(card.id)
      setSelectedCard(null)
    }
  }

  const handleUseScroll = () => {
    const card = [...player.hand, ...player.spellDeck].find(c => c.id === selectedCard)
    if (card?.type === 'scroll') {
      resolvePendingAction({ scrollCardId: card.id })
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
  const selectedCardData = [...player.hand, ...player.spellDeck].find(c => c.id === selectedCard)

  // Calculate card dimensions based on viewport
  const cardWidth = 88
  const cardHeight = 132

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
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(139,90,159,0.15)',
              border: '1px solid #8b5a9f66',
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ fontFamily: 'Cinzel, serif', color: '#8b5a9f', fontSize: 12, fontWeight: 700 }}
            >
              🎯 Target:
            </motion.span>
            {otherPlayers.map((p) => (
              <motion.button
                key={p.id}
                onClick={() => handleTargetPlayer(p.id)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 16,
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 700,
                  fontSize: 11,
                  background: 'linear-gradient(135deg, #8b5a9fcc, #8b5a9f88)',
                  color: '#fff',
                  border: '1px solid #8b5a9f',
                  cursor: 'pointer',
                  boxShadow: '0 0 10px #8b5a9f44',
                }}
              >
                {p.name}
              </motion.button>
            ))}
            <button
              onClick={() => { setTargetMode(null); setSelectedCard(null) }}
              style={{
                padding: '6px 12px',
                borderRadius: 16,
                fontFamily: 'Crimson Text, serif',
                fontSize: 12,
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

      {/* Action buttons for selected card */}
      <AnimatePresence>
        {selectedCardData && canAct && !targetMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 flex-wrap"
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(77,159,93,0.12)',
              border: '1px solid #4d9f5d55',
            }}
          >
            <span style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 11,
              color: '#4d9f5d',
              fontWeight: 600,
            }}>
              {selectedCardData.name}:
            </span>

            {selectedCardData.type === 'ingredient' && (
              <motion.button
                onClick={handlePlayIngredient}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 16,
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 700,
                  fontSize: 11,
                  background: `linear-gradient(135deg, ${MANA_COLORS[(selectedCardData as IngredientCard).manaType]}cc, ${MANA_COLORS[(selectedCardData as IngredientCard).manaType]}88)`,
                  color: '#fff',
                  border: `1px solid ${MANA_COLORS[(selectedCardData as IngredientCard).manaType]}`,
                  cursor: 'pointer',
                  boxShadow: `0 0 10px ${MANA_COLORS[(selectedCardData as IngredientCard).manaType]}44`,
                }}
              >
                {MANA_EMOJIS[(selectedCardData as IngredientCard).manaType]} Play for Mana
              </motion.button>
            )}

            {selectedCardData.type === 'spell' && (
              <motion.button
                onClick={handleCastSpell}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 16,
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 700,
                  fontSize: 11,
                  background: 'linear-gradient(135deg, #8b5a9fcc, #8b5a9f88)',
                  color: '#fff',
                  border: '1px solid #8b5a9f',
                  cursor: 'pointer',
                  boxShadow: '0 0 10px #8b5a9f44',
                }}
              >
                ✨ Cast Spell
              </motion.button>
            )}

            {selectedCardData.type === 'scroll' && (
              <motion.button
                onClick={handleUseScroll}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 16,
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 700,
                  fontSize: 11,
                  background: 'linear-gradient(135deg, #c9a84ccc, #c9a84c88)',
                  color: '#fff',
                  border: '1px solid #c9a84c',
                  cursor: 'pointer',
                  boxShadow: '0 0 10px #c9a84c44',
                }}
              >
                📜 Use Scroll
              </motion.button>
            )}

            <button
              onClick={() => setSelectedCard(null)}
              style={{
                padding: '6px 12px',
                borderRadius: 16,
                fontFamily: 'Crimson Text, serif',
                fontSize: 12,
                color: '#6b5a7a',
                background: 'transparent',
                border: '1px solid #4a3a5a',
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hand cards with horizontal scroll */}
      <div className="flex items-end gap-3 overflow-x-auto pb-2" style={{
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
      }}>
        <AnimatePresence>
          {player.hand.length === 0 ? (
            <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#4a3a5a', fontSize: 13 }}>
              Hand empty
            </p>
          ) : (
            player.hand.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20, rotate: -3 }}
                animate={{
                  opacity: 1,
                  y: selectedCard === card.id ? -12 : 0,
                  rotate: 0,
                  scale: selectedCard === card.id ? 1.05 : 1,
                }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 200 }}
                style={{
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                  width: cardWidth,
                  height: cardHeight + 20, // Extra space for lift
                  display: 'flex',
                  alignItems: 'flex-end',
                }}
              >
                <div style={{ width: cardWidth, height: cardHeight }}>
                  <CardComponent
                    card={card}
                    onClick={canAct ? () => handleCardClick(card) : undefined}
                    selected={selectedCard === card.id}
                    disabled={!canAct}
                    compact
                  />
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {/* End Turn button inline with hand */}
        <motion.button
          onClick={endTurn}
          disabled={turnPhase === 'draw'}
          whileHover={turnPhase !== 'draw' ? { scale: 1.04 } : {}}
          whileTap={turnPhase !== 'draw' ? { scale: 0.96 } : {}}
          className="flex-shrink-0"
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            fontFamily: 'Cinzel, serif',
            fontWeight: 700,
            fontSize: 12,
            background: turnPhase !== 'draw'
              ? 'linear-gradient(135deg, #2a7a3d, #4d9f5d)'
              : '#2a1a3a',
            color: turnPhase !== 'draw' ? '#fff' : '#4a3a5a',
            border: `2px solid ${turnPhase !== 'draw' ? '#4d9f5d' : '#4a3a5a'}`,
            cursor: turnPhase !== 'draw' ? 'pointer' : 'not-allowed',
            boxShadow: turnPhase !== 'draw' ? '0 0 14px #4d9f5d44' : 'none',
            scrollSnapAlign: 'start',
            height: 'fit-content',
            alignSelf: 'center',
          }}
        >
          End Turn →
        </motion.button>
      </div>

      {/* Spell deck - shown below hand for current player */}
      {player.spellDeck.length > 0 && isCurrentPlayer && (
        <div>
          <p style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 9,
            letterSpacing: '0.12em',
            color: '#8b5a9f',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            ✨ Spells ({player.spellDeck.length})
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2" style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}>
            {player.spellDeck.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: selectedCard === card.id ? -8 : 0,
                  scale: selectedCard === card.id ? 1.05 : 1,
                }}
                transition={{ delay: i * 0.04 }}
                style={{
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                  width: cardWidth,
                  height: cardHeight + 12,
                  display: 'flex',
                  alignItems: 'flex-end',
                }}
              >
                <div style={{ width: cardWidth, height: cardHeight }}>
                  <CardComponent
                    card={card}
                    onClick={canAct ? () => handleCardClick(card) : undefined}
                    selected={selectedCard === card.id}
                    disabled={!canAct}
                    compact
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Hand
