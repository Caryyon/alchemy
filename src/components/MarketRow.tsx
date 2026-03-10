// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Market Row Component
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React from 'react'
import type { Card } from '../types/game'
import CardComponent from './Card'
import { useGameStore } from '../store/gameStore'

interface MarketRowProps {
  cards: Card[]
  deckSize: number
  discardSize: number
}

export const MarketRow: React.FC<MarketRowProps> = ({ cards, deckSize, discardSize }) => {
  const { turnPhase, drawCard, currentPlayerIndex, players } = useGameStore()
  const currentPlayer = players[currentPlayerIndex]
  const canDraw = turnPhase === 'draw'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Deck */}
        <button
          onClick={() => canDraw && drawCard(undefined)}
          disabled={!canDraw || deckSize === 0}
          className="relative flex-shrink-0 rounded-xl overflow-hidden transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            width: 80,
            height: 112,
            background: 'linear-gradient(135deg, #1a1a1a, #0d0d0d)',
            border: canDraw ? '2px solid #4d9f5d' : '2px solid #2f2f2f',
            boxShadow: canDraw ? '0 0 12px #4d9f5d44' : 'none',
          }}
        >
          <div className="flex flex-col items-center justify-center h-full gap-1">
            <span className="text-2xl">🃏</span>
            <span className="text-xs font-bold" style={{ color: canDraw ? '#4d9f5d' : '#555' }}>
              Draw
            </span>
            <span className="text-[10px] text-gray-500">{deckSize} left</span>
          </div>
        </button>

        {/* Divider */}
        <div className="w-px h-16 bg-gray-800" />

        {/* Market cards */}
        <div className="flex gap-2 flex-wrap">
          {cards.map((card, i) => (
            <div key={card.id} className="flex flex-col items-center gap-1">
              <CardComponent
                card={card}
                onClick={canDraw ? () => drawCard(i) : undefined}
                disabled={!canDraw}
              />
              {canDraw && (
                <span className="text-[9px] text-green-500 uppercase tracking-wider">Take</span>
              )}
            </div>
          ))}
          {cards.length === 0 && (
            <p className="text-gray-600 text-sm italic self-center">Market is empty</p>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-16 bg-gray-800" />

        {/* Discard pile */}
        <div
          className="flex-shrink-0 rounded-xl overflow-hidden flex flex-col items-center justify-center"
          style={{
            width: 80,
            height: 112,
            background: '#1a1a1a',
            border: '2px solid #2f2f2f',
          }}
        >
          <span className="text-2xl">🗑️</span>
          <span className="text-[10px] text-gray-500 mt-1">Discard</span>
          <span className="text-[10px] text-gray-600">{discardSize}</span>
        </div>
      </div>

      {canDraw && (
        <p className="text-xs text-green-400 animate-pulse">
          👆 {currentPlayer?.name}: Draw from deck or take a market card
        </p>
      )}
    </div>
  )
}

export default MarketRow
