// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Mobile Game Board Layout
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { useMultiplayerStore } from '../store/multiplayerStore'
import { getClass } from '../data/classes'
import { CardComponent } from '../components/Card'
import { ConnectionStatus } from '../components/ConnectionStatus'
import type { Card, SpellCard, RecipeCard, ManaType } from '../types/game'
import { MANA_COLORS } from '../data/cards'

// ── Mana Assignment Modal ───────────────────────────────────────────────────
const ManaAssignModal: React.FC<{
  recipe: RecipeCard
  manaPool: Record<ManaType, number>
  onAssign: (type: ManaType) => void
  onClose: () => void
}> = ({ recipe, manaPool, onAssign, onClose }) => {
  // Find mana types that are still needed and available
  const availableAssignments = recipe.progress
    .filter(p => p.contributed < p.required)
    .filter(p => {
      const available = p.manaType === 'Any'
        ? Object.values(manaPool).reduce((a, b) => a + b, 0)
        : (manaPool[p.manaType] ?? 0) + (manaPool.Any ?? 0)
      return available > 0
    })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, rgba(26,18,40,0.98), rgba(14,8,22,0.99))',
          border: '2px solid #8b5a9f',
          borderRadius: 16,
          padding: 16,
          maxWidth: 280,
          width: '100%',
        }}
      >
        <h3 style={{
          fontFamily: 'Cinzel, serif',
          fontSize: 14,
          fontWeight: 700,
          color: '#e8d5b7',
          marginBottom: 8,
          textAlign: 'center',
        }}>
          Brew: {recipe.name}
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          marginBottom: 12,
        }}>
          {availableAssignments.map((p) => {
            const color = MANA_COLORS[p.manaType] || '#6b5a7a'
            const available = p.manaType === 'Any'
              ? Object.values(manaPool).reduce((a, b) => a + b, 0)
              : (manaPool[p.manaType] ?? 0) + (manaPool.Any ?? 0)

            return (
              <motion.button
                key={p.manaType}
                onClick={() => onAssign(p.manaType)}
                whileTap={{ scale: 0.96 }}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${color}44, ${color}22)`,
                  border: `1px solid ${color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: 12,
                  fontWeight: 700,
                  color: color,
                }}>
                  {p.manaType}
                </span>
                <span style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: 11,
                  color: '#8b7a8a',
                }}>
                  {p.contributed}/{p.required} ({available} avail)
                </span>
              </motion.button>
            )
          })}
        </div>

        {availableAssignments.length === 0 && (
          <p style={{
            fontFamily: 'Crimson Text, serif',
            fontStyle: 'italic',
            fontSize: 12,
            color: '#6b5a7a',
            textAlign: 'center',
            marginBottom: 12,
          }}>
            No mana available to assign
          </p>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: 8,
            fontFamily: 'Cinzel, serif',
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
    </motion.div>
  )
}

// ── Compact Recipe Card ─────────────────────────────────────────────────────
const CompactRecipeCard: React.FC<{
  recipe: RecipeCard
  manaPool: Record<ManaType, number>
  onAssignMana: (manaType: ManaType) => void
  isActive: boolean
}> = ({ recipe, manaPool, onAssignMana, isActive }) => {
  const [showModal, setShowModal] = useState(false)
  const totalRequired = recipe.progress.reduce((s, p) => s + p.required, 0)
  const totalContributed = recipe.progress.reduce((s, p) => s + p.contributed, 0)
  const progressPct = totalRequired > 0 ? (totalContributed / totalRequired) * 100 : 0
  const isComplete = totalContributed >= totalRequired

  return (
    <>
      <motion.div
        onClick={() => isActive && !isComplete && setShowModal(true)}
        whileTap={isActive && !isComplete ? { scale: 0.96 } : {}}
        style={{
          borderRadius: 10,
          padding: 8,
          cursor: isActive && !isComplete ? 'pointer' : 'default',
          background: isComplete ? 'rgba(201,168,76,0.08)' : 'rgba(20,12,32,0.9)',
          border: `1px solid ${isComplete ? '#c9a84c' : '#4a3a5a'}`,
        }}
      >
        {/* Recipe name */}
        <div style={{
          fontFamily: 'Cinzel, serif',
          fontSize: 9,
          fontWeight: 700,
          color: isComplete ? '#c9a84c' : '#e8d5b7',
          marginBottom: 4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {isComplete ? '✓ ' : ''}{recipe.name}
        </div>

        {/* Progress bar */}
        <div style={{
          height: 4,
          borderRadius: 2,
          background: '#2a1a3a',
          marginBottom: 4,
          overflow: 'hidden',
        }}>
          <motion.div
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
            style={{
              height: '100%',
              borderRadius: 2,
              background: isComplete ? '#c9a84c' : 'linear-gradient(90deg, #8b5a9f, #4d9f5d)',
              boxShadow: '0 0 6px #8b5a9f88',
            }}
          />
        </div>

        {/* Mana progress pips */}
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {recipe.progress.flatMap((p, i) => {
            const color = MANA_COLORS[p.manaType] || '#6b5a7a'
            return Array.from({ length: p.required }).map((_, j) => (
              <div
                key={`${i}-${j}`}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: j < p.contributed
                    ? `radial-gradient(circle at 35% 35%, ${color}ff, ${color}88)`
                    : 'transparent',
                  border: `1px solid ${color}88`,
                  boxShadow: j < p.contributed ? `0 0 4px ${color}88` : 'none',
                }}
              />
            ))
          })}
        </div>

        {/* Tap hint */}
        {isActive && !isComplete && (
          <div style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 7,
            color: '#8b5a9f',
            marginTop: 3,
            textAlign: 'right',
          }}>
            tap to brew →
          </div>
        )}
      </motion.div>

      {/* Mana assignment modal */}
      <AnimatePresence>
        {showModal && (
          <ManaAssignModal
            recipe={recipe}
            manaPool={manaPool}
            onAssign={(type) => {
              onAssignMana(type)
              setShowModal(false)
            }}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ── Main Mobile Layout ─────────────────────────────────────────────────────
export const MobileGameBoard: React.FC = () => {
  const {
    players,
    currentPlayerIndex,
    turnPhase,
    marketRow,
    mainDeck,
    discardPile,
    drawCard,
    playIngredient,
    castSpell,
    assignManaToRecipe,
    resolvePendingAction,
    endTurn,
  } = useGameStore()
  const { myPlayerId, phase: mpPhase } = useMultiplayerStore()

  const currentPlayer = players[currentPlayerIndex]
  const opponents = players.filter((_, i) => i !== currentPlayerIndex)

  // Determine if it's my turn
  const isMyTurn = currentPlayer?.id === myPlayerId || mpPhase === 'idle'
  const canDraw = turnPhase === 'draw' && isMyTurn
  const canAct = turnPhase === 'action' && isMyTurn
  const canEndTurn = canAct

  // Hand state
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [targetMode, setTargetMode] = useState<string | null>(null)

  const allHandCards = currentPlayer
    ? [...currentPlayer.hand, ...currentPlayer.spellDeck]
    : []

  const selectedCardData = allHandCards.find((c) => c.id === selectedCard)

  // YOUR TURN banner
  const [showYourTurn, setShowYourTurn] = useState(false)
  const prevTurnRef = useRef(currentPlayerIndex)

  useEffect(() => {
    if (
      mpPhase === 'playing' &&
      prevTurnRef.current !== currentPlayerIndex &&
      turnPhase === 'draw' &&
      isMyTurn
    ) {
      setShowYourTurn(true)
      const timer = setTimeout(() => setShowYourTurn(false), 1500)
      return () => clearTimeout(timer)
    }
    prevTurnRef.current = currentPlayerIndex
  }, [currentPlayerIndex, turnPhase, isMyTurn, mpPhase])

  // Phase styling
  const phaseColor = { draw: '#4d9f5d', action: '#8b5a9f', end: '#c9a84c' }[turnPhase]
  const phaseLabel = { draw: 'Draw', action: 'Action', end: 'End' }[turnPhase]

  // Card actions
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

  const handlePlay = () => {
    if (!selectedCardData || !canAct) return

    if (selectedCardData.type === 'ingredient') {
      playIngredient(selectedCardData.id)
      setSelectedCard(null)
    } else if (selectedCardData.type === 'spell') {
      const spell = selectedCardData as SpellCard
      const needsTarget = [
        'steal_ingredient',
        'discard_random',
        'destroy_ingredient',
        'show_hand_steal',
        'hex',
        'swap_hands',
        'shadowweave',
        'drain',
      ].includes(spell.effect.kind)
      if (needsTarget && opponents.length > 0) {
        setTargetMode(selectedCardData.id)
      } else {
        castSpell(selectedCardData.id)
        setSelectedCard(null)
      }
    } else if (selectedCardData.type === 'scroll') {
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

  if (!currentPlayer) {
    return (
      <div
        style={{
          height: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0510',
          color: '#6b5a7a',
          fontFamily: 'Cinzel, serif',
        }}
      >
        Loading game...
      </div>
    )
  }

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        background: '#0a0510',
      }}
    >
      {/* YOUR TURN Banner */}
      <AnimatePresence>
        {showYourTurn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              pointerEvents: 'none',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 8 }}>⚗️</div>
              <div
                style={{
                  fontFamily: 'Cinzel Decorative, serif',
                  fontSize: 32,
                  color: '#c9a84c',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textShadow: '0 0 30px #c9a84c88',
                }}
              >
                YOUR TURN
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER (44px)
         ═══════════════════════════════════════════════════════════════════════ */}
      <header
        style={{
          height: 44,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          background: 'rgba(8,4,16,0.98)',
          borderBottom: '1px solid #3a2a4a',
        }}
      >
        {/* Left: logo */}
        <span
          style={{
            fontFamily: 'Cinzel Decorative, serif',
            fontSize: 13,
            color: '#c9a84c',
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          ⚗️ Alchemy
        </span>

        {/* Center: whose turn + phase */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 9,
              color: phaseColor,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {currentPlayer.name}'s {phaseLabel}
          </span>
        </div>

        {/* Right: end turn button or connection status */}
        {canEndTurn ? (
          <motion.button
            onClick={endTurn}
            animate={{
              boxShadow: [
                '0 0 6px #4d9f5d44',
                '0 0 14px #4d9f5d88',
                '0 0 6px #4d9f5d44',
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              background: '#4d9f5d22',
              border: '1px solid #4d9f5d',
              color: '#4d9f5d',
              fontFamily: 'Cinzel, serif',
              fontWeight: 700,
              fontSize: 9,
              cursor: 'pointer',
            }}
          >
            End Turn
          </motion.button>
        ) : (
          <ConnectionStatus />
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          OPPONENT STRIP (64px)
         ═══════════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          height: 64,
          flexShrink: 0,
          padding: '6px 8px',
          borderBottom: '1px solid #3a2a4a33',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto',
        }}
      >
        {opponents.map((opp) => {
          const cls = getClass(opp.classId)
          return (
            <div
              key={opp.id}
              onClick={targetMode ? () => handleTargetPlayer(opp.id) : undefined}
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 20,
                background: targetMode ? 'rgba(139,90,159,0.2)' : 'rgba(20,12,32,0.9)',
                border: `1px solid ${targetMode ? '#8b5a9f' : (cls?.color ?? '#4a3a5a') + '44'}`,
                cursor: targetMode ? 'pointer' : 'default',
              }}
            >
              <span style={{ fontSize: 18 }}>{cls?.emoji}</span>
              <div>
                <div
                  style={{
                    fontFamily: 'Cinzel, serif',
                    fontSize: 9,
                    color: cls?.color ?? '#8b7a8a',
                    fontWeight: 700,
                  }}
                >
                  {opp.name}
                </div>
                <div
                  style={{
                    fontFamily: 'Cinzel, serif',
                    fontSize: 8,
                    color: '#6b5a7a',
                  }}
                >
                  🃏{opp.hand.length} · ✓{opp.completedRecipes.length}
                </div>
              </div>
            </div>
          )
        })}
        {opponents.length === 0 && (
          <span
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 9,
              color: '#4a3a5a',
              fontStyle: 'italic',
            }}
          >
            Waiting for opponents...
          </span>
        )}
        {targetMode && (
          <button
            onClick={() => {
              setTargetMode(null)
              setSelectedCard(null)
            }}
            style={{
              marginLeft: 'auto',
              padding: '4px 8px',
              borderRadius: 8,
              fontFamily: 'Cinzel, serif',
              fontSize: 8,
              color: '#d4774a',
              background: 'transparent',
              border: '1px solid #d4774a44',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          MARKET STRIP (120px)
         ═══════════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          height: 120,
          flexShrink: 0,
          padding: '6px 8px',
          borderBottom: '1px solid #3a2a4a33',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 4 }}>
          <span
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 7,
              letterSpacing: '0.1em',
              color: '#5a4a6a',
              textTransform: 'uppercase',
            }}
          >
            Market · {mainDeck.length} in deck
          </span>
        </div>

        {/* Horizontal scroll row */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 4,
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Draw pile */}
          <motion.button
            onClick={() => canDraw && drawCard(undefined)}
            disabled={!canDraw}
            whileTap={canDraw ? { scale: 0.95 } : {}}
            style={{
              flexShrink: 0,
              width: 56,
              height: 84,
              borderRadius: 8,
              scrollSnapAlign: 'start',
              background: 'linear-gradient(160deg, #1a0d2a, #0d0818)',
              border: `2px solid ${canDraw ? '#4d9f5d' : '#3a2a4a'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: canDraw ? 'pointer' : 'not-allowed',
            }}
          >
            <span style={{ fontSize: 18 }}>⚗️</span>
            <span
              style={{
                fontFamily: 'Cinzel, serif',
                fontSize: 7,
                color: canDraw ? '#4d9f5d' : '#3a2a4a',
                fontWeight: 700,
              }}
            >
              DRAW
            </span>
            <span
              style={{
                fontFamily: 'Cinzel, serif',
                fontSize: 7,
                color: '#6b5a7a',
              }}
            >
              {mainDeck.length}
            </span>
          </motion.button>

          {/* Market cards - MUST BE HORIZONTAL, 64px wide each */}
          {marketRow.map((card, i) => (
            <div
              key={card.id}
              onClick={() => canDraw && drawCard(i)}
              style={{
                flexShrink: 0,
                width: 64,
                height: 96,
                scrollSnapAlign: 'start',
                cursor: canDraw ? 'pointer' : 'default',
              }}
            >
              <CardComponent card={card} disabled={!canDraw} compact size="xs" />
            </div>
          ))}

          {/* Discard pile */}
          <div
            style={{
              flexShrink: 0,
              width: 40,
              height: 60,
              borderRadius: 8,
              background: 'rgba(14,8,22,0.6)',
              border: '1px solid #3a2a4a',
              scrollSnapAlign: 'start',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
            }}
          >
            <span style={{ fontSize: 12 }}>🗑️</span>
            <span
              style={{
                fontFamily: 'Cinzel, serif',
                fontSize: 7,
                color: '#6b5a7a',
              }}
            >
              {discardPile.length}
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CAULDRON AREA (flex-1, overflow-y-auto inside)
         ═══════════════════════════════════════════════════════════════════════ */}
      <section style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '6px 8px' }}>
        {/* Cauldron header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <motion.span
            animate={{
              filter: [
                'drop-shadow(0 0 4px #8b5a9f44)',
                'drop-shadow(0 0 10px #8b5a9f88)',
                'drop-shadow(0 0 4px #8b5a9f44)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize: 20 }}
          >
            ⚗️
          </motion.span>
          <span
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 9,
              letterSpacing: '0.1em',
              color: '#8b5a9f',
              textTransform: 'uppercase',
            }}
          >
            Recipes
          </span>
          <span
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 8,
              color: '#4a3a5a',
              marginLeft: 'auto',
            }}
          >
            {currentPlayer.completedRecipes.length} complete
          </span>
        </div>

        {/* Recipe grid: 2 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {currentPlayer.recipes.map((recipe) => (
            <CompactRecipeCard
              key={recipe.id}
              recipe={recipe}
              manaPool={currentPlayer.manaPool}
              onAssignMana={(manaType) => assignManaToRecipe(recipe.id, manaType, 1)}
              isActive={canAct}
            />
          ))}
        </div>

        {/* Completed recipes mini-row */}
        {currentPlayer.completedRecipes.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {currentPlayer.completedRecipes.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: '#c9a84c22',
                  border: '1px solid #c9a84c44',
                  fontFamily: 'Cinzel, serif',
                  fontSize: 7,
                  color: '#c9a84c',
                }}
              >
                ✓ {r.name}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          MANA BAR (40px)
         ═══════════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          height: 40,
          flexShrink: 0,
          padding: '0 10px',
          borderTop: '1px solid #3a2a4a33',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(8,4,16,0.9)',
          overflowX: 'auto',
        }}
      >
        <span
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 7,
            color: '#4a3a5a',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            flexShrink: 0,
          }}
        >
          Mana
        </span>

        {/* Render orbs for each mana in pool */}
        {Object.entries(currentPlayer.manaPool).flatMap(([type, count]) =>
          count > 0
            ? Array.from({ length: count }).map((_, i) => {
                const color = MANA_COLORS[type as ManaType] || '#6b5a7a'
                return (
                  <motion.div
                    key={`${type}-${i}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: `radial-gradient(circle at 35% 35%, ${color}ff, ${color}66)`,
                      boxShadow: `0 0 6px ${color}66, inset 0 1px 2px rgba(255,255,255,0.2)`,
                      border: `1px solid ${color}88`,
                    }}
                  />
                )
              })
            : []
        )}

        {/* Empty state */}
        {Object.values(currentPlayer.manaPool).every((v) => v === 0) && (
          <span
            style={{
              fontFamily: 'Crimson Text, serif',
              fontStyle: 'italic',
              fontSize: 11,
              color: '#3a2a4a',
            }}
          >
            No mana
          </span>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          HAND STRIP (165px fixed, ALWAYS VISIBLE)
         ═══════════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          height: 165,
          flexShrink: 0,
          background: 'rgba(6,3,12,0.98)',
          borderTop: '2px solid #3a2a4a',
        }}
      >
        {/* Drag handle + label */}
        <div
          style={{
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '0 12px',
          }}
        >
          <span
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 7,
              color: '#4a3a5a',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Hand ({currentPlayer.hand.length + currentPlayer.spellDeck.length})
          </span>
          {/* Show selected card action button if card selected */}
          {selectedCard && canAct && !targetMode && (
            <motion.button
              onClick={handlePlay}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.94 }}
              style={{
                padding: '2px 10px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #4d9f5d, #2d7f3d)',
                border: '1px solid #4d9f5d',
                color: '#fff',
                fontFamily: 'Cinzel, serif',
                fontWeight: 700,
                fontSize: 8,
                cursor: 'pointer',
              }}
            >
              ▶ Play
            </motion.button>
          )}
          {targetMode && (
            <span
              style={{
                fontFamily: 'Cinzel, serif',
                fontSize: 8,
                color: '#8b5a9f',
                fontWeight: 700,
              }}
            >
              🎯 Select target above
            </span>
          )}
        </div>

        {/* Card scroll area - 145px */}
        <div
          style={{
            height: 145,
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            padding: '0 12px 8px 12px',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            alignItems: 'flex-end',
          }}
        >
          {allHandCards.map((card) => (
            <motion.div
              key={card.id}
              onClick={() => handleCardClick(card)}
              animate={{ y: selectedCard === card.id ? -16 : 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{
                flexShrink: 0,
                width: 76,
                height: 114,
                scrollSnapAlign: 'start',
                cursor: canAct ? 'pointer' : 'default',
                filter:
                  selectedCard === card.id ? 'drop-shadow(0 0 8px #c9a84c88)' : 'none',
              }}
            >
              <CardComponent
                card={card}
                selected={selectedCard === card.id}
                compact
                size="sm"
              />
            </motion.div>
          ))}

          {allHandCards.length === 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                fontFamily: 'Crimson Text, serif',
                fontStyle: 'italic',
                color: '#3a2a4a',
                fontSize: 13,
              }}
            >
              Draw cards to fill your hand
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default MobileGameBoard
