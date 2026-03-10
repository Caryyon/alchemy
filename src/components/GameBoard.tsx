// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Main Game Board (magical redesign)
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useGameStore } from '../store/gameStore'
import { getClass } from '../data/classes'
import PlayerPanel from './PlayerPanel'
import RecipeBoard from './RecipeBoard'
import MarketRow from './MarketRow'
import Hand from './Hand'
import { CardComponent } from './Card'
import Background from './Background'
import ActionLog from './ActionLog'
import { useActionLog } from '../store/actionLogStore'
import type { Card } from '../types/game'

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

  const { addEntry, clear } = useActionLog()
  const prevMessage = useRef<string>('')
  const prevWinner = useRef<string | null>(null)

  const currentPlayer = players[currentPlayerIndex]
  const currentClass = currentPlayer ? getClass(currentPlayer.classId) : null
  const opponents = players.filter((_, i) => i !== currentPlayerIndex)

  // Log messages as actions
  useEffect(() => {
    if (message && message !== prevMessage.current) {
      prevMessage.current = message
      const emoji =
        message.includes('complet') ? '🏆' :
        message.includes('spell') || message.includes('cast') ? '✨' :
        message.includes('drew') || message.includes('draw') ? '🃏' :
        message.includes('mana') || message.includes('Mana') ? '⚗️' :
        message.includes('recipe') ? '🧪' :
        message.includes('turn') ? '🌙' :
        '✦'
      addEntry(message, emoji)
    }
  }, [message, addEntry])

  // Fire confetti on recipe completion
  useEffect(() => {
    if (message && (message.toLowerCase().includes('complet') || message.toLowerCase().includes('brew'))) {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#c9a84c', '#4d9f5d', '#8b5a9f', '#d4774a'],
      })
    }
  }, [message])

  // Big confetti burst on win
  useEffect(() => {
    if (winner && winner !== prevWinner.current) {
      prevWinner.current = winner
      clear()
      const duration = 3000
      const end = Date.now() + duration
      const fire = () => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#c9a84c', '#4d9f5d', '#8b5a9f'],
        })
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#c9a84c', '#4d9f5d', '#8b5a9f'],
        })
        if (Date.now() < end) requestAnimationFrame(fire)
      }
      fire()
    }
  }, [winner, clear])

  if (!currentPlayer) return null

  // ── Win screen ──────────────────────────────────────────────────────────
  if (winner) {
    const winPlayer = players.find((p) => p.id === winner)
    const winClass = winPlayer ? getClass(winPlayer.classId) : null

    return (
      <>
        <Background />
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="rounded-3xl p-12 text-center"
            style={{
              background: 'linear-gradient(160deg, rgba(26,18,40,0.97), rgba(14,8,22,0.99))',
              border: `2px solid ${winClass?.color ?? '#c9a84c'}`,
              boxShadow: `0 0 60px ${winClass?.color ?? '#c9a84c'}44, 0 0 120px ${winClass?.color ?? '#c9a84c'}22`,
              maxWidth: 480,
              width: '90%',
            }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              style={{ fontSize: 80, marginBottom: 16 }}
            >
              {winClass?.emoji ?? '🏆'}
            </motion.div>
            <motion.h1
              animate={{ textShadow: ['0 0 10px #c9a84c44', '0 0 30px #c9a84caa', '0 0 10px #c9a84c44'] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ fontFamily: 'Cinzel Decorative, serif', fontSize: 42, color: '#c9a84c', margin: '0 0 8px 0' }}
            >
              Victory!
            </motion.h1>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: winClass?.color ?? '#e8d5b7', marginBottom: 8 }}>
              {winPlayer?.name} wins!
            </p>
            <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#8b7a8a', fontSize: 16, marginBottom: 32, lineHeight: 1.5 }}>
              {winPlayer?.name} completed {winPlayer?.completedRecipes.length} recipes
              and mastered the ancient arts of Alchemy.
            </p>
            <motion.button
              onClick={resetGame}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.97 }}
              className="brew-button"
              style={{
                padding: '14px 40px',
                borderRadius: 14,
                fontFamily: 'Cinzel, serif',
                fontWeight: 700,
                fontSize: 16,
                background: `linear-gradient(135deg, ${winClass?.color ?? '#4d9f5d'}cc, ${winClass?.color ?? '#4d9f5d'}88)`,
                color: '#fff',
                border: `2px solid ${winClass?.color ?? '#4d9f5d'}`,
                cursor: 'pointer',
              }}
            >
              ✨ Play Again
            </motion.button>
          </motion.div>
        </div>
      </>
    )
  }

  const turnPhaseLabel = {
    draw: '🃏 Draw',
    action: '⚡ Action',
    end: '🌙 End',
  }[turnPhase]

  const turnPhaseColor = {
    draw: '#4d9f5d',
    action: '#8b5a9f',
    end: '#c9a84c',
  }[turnPhase]

  return (
    <>
      <Background />
      <div
        className="min-h-screen flex flex-col board-texture"
        style={{ position: 'relative', zIndex: 1, color: '#e8d5b7' }}
      >
        {/* ── Header Bar ── */}
        <div
          style={{
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10,5,18,0.92)',
            borderBottom: '1px solid #4a3a5a',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 20, filter: 'drop-shadow(0 0 6px #4d9f5d88)' }}>⚗️</span>
            <span style={{ fontFamily: 'Cinzel Decorative, serif', fontWeight: 700, fontSize: 16, color: '#c9a84c' }}>
              Alchemy
            </span>
            <span style={{ color: '#4a3a5a', fontFamily: 'Crimson Text, serif' }}>·</span>
            <span style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#6b5a7a', fontSize: 13 }}>
              by Ryann Wolff
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Turn indicator */}
            <motion.div
              animate={{ boxShadow: [`0 0 6px ${turnPhaseColor}44`, `0 0 14px ${turnPhaseColor}88`, `0 0 6px ${turnPhaseColor}44`] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                background: turnPhaseColor + '22',
                color: turnPhaseColor,
                border: `1px solid ${turnPhaseColor}`,
                fontFamily: 'Cinzel, serif',
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: '0.1em',
              }}
            >
              {turnPhaseLabel}
            </motion.div>

            {/* Current player */}
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 18, filter: `drop-shadow(0 0 4px ${currentClass?.color}88)` }}>
                {currentClass?.emoji}
              </span>
              <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, color: currentClass?.color, fontSize: 13 }}>
                {currentPlayer.name}
              </span>
            </div>
          </div>
        </div>

        {/* ── Message bar ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={message}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: '6px 20px',
              background: 'rgba(8,4,14,0.8)',
              borderBottom: '1px solid #4a3a5a',
              fontFamily: 'Crimson Text, serif',
              fontStyle: 'italic',
              color: '#8b7a8a',
              fontSize: 14,
            }}
          >
            💬 {message}
          </motion.div>
        </AnimatePresence>

        {/* ── Wisdom picker overlay ── */}
        {pendingAction?.kind === 'wisdom_pick' && (
          <WisdomPicker
            cards={pendingAction.cards}
            keep={pendingAction.keep}
            onPick={(kept) => resolvePendingAction({ kept })}
          />
        )}

        {/* ── Main content ── */}
        <div className="flex-1 flex overflow-auto">
          {/* Left column: main game content */}
          <div className="flex-1 flex flex-col gap-0 overflow-auto">
            {/* Opponents */}
            {opponents.length > 0 && (
              <section
                style={{ padding: '12px 20px', borderBottom: '1px solid #4a3a5a22' }}
              >
                <p style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: '0.15em', color: '#4a3a5a', textTransform: 'uppercase', marginBottom: 8 }}>
                  Opponents
                </p>
                <div className="flex flex-wrap gap-3">
                  {opponents.map((p) => (
                    <div key={p.id} style={{ flex: 1, minWidth: 260, maxWidth: 420 }}>
                      <PlayerPanel player={p} isActive={false} compact />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Market Row */}
            <section style={{ padding: '14px 20px', borderBottom: '1px solid #4a3a5a22' }}>
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: '0.15em', color: '#4a3a5a', textTransform: 'uppercase', marginBottom: 10 }}>
                ✦ Market Row
              </p>
              <MarketRow
                cards={marketRow}
                deckSize={mainDeck.length}
                discardSize={discardPile.length}
              />
            </section>

            {/* Active player panel */}
            <section style={{ padding: '12px 20px', borderBottom: '1px solid #4a3a5a22' }}>
              <PlayerPanel player={currentPlayer} isActive={true} />
            </section>

            {/* Recipe board */}
            <section style={{ padding: '12px 20px', borderBottom: '1px solid #4a3a5a22' }}>
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: '0.15em', color: '#4a3a5a', textTransform: 'uppercase', marginBottom: 8 }}>
                ✦ Recipes
              </p>
              <RecipeBoard
                recipes={currentPlayer.recipes}
                completedRecipes={currentPlayer.completedRecipes}
                playerId={currentPlayer.id}
                isActive={true}
              />
            </section>

            {/* Hand */}
            <section style={{ padding: '12px 20px', borderBottom: '1px solid #4a3a5a22' }}>
              <p style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: '0.15em', color: '#4a3a5a', textTransform: 'uppercase', marginBottom: 8 }}>
                ✦ Your Hand ({currentPlayer.hand.length})
              </p>
              <Hand playerId={currentPlayer.id} isActive={true} />
            </section>

            {/* Actions */}
            <section
              className="flex items-center gap-3 flex-wrap"
              style={{ padding: '14px 20px' }}
            >
              <motion.button
                onClick={endTurn}
                disabled={turnPhase === 'draw'}
                whileHover={turnPhase !== 'draw' ? { scale: 1.04 } : {}}
                whileTap={turnPhase !== 'draw' ? { scale: 0.97 } : {}}
                style={{
                  padding: '12px 28px',
                  borderRadius: 12,
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: '0.06em',
                  background: turnPhase !== 'draw'
                    ? 'linear-gradient(135deg, #2a7a3d, #4d9f5d)'
                    : '#2a1a3a',
                  color: turnPhase !== 'draw' ? '#fff' : '#4a3a5a',
                  border: `2px solid ${turnPhase !== 'draw' ? '#4d9f5d' : '#4a3a5a'}`,
                  cursor: turnPhase !== 'draw' ? 'pointer' : 'not-allowed',
                  boxShadow: turnPhase !== 'draw' ? '0 0 16px #4d9f5d44' : 'none',
                }}
              >
                End Turn →
              </motion.button>

              <motion.button
                onClick={resetGame}
                whileHover={{ backgroundColor: 'rgba(184,84,80,0.15)' }}
                style={{
                  padding: '12px 20px',
                  borderRadius: 12,
                  fontFamily: 'Crimson Text, serif',
                  fontSize: 14,
                  color: '#6b5a7a',
                  background: 'transparent',
                  border: '1px solid #4a3a5a',
                  cursor: 'pointer',
                }}
              >
                Quit Game
              </motion.button>

              <span style={{ fontFamily: 'Crimson Text, serif', fontSize: 12, color: '#4a3a5a', marginLeft: 'auto' }}>
                Deck: {mainDeck.length} · Discard: {discardPile.length}
              </span>
            </section>
          </div>

          {/* Right column: action log */}
          <div
            style={{
              width: 240,
              flexShrink: 0,
              padding: '16px 12px',
              borderLeft: '1px solid #4a3a5a22',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <ActionLog />
          </div>
        </div>
      </div>
    </>
  )
}

// ── Wisdom Picker ─────────────────────────────────────────────────────────────

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 250 }}
        className="rounded-2xl p-6 flex flex-col gap-4 mx-4 parchment"
        style={{
          border: '2px solid #8b5a9f',
          boxShadow: '0 0 40px #8b5a9f44',
          maxWidth: 640,
          width: '100%',
        }}
      >
        <h3 style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, color: '#8b5a9f', fontSize: 16, margin: 0 }}>
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
        <div className="flex justify-end gap-3 items-center">
          <span style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#6b5a7a', fontSize: 14 }}>
            {selected.length}/{keep} selected
          </span>
          <motion.button
            onClick={() => onPick(selected)}
            disabled={selected.length !== keep}
            whileHover={selected.length === keep ? { scale: 1.05 } : {}}
            style={{
              padding: '10px 24px',
              borderRadius: 12,
              fontFamily: 'Cinzel, serif',
              fontWeight: 700,
              fontSize: 14,
              background: selected.length === keep ? 'linear-gradient(135deg, #6b3a8f, #8b5a9f)' : '#2a1a3a',
              color: selected.length === keep ? '#fff' : '#4a3a5a',
              border: `1px solid ${selected.length === keep ? '#8b5a9f' : '#4a3a5a'}`,
              cursor: selected.length === keep ? 'pointer' : 'not-allowed',
            }}
          >
            Keep Selected
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default GameBoard
