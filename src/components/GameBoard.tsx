// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Game Board (Responsive Layout Switcher + Game Overlays)
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useGameStore } from '../store/gameStore'
import { useMultiplayerStore } from '../store/multiplayerStore'
import { getClass } from '../data/classes'
import { CardComponent } from './Card'
import Background from './Background'
import { useActionLog } from '../store/actionLogStore'
import { Tutorial, useTutorial } from './Tutorial'
import { ReconnectingOverlay } from './ConnectionStatus'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { MobileGameBoard } from '../layouts/MobileGameBoard'
import { TabletGameBoard } from '../layouts/TabletGameBoard'
import { DesktopGameBoard } from '../layouts/DesktopGameBoard'
import type { Card } from '../types/game'

// ── AAA Turn Transition Banner ────────────────────────────────────────────────
const TurnTransitionBanner: React.FC = () => {
  const { players, currentPlayerIndex, turnPhase, phase } = useGameStore()
  const { myPlayerId, phase: mpPhase } = useMultiplayerStore()
  const [show, setShow] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [isMyTurn, setIsMyTurn] = useState(false)
  const prevTurnRef = useRef(currentPlayerIndex)

  useEffect(() => {
    // Only show when game is playing and turn changes
    if (phase !== 'playing') return
    if (prevTurnRef.current === currentPlayerIndex) return
    if (turnPhase !== 'draw') return

    prevTurnRef.current = currentPlayerIndex
    const currentPlayer = players[currentPlayerIndex]
    if (!currentPlayer) return

    const isMine = !myPlayerId || currentPlayer.id === myPlayerId || mpPhase !== 'playing'
    setPlayerName(currentPlayer.name)
    setIsMyTurn(isMine)
    setShow(true)

    const timer = setTimeout(() => setShow(false), 1800)
    return () => clearTimeout(timer)
  }, [currentPlayerIndex, turnPhase, players, myPlayerId, phase, mpPhase])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(5,3,8,0.85)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ y: -60, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{
              position: 'relative',
              background: 'linear-gradient(90deg, transparent 0%, rgba(14,8,22,0.98) 20%, rgba(14,8,22,0.98) 80%, transparent 100%)',
              borderTop: '1px solid #c9a84c55',
              borderBottom: '1px solid #c9a84c55',
              padding: '24px 80px',
              textAlign: 'center',
            }}
          >
            {/* Decorative lines */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 60,
              height: 3,
              background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)',
            }} />

            <motion.h2
              animate={{
                textShadow: [
                  '0 0 20px #c9a84c66',
                  '0 0 40px #c9a84caa',
                  '0 0 20px #c9a84c66',
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                fontFamily: 'Cinzel Decorative, serif',
                fontSize: 'clamp(24px, 5vw, 36px)',
                fontWeight: 900,
                color: '#c9a84c',
                letterSpacing: '0.15em',
                margin: 0,
              }}
            >
              {isMyTurn ? 'Your Turn' : `${playerName}'s Turn`}
            </motion.h2>

            {isMyTurn && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  fontFamily: 'Crimson Text, serif',
                  fontStyle: 'italic',
                  color: '#8b7a8a',
                  fontSize: 14,
                  marginTop: 8,
                  letterSpacing: '0.05em',
                }}
              >
                Draw a card to begin
              </motion.p>
            )}

            {/* Bottom decorative line */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 60,
              height: 3,
              background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)',
            }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const GameBoard: React.FC = () => {
  const {
    players,
    currentPlayerIndex,
    message,
    winner,
    pendingAction,
    resetGame,
    resolvePendingAction,
  } = useGameStore()

  const { phase: multiplayerPhase, isReconnecting } = useMultiplayerStore()
  const bp = useBreakpoint()
  const { addEntry, clear } = useActionLog()
  const prevMessage = useRef<string>('')
  const prevWinner = useRef<string | null>(null)
  const { showTutorial, openTutorial, closeTutorial, shouldAutoShow } = useTutorial()
  const [tutorialAutoShown, setTutorialAutoShown] = useState(false)
  const phase = useGameStore((s) => s.phase)

  // Auto-show tutorial when game starts (phase becomes "playing")
  useEffect(() => {
    if (phase === 'playing' && !tutorialAutoShown && shouldAutoShow()) {
      setTutorialAutoShown(true)
      openTutorial()
    }
  }, [phase, tutorialAutoShown, shouldAutoShow, openTutorial])

  const currentPlayer = players[currentPlayerIndex]

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
          className="min-h-screen flex items-center justify-center p-4"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="rounded-3xl p-8 md:p-12 text-center"
            style={{
              background: 'linear-gradient(160deg, rgba(26,18,40,0.97), rgba(14,8,22,0.99))',
              border: `2px solid ${winClass?.color ?? '#c9a84c'}`,
              boxShadow: `0 0 60px ${winClass?.color ?? '#c9a84c'}44, 0 0 120px ${winClass?.color ?? '#c9a84c'}22`,
              maxWidth: 400,
              width: '100%',
            }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              style={{ fontSize: 64, marginBottom: 12 }}
            >
              {winClass?.emoji ?? '🏆'}
            </motion.div>
            <motion.h1
              animate={{ textShadow: ['0 0 10px #c9a84c44', '0 0 30px #c9a84caa', '0 0 10px #c9a84c44'] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ fontFamily: 'Cinzel Decorative, serif', fontSize: 32, color: '#c9a84c', margin: '0 0 8px 0' }}
            >
              Victory!
            </motion.h1>
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: winClass?.color ?? '#e8d5b7', marginBottom: 8 }}>
              {winPlayer?.name} wins!
            </p>
            <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#8b7a8a', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              {winPlayer?.name} completed {winPlayer?.completedRecipes.length} recipes
              and mastered the ancient arts of Alchemy.
            </p>
            <motion.button
              onClick={resetGame}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.97 }}
              className="brew-button"
              style={{
                padding: '12px 32px',
                borderRadius: 14,
                fontFamily: 'Cinzel, serif',
                fontWeight: 700,
                fontSize: 14,
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

  return (
    <>
      {/* Background */}
      <Background />

      {/* AAA Turn Transition */}
      <TurnTransitionBanner />

      {/* Tutorial overlay */}
      <AnimatePresence>
        {showTutorial && <Tutorial onClose={closeTutorial} />}
      </AnimatePresence>

      {/* Reconnecting overlay */}
      <AnimatePresence>
        {(isReconnecting || multiplayerPhase === 'reconnecting') && <ReconnectingOverlay />}
      </AnimatePresence>

      {/* Wisdom picker overlay */}
      {pendingAction?.kind === 'wisdom_pick' && (
        <WisdomPicker
          cards={pendingAction.cards}
          keep={pendingAction.keep}
          onPick={(kept) => resolvePendingAction({ kept })}
        />
      )}

      {/* Responsive layout */}
      <AnimatePresence mode="wait">
        <motion.div
          key={bp}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="h-screen w-screen overflow-hidden"
          style={{ position: 'relative', zIndex: 1 }}
        >
          {bp === 'mobile' && <MobileGameBoard />}
          {bp === 'tablet' && <TabletGameBoard />}
          {bp === 'desktop' && <DesktopGameBoard />}
        </motion.div>
      </AnimatePresence>
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 250 }}
        className="rounded-2xl p-5 flex flex-col gap-4 parchment"
        style={{
          border: '2px solid #8b5a9f',
          boxShadow: '0 0 40px #8b5a9f44',
          maxWidth: 500,
          width: '100%',
        }}
      >
        <h3 style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, color: '#8b5a9f', fontSize: 14, margin: 0 }}>
          📖 Scroll of Wisdom — Choose {keep} to keep
        </h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {cards.map((card) => (
            <div key={card.id} style={{ width: 76 }}>
              <CardComponent
                card={card}
                selected={selected.includes(card.id)}
                onClick={() => toggle(card.id)}
                compact
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center gap-3">
          <span style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#6b5a7a', fontSize: 12 }}>
            {selected.length}/{keep} selected
          </span>
          <motion.button
            onClick={() => onPick(selected)}
            disabled={selected.length !== keep}
            whileHover={selected.length === keep ? { scale: 1.05 } : {}}
            style={{
              padding: '8px 20px',
              borderRadius: 10,
              fontFamily: 'Cinzel, serif',
              fontWeight: 700,
              fontSize: 12,
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
