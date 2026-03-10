// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Main Game Board
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { useGameStore } from '../store/gameStore'
import { getClass } from '../data/classes'
import PlayerPanel from './PlayerPanel'
import RecipeBoard from './RecipeBoard'
import MarketRow from './MarketRow'
import Hand from './Hand'

export const GameBoard: React.FC = () => {
  const {
    players,
    currentPlayerIndex,
    turnPhase,
    mainDeck,
    marketRow,
    discardPile,
    message,
    winner,
    pendingAction,
    endTurn,
    resetGame,
    resolvePendingAction,
  } = useGameStore()

  const currentPlayer = players[currentPlayerIndex]
  if (!currentPlayer) return null

  const currentClass = getClass(currentPlayer.classId)
  const opponents = players.filter((_, i) => i !== currentPlayerIndex)

  const turnPhaseLabel = {
    draw: '🃏 Draw Phase',
    action: '⚡ Action Phase',
    end: '🌙 End Phase',
  }[turnPhase]

  if (winner) {
    const winPlayer = players.find((p) => p.id === winner)
    const winClass = winPlayer ? getClass(winPlayer.classId) : null
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0d0d0d' }}
      >
        <div
          className="rounded-2xl p-12 text-center max-w-lg"
          style={{ background: '#1a1a1a', border: '2px solid #4d9f5d' }}
        >
          <div className="text-6xl mb-4">{winClass?.emoji ?? '🏆'}</div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#4d9f5d' }}>
            Victory!
          </h1>
          <p className="text-xl text-white mb-2">{winPlayer?.name} wins!</p>
          <p className="text-gray-400 mb-8">
            {winPlayer?.name} completed {winPlayer?.completedRecipes.length} recipes and mastered the Alchemy arts.
          </p>
          <button
            onClick={resetGame}
            className="px-8 py-3 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-105"
            style={{ background: '#4d9f5d', color: '#fff' }}
          >
            Play Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#0d0d0d', color: '#e0e0e0' }}
    >
      {/* Header Bar */}
      <div
        className="px-6 py-3 flex items-center justify-between"
        style={{ background: '#1a1a1a', borderBottom: '1px solid #2f2f2f' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">⚗️</span>
          <span className="font-bold text-lg" style={{ color: '#4d9f5d' }}>Alchemy</span>
          <span className="text-gray-600">·</span>
          <span className="text-sm text-gray-400">by Ryann Wolff</span>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{
              background: turnPhase === 'draw' ? '#4d9f5d22' : turnPhase === 'action' ? '#8b5a9f22' : '#2f2f2f',
              color: turnPhase === 'draw' ? '#4d9f5d' : turnPhase === 'action' ? '#8b5a9f' : '#888',
              border: `1px solid ${turnPhase === 'draw' ? '#4d9f5d' : turnPhase === 'action' ? '#8b5a9f' : '#2f2f2f'}`,
            }}
          >
            {turnPhaseLabel}
          </div>
          <span className="text-sm font-semibold" style={{ color: currentClass.color }}>
            {currentClass.emoji} {currentPlayer.name}
          </span>
        </div>
      </div>

      {/* Message bar */}
      <div
        className="px-6 py-2 text-sm"
        style={{ background: '#111', borderBottom: '1px solid #2f2f2f', color: '#aaa' }}
      >
        💬 {message}
      </div>

      {/* Wisdom/pending action overlay */}
      {pendingAction?.kind === 'wisdom_pick' && (
        <WisdomPicker
          cards={pendingAction.cards}
          keep={pendingAction.keep}
          onPick={(kept) => resolvePendingAction({ kept })}
        />
      )}

      <div className="flex-1 flex flex-col gap-0 overflow-auto">
        {/* ── Opponent panels ── */}
        {opponents.length > 0 && (
          <section className="px-6 py-3" style={{ borderBottom: '1px solid #2f2f2f' }}>
            <p className="text-xs uppercase tracking-widest text-gray-600 mb-2">Opponents</p>
            <div className="flex flex-wrap gap-3">
              {opponents.map((p) => (
                <div key={p.id} className="flex-1" style={{ minWidth: 260, maxWidth: 420 }}>
                  <PlayerPanel player={p} isActive={false} compact />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Market Row ── */}
        <section className="px-6 py-4" style={{ borderBottom: '1px solid #2f2f2f' }}>
          <p className="text-xs uppercase tracking-widest text-gray-600 mb-2">Market Row</p>
          <MarketRow
            cards={marketRow}
            deckSize={mainDeck.length}
            discardSize={discardPile.length}
          />
        </section>

        {/* ── Active Player Info ── */}
        <section className="px-6 py-3" style={{ borderBottom: '1px solid #2f2f2f' }}>
          <PlayerPanel player={currentPlayer} isActive={true} />
        </section>

        {/* ── Recipe Board ── */}
        <section className="px-6 py-3" style={{ borderBottom: '1px solid #2f2f2f' }}>
          <p className="text-xs uppercase tracking-widest text-gray-600 mb-2">Your Recipes</p>
          <RecipeBoard
            recipes={currentPlayer.recipes}
            completedRecipes={currentPlayer.completedRecipes}
            playerId={currentPlayer.id}
            isActive={true}
          />
        </section>

        {/* ── Hand ── */}
        <section className="px-6 py-3" style={{ borderBottom: '1px solid #2f2f2f' }}>
          <p className="text-xs uppercase tracking-widest text-gray-600 mb-2">
            Your Hand ({currentPlayer.hand.length} cards)
          </p>
          <Hand playerId={currentPlayer.id} isActive={true} />
        </section>

        {/* ── Actions ── */}
        <section className="px-6 py-4 flex items-center gap-3 flex-wrap">
          <button
            onClick={endTurn}
            disabled={turnPhase === 'draw'}
            className="px-6 py-3 rounded-xl font-bold text-base transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: turnPhase !== 'draw' ? '#4d9f5d' : '#2f2f2f',
              color: '#fff',
              boxShadow: turnPhase !== 'draw' ? '0 0 16px #4d9f5d44' : 'none',
            }}
          >
            End Turn →
          </button>

          <button
            onClick={resetGame}
            className="px-4 py-3 rounded-xl text-sm transition-all duration-200 hover:bg-red-900"
            style={{ border: '1px solid #444', color: '#666' }}
          >
            Quit Game
          </button>

          <div className="text-xs text-gray-600 ml-auto">
            Deck: {mainDeck.length} · Discard: {discardPile.length}
          </div>
        </section>
      </div>
    </div>
  )
}

// ── Wisdom Picker ─────────────────────────────────────────────────────────────

import { CardComponent } from './Card'
import type { Card } from '../types/game'

function WisdomPicker({
  cards,
  keep,
  onPick,
}: {
  cards: Card[]
  keep: number
  onPick: (kept: string[]) => void
}) {
  const [selected, setSelected] = React.useState<string[]>([])

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length < keep
        ? [...prev, id]
        : prev
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)' }}
    >
      <div
        className="rounded-2xl p-6 flex flex-col gap-4 max-w-2xl w-full mx-4"
        style={{ background: '#1a1a1a', border: '2px solid #8b5a9f' }}
      >
        <h3 className="text-lg font-bold" style={{ color: '#8b5a9f' }}>
          📖 Scroll of Wisdom — Choose {keep} to keep
        </h3>
        <div className="flex flex-wrap gap-3 justify-center">
          {cards.map((card) => (
            <CardComponent
              key={card.id}
              card={card}
              selected={selected.includes(card.id)}
              onClick={() => toggle(card.id)}
            />
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <span className="text-sm text-gray-400 self-center">
            {selected.length}/{keep} selected
          </span>
          <button
            onClick={() => onPick(selected)}
            disabled={selected.length !== keep}
            className="px-6 py-2 rounded-xl font-bold transition-all"
            style={{
              background: selected.length === keep ? '#8b5a9f' : '#2f2f2f',
              color: selected.length === keep ? '#fff' : '#555',
            }}
          >
            Keep Selected
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameBoard
