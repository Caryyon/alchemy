// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Mobile Game Board Layout
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useDragControls, type PanInfo } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { useMultiplayerStore } from '../store/multiplayerStore'
import { getClass } from '../data/classes'
import { CharacterCard } from '../components/CharacterCard'
import { TableCenter } from '../components/TableCenter'
import { ManaDisplay } from '../components/ManaDisplay'
import { CardComponent } from '../components/Card'
import { ConnectionStatus } from '../components/ConnectionStatus'
import type { Card, IngredientCard, SpellCard } from '../types/game'
import { MANA_COLORS } from '../data/cards'

const MANA_EMOJIS: Record<string, string> = {
  Fire: '🔥',
  Nature: '🌿',
  Lunar: '🌙',
  Arcane: '🔮',
  Shadow: '🕷️',
  Any: '✦',
}

// ── Mobile Header ──────────────────────────────────────────────────────────
const MobileHeader: React.FC = () => {
  const { turnPhase, players, currentPlayerIndex } = useGameStore()
  const currentPlayer = players[currentPlayerIndex]
  const currentClass = currentPlayer ? getClass(currentPlayer.classId) : null

  const turnPhaseLabel = { draw: 'DRAW', action: 'ACTION', end: 'END' }[turnPhase]
  const turnPhaseColor = { draw: '#4d9f5d', action: '#8b5a9f', end: '#c9a84c' }[turnPhase]
  const turnPhaseEmoji = { draw: '🃏', action: '⚡', end: '🌙' }[turnPhase]

  return (
    <header
      className="flex items-center justify-between flex-shrink-0"
      style={{
        padding: '6px 10px',
        background: 'rgba(10,5,18,0.95)',
        borderBottom: '1px solid #4a3a5a',
        backdropFilter: 'blur(8px)',
        height: 44,
      }}
    >
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 16, filter: 'drop-shadow(0 0 6px #4d9f5d88)' }}>⚗️</span>
        <span style={{ fontFamily: 'Cinzel Decorative, serif', fontWeight: 700, fontSize: 12, color: '#c9a84c' }}>
          Alchemy
        </span>
      </div>

      <motion.div
        animate={{ boxShadow: [`0 0 4px ${turnPhaseColor}44`, `0 0 10px ${turnPhaseColor}88`, `0 0 4px ${turnPhaseColor}44`] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{
          padding: '2px 8px',
          borderRadius: 14,
          background: turnPhaseColor + '22',
          color: turnPhaseColor,
          border: `1px solid ${turnPhaseColor}`,
          fontFamily: 'Cinzel, serif',
          fontWeight: 700,
          fontSize: 8,
          letterSpacing: '0.1em',
        }}
      >
        {turnPhaseEmoji} {turnPhaseLabel}
      </motion.div>

      <div className="flex items-center gap-2">
        <ConnectionStatus />
        <div className="flex items-center gap-1">
          <span style={{ fontSize: 12, filter: `drop-shadow(0 0 3px ${currentClass?.color}88)` }}>
            {currentClass?.emoji}
          </span>
          <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, color: currentClass?.color, fontSize: 10 }}>
            {currentPlayer?.name}
          </span>
        </div>
      </div>
    </header>
  )
}

// ── Opponent Strip ─────────────────────────────────────────────────────────
const OpponentStrip: React.FC = () => {
  const { players, currentPlayerIndex } = useGameStore()
  const opponents = players.filter((_, i) => i !== currentPlayerIndex)

  if (opponents.length === 0) return null

  return (
    <section
      className="flex-shrink-0"
      style={{ padding: '6px 8px', borderBottom: '1px solid #4a3a5a22' }}
    >
      <p style={{
        fontFamily: 'Cinzel, serif',
        fontSize: 7,
        letterSpacing: '0.12em',
        color: '#4a3a5a',
        textTransform: 'uppercase',
        marginBottom: 4,
      }}>
        Opponents
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollSnapType: 'x mandatory' }}>
        {opponents.map((p) => (
          <div key={p.id} style={{ flexShrink: 0, scrollSnapAlign: 'start' }}>
            <CharacterCard player={p} isActive={false} compact />
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Market Row (Compact) ───────────────────────────────────────────────────
const CompactMarketRow: React.FC = () => {
  const { marketRow, mainDeck, discardPile, drawCard, turnPhase } = useGameStore()
  const canDraw = turnPhase === 'draw'

  return (
    <section
      className="flex-shrink-0"
      style={{ padding: '6px 8px', borderBottom: '1px solid #4a3a5a22' }}
    >
      <p style={{
        fontFamily: 'Cinzel, serif',
        fontSize: 7,
        letterSpacing: '0.12em',
        color: '#6b5a7a',
        textTransform: 'uppercase',
        marginBottom: 4,
      }}>
        Market · {mainDeck.length} deck
      </p>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1" style={{ scrollSnapType: 'x mandatory' }}>
        {/* Draw deck */}
        <motion.button
          onClick={() => canDraw && drawCard(undefined)}
          disabled={!canDraw || mainDeck.length === 0}
          whileHover={canDraw ? { scale: 1.05 } : {}}
          whileTap={canDraw ? { scale: 0.95 } : {}}
          className="flex-shrink-0 rounded-lg overflow-hidden card-back-gradient flex flex-col items-center justify-center"
          style={{
            width: 50,
            height: 75,
            border: `2px solid ${canDraw ? '#4d9f5d' : '#4a3a5a'}`,
            cursor: canDraw ? 'pointer' : 'not-allowed',
            scrollSnapAlign: 'start',
          }}
        >
          <span style={{ fontSize: 14 }}>⚗️</span>
          <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 7, color: canDraw ? '#4d9f5d' : '#4a3a5a' }}>
            Draw
          </span>
        </motion.button>

        {/* Market cards */}
        {marketRow.map((card, i) => (
          <motion.div
            key={card.id}
            onClick={() => canDraw && drawCard(i)}
            style={{ width: 70, height: 105, flexShrink: 0, scrollSnapAlign: 'start', cursor: canDraw ? 'pointer' : 'default' }}
          >
            <CardComponent card={card} disabled={!canDraw} compact />
          </motion.div>
        ))}

        {/* Discard */}
        <div
          className="flex-shrink-0 rounded-lg flex flex-col items-center justify-center"
          style={{
            width: 40,
            height: 60,
            background: 'rgba(14,8,22,0.6)',
            border: '1px solid #4a3a5a',
            scrollSnapAlign: 'start',
          }}
        >
          <span style={{ fontSize: 12 }}>🗑️</span>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 8, color: '#6b5a7a' }}>{discardPile.length}</span>
        </div>
      </div>
    </section>
  )
}

// ── Cauldron Area ──────────────────────────────────────────────────────────
const CauldronArea: React.FC = () => {
  const { players, currentPlayerIndex } = useGameStore()
  const currentPlayer = players[currentPlayerIndex]

  if (!currentPlayer) return null

  return (
    <section
      className="flex-1 overflow-y-auto"
      style={{ padding: '8px', minHeight: 0 }}
    >
      <TableCenter
        recipes={currentPlayer.recipes}
        completedRecipes={currentPlayer.completedRecipes}
        marketCards={[]}
        deckSize={0}
        discardSize={0}
        playerId={currentPlayer.id}
        isActive={true}
        manaPool={currentPlayer.manaPool}
      />
    </section>
  )
}

// ── Compact Mana Bar ───────────────────────────────────────────────────────
const CompactManaBar: React.FC = () => {
  const { players, currentPlayerIndex } = useGameStore()
  const currentPlayer = players[currentPlayerIndex]

  if (!currentPlayer) return null

  return (
    <section
      className="flex-shrink-0"
      style={{
        padding: '4px 10px',
        background: 'rgba(10,5,18,0.9)',
        borderTop: '1px solid #4a3a5a22',
        borderBottom: '1px solid #4a3a5a22',
      }}
    >
      <ManaDisplay pool={currentPlayer.manaPool} isActive={true} size="sm" />
    </section>
  )
}

// ── Mobile Hand (Bottom Sheet) ─────────────────────────────────────────────
const MobileHand: React.FC = () => {
  const { players, currentPlayerIndex, turnPhase, playIngredient, castSpell, resolvePendingAction, endTurn } = useGameStore()
  const currentPlayer = players[currentPlayerIndex]
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [sheetHeight, setSheetHeight] = useState(180)
  const [targetMode, setTargetMode] = useState<string | null>(null)
  const dragControls = useDragControls()

  const minHeight = 180
  const maxHeight = typeof window !== 'undefined' ? window.innerHeight * 0.65 : 500

  const handleDragEnd = (_: any, info: PanInfo) => {
    const newHeight = sheetHeight - info.offset.y
    if (newHeight < (minHeight + maxHeight) / 2) {
      setSheetHeight(minHeight)
    } else {
      setSheetHeight(maxHeight)
    }
  }

  if (!currentPlayer) return null

  const canAct = turnPhase === 'action'
  const selectedCardData = [...currentPlayer.hand, ...currentPlayer.spellDeck].find(c => c.id === selectedCard)
  const otherPlayers = players.filter((_, i) => i !== currentPlayerIndex)

  const handleCardClick = (card: Card) => {
    if (!canAct) return
    if (selectedCard === card.id) {
      setSelectedCard(null)
      setTargetMode(null)
      return
    }
    setSelectedCard(card.id)
    setTargetMode(null)
  }

  const handlePlayIngredient = () => {
    if (selectedCardData?.type === 'ingredient') {
      playIngredient(selectedCardData.id)
      setSelectedCard(null)
    }
  }

  const handleCastSpell = () => {
    if (selectedCardData?.type === 'spell') {
      const spell = selectedCardData as SpellCard
      const needsTarget = ['steal_ingredient', 'discard_random', 'destroy_ingredient', 'show_hand_steal', 'hex', 'swap_hands', 'shadowweave', 'drain'].includes(spell.effect.kind)
      if (needsTarget) {
        setTargetMode(selectedCardData.id)
        return
      }
      castSpell(selectedCardData.id)
      setSelectedCard(null)
    }
  }

  const handleUseScroll = () => {
    if (selectedCardData?.type === 'scroll') {
      resolvePendingAction({ scrollCardId: selectedCardData.id })
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

  return (
    <motion.section
      className="flex-shrink-0"
      style={{
        height: sheetHeight,
        background: 'linear-gradient(180deg, rgba(26,18,40,0.98), rgba(14,8,22,0.99))',
        borderTop: '1px solid #4a3a5a',
        borderRadius: '16px 16px 0 0',
        overflow: 'hidden',
      }}
    >
      {/* Drag handle */}
      <motion.div
        drag="y"
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        className="flex justify-center py-2 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#4a3a5a' }} />
      </motion.div>

      {/* Target selection */}
      <AnimatePresence>
        {targetMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2 flex-wrap items-center px-3 pb-2"
          >
            <span style={{ fontFamily: 'Cinzel, serif', color: '#8b5a9f', fontSize: 10, fontWeight: 700 }}>
              🎯 Target:
            </span>
            {otherPlayers.map((p) => (
              <motion.button
                key={p.id}
                onClick={() => handleTargetPlayer(p.id)}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 14,
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 700,
                  fontSize: 10,
                  background: 'linear-gradient(135deg, #8b5a9fcc, #8b5a9f88)',
                  color: '#fff',
                  border: '1px solid #8b5a9f',
                  cursor: 'pointer',
                }}
              >
                {p.name}
              </motion.button>
            ))}
            <button
              onClick={() => { setTargetMode(null); setSelectedCard(null) }}
              style={{
                padding: '4px 8px',
                borderRadius: 14,
                fontFamily: 'Crimson Text, serif',
                fontSize: 10,
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
            className="flex items-center gap-2 flex-wrap px-3 pb-2"
          >
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: '#4d9f5d', fontWeight: 600 }}>
              {selectedCardData.name}:
            </span>

            {selectedCardData.type === 'ingredient' && (
              <motion.button
                onClick={handlePlayIngredient}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 14,
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 700,
                  fontSize: 9,
                  background: `linear-gradient(135deg, ${MANA_COLORS[(selectedCardData as IngredientCard).manaType]}cc, ${MANA_COLORS[(selectedCardData as IngredientCard).manaType]}88)`,
                  color: '#fff',
                  border: `1px solid ${MANA_COLORS[(selectedCardData as IngredientCard).manaType]}`,
                  cursor: 'pointer',
                }}
              >
                {MANA_EMOJIS[(selectedCardData as IngredientCard).manaType]} Play
              </motion.button>
            )}

            {selectedCardData.type === 'spell' && (
              <motion.button
                onClick={handleCastSpell}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 14,
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 700,
                  fontSize: 9,
                  background: 'linear-gradient(135deg, #8b5a9fcc, #8b5a9f88)',
                  color: '#fff',
                  border: '1px solid #8b5a9f',
                  cursor: 'pointer',
                }}
              >
                ✨ Cast
              </motion.button>
            )}

            {selectedCardData.type === 'scroll' && (
              <motion.button
                onClick={handleUseScroll}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 14,
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 700,
                  fontSize: 9,
                  background: 'linear-gradient(135deg, #c9a84ccc, #c9a84c88)',
                  color: '#fff',
                  border: '1px solid #c9a84c',
                  cursor: 'pointer',
                }}
              >
                📜 Use
              </motion.button>
            )}

            <button
              onClick={() => setSelectedCard(null)}
              style={{
                padding: '4px 8px',
                borderRadius: 14,
                fontFamily: 'Crimson Text, serif',
                fontSize: 10,
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

      {/* Hand cards */}
      <div
        className="flex items-end gap-2 overflow-x-auto px-3 pb-2"
        style={{ scrollSnapType: 'x mandatory', flex: 1 }}
      >
        {currentPlayer.hand.length === 0 ? (
          <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#4a3a5a', fontSize: 11 }}>
            Hand empty
          </p>
        ) : (
          currentPlayer.hand.map((card) => (
            <motion.div
              key={card.id}
              animate={{
                y: selectedCard === card.id ? -8 : 0,
                scale: selectedCard === card.id ? 1.05 : 1,
              }}
              style={{ flexShrink: 0, scrollSnapAlign: 'start', width: 80, height: 120 }}
            >
              <CardComponent
                card={card}
                onClick={canAct ? () => handleCardClick(card) : undefined}
                selected={selectedCard === card.id}
                disabled={!canAct}
                compact
              />
            </motion.div>
          ))
        )}

        {/* End Turn button */}
        <motion.button
          onClick={endTurn}
          disabled={turnPhase === 'draw'}
          whileTap={turnPhase !== 'draw' ? { scale: 0.96 } : {}}
          className="flex-shrink-0"
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            fontFamily: 'Cinzel, serif',
            fontWeight: 700,
            fontSize: 10,
            background: turnPhase !== 'draw' ? 'linear-gradient(135deg, #2a7a3d, #4d9f5d)' : '#2a1a3a',
            color: turnPhase !== 'draw' ? '#fff' : '#4a3a5a',
            border: `2px solid ${turnPhase !== 'draw' ? '#4d9f5d' : '#4a3a5a'}`,
            cursor: turnPhase !== 'draw' ? 'pointer' : 'not-allowed',
            scrollSnapAlign: 'start',
            alignSelf: 'center',
          }}
        >
          End →
        </motion.button>
      </div>

      {/* Spell deck */}
      {currentPlayer.spellDeck.length > 0 && (
        <div className="px-3 pb-2">
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: 8, color: '#8b5a9f', textTransform: 'uppercase', marginBottom: 4 }}>
            ✨ Spells
          </p>
          <div className="flex gap-1.5 overflow-x-auto" style={{ scrollSnapType: 'x mandatory' }}>
            {currentPlayer.spellDeck.map((card) => (
              <motion.div
                key={card.id}
                animate={{ y: selectedCard === card.id ? -6 : 0, scale: selectedCard === card.id ? 1.05 : 1 }}
                style={{ flexShrink: 0, scrollSnapAlign: 'start', width: 70, height: 100 }}
              >
                <CardComponent
                  card={card}
                  onClick={canAct ? () => handleCardClick(card) : undefined}
                  selected={selectedCard === card.id}
                  disabled={!canAct}
                  compact
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  )
}

// ── Turn Announcement Overlay ──────────────────────────────────────────────
const TurnAnnouncement: React.FC = () => {
  const { players, currentPlayerIndex, turnPhase } = useGameStore()
  const { myPlayerId, phase } = useMultiplayerStore()
  const [show, setShow] = useState(false)
  const prevTurnRef = useRef(currentPlayerIndex)

  const currentPlayer = players[currentPlayerIndex]
  const isMyTurn = currentPlayer?.id === myPlayerId

  useEffect(() => {
    if (phase === 'playing' && prevTurnRef.current !== currentPlayerIndex && turnPhase === 'draw') {
      if (isMyTurn) {
        setShow(true)
        const timer = setTimeout(() => setShow(false), 1500)
        return () => clearTimeout(timer)
      }
    }
    prevTurnRef.current = currentPlayerIndex
  }, [currentPlayerIndex, turnPhase, isMyTurn, phase])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.8)' }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <h1
              style={{
                fontFamily: 'Cinzel Decorative, serif',
                fontSize: 36,
                fontWeight: 900,
                color: '#c9a84c',
                textShadow: '0 0 40px #c9a84c88, 0 0 80px #c9a84c44',
                textAlign: 'center',
              }}
            >
              YOUR TURN
            </h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Main Mobile Layout ─────────────────────────────────────────────────────
export const MobileGameBoard: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: '#0d0d0d' }}>
      <TurnAnnouncement />
      <MobileHeader />
      <OpponentStrip />
      <CompactMarketRow />
      <CauldronArea />
      <CompactManaBar />
      <MobileHand />
    </div>
  )
}

export default MobileGameBoard
