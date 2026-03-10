// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Player Hand Component
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
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
  const [targetMode, setTargetMode] = useState<string | null>(null) // cardId waiting for target

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

    // Ingredient: play immediately
    if (card.type === 'ingredient') {
      playIngredient(card.id)
      setSelectedCard(null)
      return
    }

    // Scroll: play immediately
    if (card.type === 'scroll') {
      resolvePendingAction({ scrollCardId: card.id })
      setSelectedCard(null)
      return
    }

    // Spell: select for targeting or cast directly
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
      // No target needed
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

  // Also show spell deck cards
  const allCards: CardType[] = [...player.hand]

  return (
    <div className="flex flex-col gap-2">
      {targetMode && (
        <div className="flex gap-2 flex-wrap">
          <span className="text-yellow-400 text-sm font-semibold">Choose a target:</span>
          {otherPlayers.map((p) => (
            <button
              key={p.id}
              onClick={() => handleTargetPlayer(p.id)}
              className="px-3 py-1 rounded-lg text-sm font-bold transition-colors"
              style={{ background: '#8b5a9f', color: '#fff' }}
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={() => { setTargetMode(null); setSelectedCard(null) }}
            className="px-3 py-1 rounded-lg text-sm text-gray-400 border border-gray-600"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {allCards.length === 0 && (
          <p className="text-gray-600 text-sm italic">No cards in hand.</p>
        )}
        {allCards.map((card) => (
          <CardComponent
            key={card.id}
            card={card}
            onClick={isActive && isCurrentPlayer ? () => handleCardClick(card) : undefined}
            selected={selectedCard === card.id}
            disabled={!isActive || !isCurrentPlayer || turnPhase !== 'action'}
          />
        ))}
      </div>

      {/* Spell deck cards */}
      {player.spellDeck.length > 0 && isCurrentPlayer && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Spell Deck</p>
          <div className="flex flex-wrap gap-2">
            {player.spellDeck.map((card) => (
              <CardComponent
                key={card.id}
                card={card}
                onClick={isActive && isCurrentPlayer ? () => handleCardClick(card) : undefined}
                selected={selectedCard === card.id}
                disabled={!isActive || !isCurrentPlayer || turnPhase !== 'action'}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Hand
