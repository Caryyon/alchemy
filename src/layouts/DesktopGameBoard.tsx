// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Desktop Game Board Layout
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { useMultiplayerStore } from '../store/multiplayerStore'
import { getClass } from '../data/classes'
import { CharacterCard } from '../components/CharacterCard'
import { RecipeProgressPips } from '../components/ManaDisplay'
import { CardComponent } from '../components/Card'
import { ConnectionStatus } from '../components/ConnectionStatus'
import ActionLog from '../components/ActionLog'
import type { Card, ManaType, IngredientCard, SpellCard, RecipeCard, Player } from '../types/game'
import { MANA_COLORS } from '../data/cards'

const MANA_EMOJIS: Record<string, string> = {
  Fire: '🔥',
  Nature: '🌿',
  Lunar: '🌙',
  Arcane: '🔮',
  Shadow: '🕷️',
  Any: '✦',
}

// ── Opponent Panel Card ────────────────────────────────────────────────────
const OpponentPanel: React.FC<{ player: Player; isCurrentTurn: boolean }> = ({ player, isCurrentTurn }) => {
  const cls = getClass(player.classId)
  const totalMana = Object.values(player.manaPool).reduce((a, b) => a + b, 0)
  const [imgError, setImgError] = useState(false)

  return (
    <motion.div
      className="rounded-xl p-3"
      animate={isCurrentTurn ? {
        boxShadow: [`0 0 8px ${cls.color}44`, `0 0 16px ${cls.color}88`, `0 0 8px ${cls.color}44`]
      } : {}}
      transition={{ duration: 1.5, repeat: Infinity }}
      style={{
        background: 'linear-gradient(160deg, rgba(26,18,40,0.95), rgba(14,8,22,0.98))',
        border: isCurrentTurn ? `2px solid ${cls.color}` : `1px solid ${cls.color}44`,
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="rounded-lg overflow-hidden flex items-center justify-center"
          style={{
            width: 44,
            height: 44,
            background: `linear-gradient(135deg, ${cls.color}22, ${cls.color}11)`,
            border: `1px solid ${cls.color}55`,
          }}
        >
          {!imgError ? (
            <img
              src={`/classes/${player.classId}-portrait.png`}
              alt={cls.name}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: 24 }}>{cls.emoji}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p style={{
              fontFamily: 'Cinzel, serif',
              fontWeight: 700,
              fontSize: 13,
              color: cls.color,
              margin: 0,
            }}>
              {player.name}
            </p>
            {isCurrentTurn && (
              <motion.span
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{
                  fontSize: 8,
                  padding: '2px 6px',
                  borderRadius: 8,
                  background: cls.color + '33',
                  color: cls.color,
                  fontFamily: 'Cinzel, serif',
                }}
              >
                TURN
              </motion.span>
            )}
          </div>
          <p style={{ fontFamily: 'Crimson Text, serif', fontSize: 10, color: '#6b5a7a', margin: 0 }}>
            {cls.name}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-2" style={{ fontSize: 11 }}>
        <span style={{ color: '#6b5a7a', fontFamily: 'Cinzel, serif' }}>
          🃏 {player.hand.length}
        </span>
        <span style={{ color: '#6b5a7a', fontFamily: 'Cinzel, serif' }}>
          ⚗️ {totalMana}
        </span>
        <span style={{ color: '#4d9f5d', fontFamily: 'Cinzel, serif', fontWeight: 700 }}>
          ✨ {player.completedRecipes.length}/5
        </span>
      </div>

      {/* Recipe progress */}
      <div className="flex flex-col gap-1">
        {player.recipes.slice(0, 3).map((r) => {
          const total = r.progress.reduce((s, p) => s + p.required, 0)
          const done = r.progress.reduce((s, p) => s + p.contributed, 0)
          const pct = done / total
          const isAdvanced = r.difficulty === 'advanced'
          const color = isAdvanced ? '#8b5a9f' : '#4d9f5d'

          return (
            <div key={r.id} className="flex items-center gap-2">
              <span style={{ fontSize: 8, fontFamily: 'Cinzel, serif', color, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                🧪 {r.name}
              </span>
              <div
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  background: '#2a1a3a',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct * 100}%`,
                    height: '100%',
                    background: color,
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Status effects */}
      <div className="flex gap-1 mt-2">
        {player.hexed && (
          <span style={{
            fontSize: 8,
            padding: '2px 6px',
            borderRadius: 8,
            background: '#8b5a9f22',
            color: '#8b5a9f',
            border: '1px solid #8b5a9f55',
            fontFamily: 'Cinzel, serif',
          }}>
            🔮 Hexed
          </span>
        )}
        {player.protected && (
          <span style={{
            fontSize: 8,
            padding: '2px 6px',
            borderRadius: 8,
            background: '#c9a84c22',
            color: '#c9a84c',
            border: '1px solid #c9a84c55',
            fontFamily: 'Cinzel, serif',
          }}>
            🛡️ Protected
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ── Large Recipe Card ──────────────────────────────────────────────────────
const DesktopRecipeCard: React.FC<{
  recipe: RecipeCard
  canInteract: boolean
  onTap: () => void
}> = ({ recipe, canInteract, onTap }) => {
  const isAdvanced = recipe.difficulty === 'advanced'
  const borderColor = isAdvanced ? '#8b5a9f' : '#4d9f5d'
  const totalProgress = recipe.progress.reduce((s, p) => s + p.contributed, 0)
  const totalRequired = recipe.progress.reduce((s, p) => s + p.required, 0)
  const pctDone = totalProgress / totalRequired

  return (
    <motion.button
      onClick={canInteract ? onTap : undefined}
      disabled={!canInteract}
      whileHover={canInteract ? { scale: 1.02, y: -4 } : {}}
      whileTap={canInteract ? { scale: 0.98 } : {}}
      className="recipe-parchment rounded-xl p-4 text-left"
      style={{
        border: `2px solid ${borderColor}66`,
        boxShadow: pctDone > 0.7 ? `0 0 16px ${borderColor}44` : 'none',
        cursor: canInteract ? 'pointer' : 'default',
        opacity: canInteract ? 1 : 0.7,
        width: '100%',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 style={{
          fontFamily: 'Cinzel, serif',
          fontWeight: 700,
          fontSize: 13,
          color: borderColor,
          margin: 0,
        }}>
          🧪 {recipe.name}
        </h4>
        <span style={{
          fontFamily: 'Cinzel, serif',
          fontSize: 9,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '3px 8px',
          borderRadius: 6,
          background: borderColor + '22',
          color: borderColor,
        }}>
          {recipe.difficulty}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="mb-3"
        style={{
          height: 6,
          borderRadius: 3,
          background: '#2a1a3a',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pctDone * 100}%` }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${borderColor}88, ${borderColor})`,
            borderRadius: 3,
          }}
        />
      </div>

      <RecipeProgressPips progress={recipe.progress} size="md" />

      <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', fontSize: 11, color: '#b8a898', marginTop: 8 }}>
        {recipe.description}
      </p>

      {canInteract && (
        <p style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: borderColor, marginTop: 8, letterSpacing: '0.1em' }}>
          CLICK TO ASSIGN MANA
        </p>
      )}
    </motion.button>
  )
}

// ── Main Desktop Layout ────────────────────────────────────────────────────
export const DesktopGameBoard: React.FC = () => {
  const {
    players,
    currentPlayerIndex,
    turnPhase,
    mainDeck,
    marketRow,
    discardPile,
    drawCard,
    playIngredient,
    castSpell,
    assignManaToRecipe,
    resolvePendingAction,
    endTurn,
  } = useGameStore()
  const { myPlayerId } = useMultiplayerStore()

  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [targetMode, setTargetMode] = useState<string | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeCard | null>(null)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)

  const currentPlayer = players[currentPlayerIndex]
  const currentClass = currentPlayer ? getClass(currentPlayer.classId) : null
  const opponents = players.filter((_, i) => i !== currentPlayerIndex)
  // myPlayerId available for multiplayer turn validation if needed
  void myPlayerId

  const canDraw = turnPhase === 'draw'
  const canAct = turnPhase === 'action'

  const selectedCardData = currentPlayer ? [...currentPlayer.hand, ...currentPlayer.spellDeck].find(c => c.id === selectedCard) : null

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?') {
        e.preventDefault()
        setShowKeyboardHelp(prev => !prev)
      }
      if (e.key === 'Escape') {
        setSelectedCard(null)
        setTargetMode(null)
        setSelectedRecipe(null)
        setShowKeyboardHelp(false)
      }
      if (e.key === 'Enter' && canAct && !targetMode && !selectedRecipe) {
        endTurn()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canAct, targetMode, selectedRecipe, endTurn])

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

  const handleTargetPlayer = (targetId: string) => {
    if (targetMode) {
      castSpell(targetMode, targetId)
      setTargetMode(null)
      setSelectedCard(null)
    }
  }

  const handleAssignMana = (manaType: ManaType) => {
    if (selectedRecipe) {
      assignManaToRecipe(selectedRecipe.id, manaType, 1)
      setSelectedRecipe(null)
    }
  }

  // Turn phase info
  const turnPhaseLabel = { draw: 'DRAW PHASE', action: 'ACTION PHASE', end: 'END PHASE' }[turnPhase]
  const turnPhaseColor = { draw: '#4d9f5d', action: '#8b5a9f', end: '#c9a84c' }[turnPhase]
  const turnPhaseEmoji = { draw: '🃏', action: '⚡', end: '🌙' }[turnPhase]

  if (!currentPlayer) return null

  // Fan effect for hand cards
  const getCardTransform = (index: number, total: number) => {
    if (total <= 1) return { rotation: 0, y: 0 }
    const middle = (total - 1) / 2
    const offset = index - middle
    const maxRotation = 6
    const maxY = 8
    const rotation = offset * (maxRotation / Math.max(3, total / 2))
    const y = Math.abs(offset) * (maxY / Math.max(3, total / 2))
    return { rotation, y }
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: '#0d0d0d' }}>
      {/* Mana assign modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedRecipe(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="rounded-xl p-5 max-w-md"
              style={{
                background: 'linear-gradient(160deg, rgba(26,18,40,0.98), rgba(14,8,22,0.99))',
                border: '2px solid #8b5a9f',
                boxShadow: '0 0 40px #8b5a9f44',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, color: '#c9a84c', fontSize: 16, marginBottom: 12 }}>
                🧪 Assign Mana to {selectedRecipe.name}
              </h3>
              <RecipeProgressPips progress={selectedRecipe.progress} size="md" />
              <p style={{ fontFamily: 'Crimson Text, serif', color: '#6b5a7a', fontSize: 12, margin: '12px 0' }}>
                Select mana type to assign:
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                {selectedRecipe.progress
                  .filter(p => p.contributed < p.required)
                  .map(p => {
                    const directMana = currentPlayer.manaPool[p.manaType] || 0
                    const anyMana = currentPlayer.manaPool['Any'] || 0
                    const available = directMana + anyMana
                    const color = MANA_COLORS[p.manaType]
                    return (
                      <motion.button
                        key={p.manaType}
                        onClick={() => handleAssignMana(p.manaType)}
                        disabled={available === 0}
                        whileHover={available > 0 ? { scale: 1.05 } : {}}
                        whileTap={available > 0 ? { scale: 0.95 } : {}}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 10,
                          fontFamily: 'Cinzel, serif',
                          fontWeight: 700,
                          fontSize: 12,
                          background: available > 0 ? `linear-gradient(135deg, ${color}cc, ${color}88)` : '#2a1a3a',
                          color: available > 0 ? '#fff' : '#4a3a5a',
                          border: `2px solid ${available > 0 ? color : '#4a3a5a'}`,
                          cursor: available > 0 ? 'pointer' : 'not-allowed',
                          boxShadow: available > 0 ? `0 0 12px ${color}44` : 'none',
                        }}
                      >
                        {MANA_EMOJIS[p.manaType]} {p.manaType} ({directMana})
                      </motion.button>
                    )
                  })}
              </div>
              <button
                onClick={() => setSelectedRecipe(null)}
                style={{
                  marginTop: 16,
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontFamily: 'Crimson Text, serif',
                  fontSize: 13,
                  color: '#6b5a7a',
                  background: 'transparent',
                  border: '1px solid #4a3a5a',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Cancel (Esc)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard help overlay */}
      <AnimatePresence>
        {showKeyboardHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={() => setShowKeyboardHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="rounded-xl p-6"
              style={{
                background: 'linear-gradient(160deg, rgba(26,18,40,0.98), rgba(14,8,22,0.99))',
                border: '2px solid #c9a84c',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, color: '#c9a84c', fontSize: 16, marginBottom: 16 }}>
                ⌨️ Keyboard Shortcuts
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <kbd style={{ padding: '4px 8px', borderRadius: 4, background: '#2a1a3a', border: '1px solid #4a3a5a', fontFamily: 'monospace', fontSize: 12, color: '#c9a84c' }}>
                    Enter
                  </kbd>
                  <span style={{ fontFamily: 'Crimson Text, serif', color: '#b8a898', fontSize: 13 }}>
                    End Turn
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <kbd style={{ padding: '4px 8px', borderRadius: 4, background: '#2a1a3a', border: '1px solid #4a3a5a', fontFamily: 'monospace', fontSize: 12, color: '#c9a84c' }}>
                    Esc
                  </kbd>
                  <span style={{ fontFamily: 'Crimson Text, serif', color: '#b8a898', fontSize: 13 }}>
                    Cancel / Close
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <kbd style={{ padding: '4px 8px', borderRadius: 4, background: '#2a1a3a', border: '1px solid #4a3a5a', fontFamily: 'monospace', fontSize: 12, color: '#c9a84c' }}>
                    ?
                  </kbd>
                  <span style={{ fontFamily: 'Crimson Text, serif', color: '#b8a898', fontSize: 13 }}>
                    Toggle this help
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header
        className="flex items-center justify-between flex-shrink-0"
        style={{
          padding: '8px 20px',
          background: 'rgba(10,5,18,0.95)',
          borderBottom: '1px solid #4a3a5a',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center gap-4">
          <span style={{ fontSize: 24, filter: 'drop-shadow(0 0 8px #4d9f5d88)' }}>⚗️</span>
          <div>
            <h1 style={{ fontFamily: 'Cinzel Decorative, serif', fontWeight: 700, fontSize: 20, color: '#c9a84c', margin: 0 }}>
              Alchemy
            </h1>
            <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#6b5a7a', fontSize: 10, margin: 0 }}>
              A game by Ryann Wolff
            </p>
          </div>
        </div>

        <motion.div
          animate={{ boxShadow: [`0 0 6px ${turnPhaseColor}44`, `0 0 14px ${turnPhaseColor}88`, `0 0 6px ${turnPhaseColor}44`] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            padding: '6px 16px',
            borderRadius: 20,
            background: turnPhaseColor + '22',
            color: turnPhaseColor,
            border: `2px solid ${turnPhaseColor}`,
            fontFamily: 'Cinzel, serif',
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.1em',
          }}
        >
          {turnPhaseEmoji} {turnPhaseLabel}
        </motion.div>

        <div className="flex items-center gap-4">
          <ConnectionStatus />
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 20, filter: `drop-shadow(0 0 4px ${currentClass?.color}88)` }}>
              {currentClass?.emoji}
            </span>
            <div>
              <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, color: currentClass?.color, fontSize: 14 }}>
                {currentPlayer.name}
              </span>
              <p style={{ fontFamily: 'Crimson Text, serif', color: '#6b5a7a', fontSize: 10, margin: 0 }}>
                {currentClass?.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowKeyboardHelp(true)}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              fontFamily: 'monospace',
              fontSize: 12,
              color: '#6b5a7a',
              background: 'transparent',
              border: '1px solid #4a3a5a',
              cursor: 'pointer',
            }}
          >
            ?
          </button>
        </div>
      </header>

      {/* Main Content: 3 columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Player Zone */}
        <aside
          className="flex-shrink-0 overflow-y-auto"
          style={{
            width: 260,
            padding: '16px 12px',
            borderRight: '1px solid #4a3a5a44',
            background: 'rgba(10,5,18,0.3)',
          }}
        >
          <CharacterCard player={currentPlayer} isActive={true} />

          {/* Spells */}
          {currentPlayer.spellDeck.length > 0 && (
            <div className="mt-4">
              <p style={{
                fontFamily: 'Cinzel, serif',
                fontSize: 10,
                letterSpacing: '0.12em',
                color: '#8b5a9f',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>
                ✨ Class Spells
              </p>
              <div className="flex flex-col gap-2">
                {currentPlayer.spellDeck.map(spell => {
                  const spellData = spell as SpellCard
                  const color = MANA_COLORS[spellData.manaType]
                  const canCast = canAct && (currentPlayer.manaPool[spellData.manaType] || 0) >= spellData.manaCost

                  return (
                    <motion.button
                      key={spell.id}
                      onClick={canCast ? () => handleCardClick(spell) : undefined}
                      disabled={!canCast}
                      whileHover={canCast ? { scale: 1.02 } : {}}
                      className="rounded-lg p-2 text-left"
                      style={{
                        background: selectedCard === spell.id ? `${color}22` : 'rgba(20,12,30,0.8)',
                        border: selectedCard === spell.id ? `2px solid ${color}` : `1px solid ${color}44`,
                        cursor: canCast ? 'pointer' : 'not-allowed',
                        opacity: canCast ? 1 : 0.5,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 10, color }}>
                          {spell.name}
                        </span>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: 8,
                          background: `${color}22`,
                          color,
                          fontFamily: 'Cinzel, serif',
                          fontWeight: 700,
                          fontSize: 9,
                        }}>
                          {spellData.manaCost}
                        </span>
                      </div>
                      <p style={{
                        fontFamily: 'Crimson Text, serif',
                        fontStyle: 'italic',
                        fontSize: 9,
                        color: '#6b5a7a',
                        margin: '4px 0 0 0',
                      }}>
                        {spell.description.substring(0, 50)}...
                      </p>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Center Column: The Table */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Market Row */}
          <section
            className="flex-shrink-0"
            style={{ padding: '16px 20px', borderBottom: '1px solid #4a3a5a22' }}
          >
            <p style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 10,
              letterSpacing: '0.15em',
              color: '#6b5a7a',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              ✦ Market Row · {mainDeck.length} cards in deck
            </p>
            <div className="flex items-center gap-4">
              {/* Draw deck */}
              <motion.button
                onClick={() => canDraw && drawCard(undefined)}
                disabled={!canDraw || mainDeck.length === 0}
                whileHover={canDraw ? { scale: 1.05, y: -4 } : {}}
                whileTap={canDraw ? { scale: 0.95 } : {}}
                className="flex-shrink-0 rounded-xl overflow-hidden card-back-gradient flex flex-col items-center justify-center"
                style={{
                  width: 90,
                  height: 135,
                  border: `2px solid ${canDraw ? '#4d9f5d' : '#4a3a5a'}`,
                  boxShadow: canDraw ? '0 0 20px #4d9f5d44' : 'none',
                  cursor: canDraw ? 'pointer' : 'not-allowed',
                }}
              >
                <motion.span
                  style={{ fontSize: 28 }}
                  animate={canDraw ? { filter: ['drop-shadow(0 0 4px #4d9f5d66)', 'drop-shadow(0 0 12px #4d9f5dcc)', 'drop-shadow(0 0 4px #4d9f5d66)'] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⚗️
                </motion.span>
                <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 10, color: canDraw ? '#4d9f5d' : '#4a3a5a', marginTop: 4 }}>
                  Draw
                </span>
                <span style={{ fontFamily: 'Crimson Text, serif', fontSize: 10, color: '#6b5a7a' }}>
                  ({mainDeck.length})
                </span>
              </motion.button>

              {/* Market cards */}
              {marketRow.map((card, i) => (
                <motion.div
                  key={card.id}
                  onClick={() => canDraw && drawCard(i)}
                  whileHover={canDraw ? { y: -8, scale: 1.03 } : {}}
                  style={{ width: 100, height: 150, flexShrink: 0, cursor: canDraw ? 'pointer' : 'default' }}
                >
                  <CardComponent card={card} disabled={!canDraw} />
                </motion.div>
              ))}

              {/* Discard pile */}
              <div
                className="flex-shrink-0 rounded-xl flex flex-col items-center justify-center"
                style={{
                  width: 80,
                  height: 120,
                  background: 'rgba(14,8,22,0.6)',
                  border: '1px solid #4a3a5a',
                }}
              >
                <span style={{ fontSize: 20 }}>🗑️</span>
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: 12, color: '#6b5a7a' }}>
                  {discardPile.length}
                </span>
                <span style={{ fontFamily: 'Crimson Text, serif', fontSize: 9, color: '#4a3a5a' }}>
                  discard
                </span>
              </div>
            </div>
          </section>

          {/* Cauldron + Recipes */}
          <section className="flex-1 overflow-y-auto" style={{ padding: '16px 20px' }}>
            {/* Cauldron */}
            <div className="flex justify-center mb-6">
              <motion.div
                style={{ width: 100, height: 100 }}
                animate={{ filter: ['drop-shadow(0 0 16px #4d9f5d44)', 'drop-shadow(0 0 32px #4d9f5d88)', 'drop-shadow(0 0 16px #4d9f5d44)'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <span style={{ fontSize: 80 }}>⚗️</span>
              </motion.div>
            </div>

            {/* Completed recipes */}
            {currentPlayer.completedRecipes.length > 0 && (
              <div className="flex flex-wrap gap-3 justify-center mb-6">
                {currentPlayer.completedRecipes.map(r => (
                  <motion.span
                    key={r.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 16,
                      fontFamily: 'Cinzel, serif',
                      fontSize: 11,
                      background: '#4d9f5d22',
                      color: '#4d9f5d',
                      border: '1px solid #4d9f5d66',
                      boxShadow: '0 0 12px #4d9f5d33',
                    }}
                  >
                    ✨ {r.name}
                  </motion.span>
                ))}
              </div>
            )}

            {/* Recipe grid */}
            <div className="grid grid-cols-3 gap-4" style={{ maxWidth: 700, margin: '0 auto' }}>
              {currentPlayer.recipes.map(r => (
                <DesktopRecipeCard
                  key={r.id}
                  recipe={r}
                  canInteract={canAct}
                  onTap={() => setSelectedRecipe(r)}
                />
              ))}
              {currentPlayer.recipes.length === 0 && (
                <p style={{
                  gridColumn: 'span 3',
                  textAlign: 'center',
                  fontFamily: 'Crimson Text, serif',
                  fontStyle: 'italic',
                  color: '#4d9f5d',
                  fontSize: 14,
                }}>
                  All recipes complete!
                </p>
              )}
            </div>
          </section>
        </main>

        {/* Right Column: Others + Log */}
        <aside
          className="flex-shrink-0 flex flex-col overflow-hidden"
          style={{
            width: 260,
            borderLeft: '1px solid #4a3a5a44',
            background: 'rgba(10,5,18,0.3)',
          }}
        >
          {/* Opponents */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '16px 12px' }}>
            <p style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 10,
              letterSpacing: '0.12em',
              color: '#6b5a7a',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              Opponents
            </p>
            <div className="flex flex-col gap-3">
              {opponents.map((p) => (
                <OpponentPanel
                  key={p.id}
                  player={p}
                  isCurrentTurn={players[currentPlayerIndex]?.id === p.id}
                />
              ))}
              {opponents.length === 0 && (
                <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#4a3a5a', fontSize: 12 }}>
                  Solo game — no opponents
                </p>
              )}
            </div>
          </div>

          {/* Action Log */}
          <div
            className="flex-shrink-0"
            style={{
              height: 200,
              padding: '12px',
              borderTop: '1px solid #4a3a5a44',
              overflow: 'hidden',
            }}
          >
            <p style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 9,
              letterSpacing: '0.12em',
              color: '#6b5a7a',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              📜 Action Log
            </p>
            <div className="overflow-y-auto" style={{ height: 'calc(100% - 24px)' }}>
              <ActionLog />
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Bar: Hand */}
      <footer
        className="flex-shrink-0"
        style={{
          height: 220,
          background: 'linear-gradient(180deg, rgba(26,18,40,0.98), rgba(14,8,22,0.99))',
          borderTop: '1px solid #4a3a5a',
          padding: '12px 20px',
        }}
      >
        {/* Target selection */}
        <AnimatePresence>
          {targetMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-3 flex-wrap items-center mb-3"
            >
              <span style={{ fontFamily: 'Cinzel, serif', color: '#8b5a9f', fontSize: 12, fontWeight: 700 }}>
                🎯 Select Target:
              </span>
              {opponents.map((p) => (
                <motion.button
                  key={p.id}
                  onClick={() => handleTargetPlayer(p.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 16,
                    fontFamily: 'Cinzel, serif',
                    fontWeight: 700,
                    fontSize: 11,
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
                  padding: '6px 12px',
                  borderRadius: 16,
                  fontFamily: 'Crimson Text, serif',
                  fontSize: 11,
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

        {/* Action buttons */}
        <AnimatePresence>
          {selectedCardData && canAct && !targetMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 flex-wrap mb-3"
            >
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: '#4d9f5d', fontWeight: 600 }}>
                Selected: {selectedCardData.name}
              </span>

              {selectedCardData.type === 'ingredient' && (
                <motion.button
                  onClick={handlePlayIngredient}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 16,
                    fontFamily: 'Cinzel, serif',
                    fontWeight: 700,
                    fontSize: 11,
                    background: `linear-gradient(135deg, ${MANA_COLORS[(selectedCardData as IngredientCard).manaType]}cc, ${MANA_COLORS[(selectedCardData as IngredientCard).manaType]}88)`,
                    color: '#fff',
                    border: `1px solid ${MANA_COLORS[(selectedCardData as IngredientCard).manaType]}`,
                    cursor: 'pointer',
                    boxShadow: `0 0 12px ${MANA_COLORS[(selectedCardData as IngredientCard).manaType]}44`,
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
                    padding: '6px 16px',
                    borderRadius: 16,
                    fontFamily: 'Cinzel, serif',
                    fontWeight: 700,
                    fontSize: 11,
                    background: 'linear-gradient(135deg, #8b5a9fcc, #8b5a9f88)',
                    color: '#fff',
                    border: '1px solid #8b5a9f',
                    cursor: 'pointer',
                    boxShadow: '0 0 12px #8b5a9f44',
                  }}
                >
                  ✨ Cast Spell
                </motion.button>
              )}

              {selectedCardData.type === 'scroll' && (
                <motion.button
                  onClick={() => { resolvePendingAction({ scrollCardId: selectedCardData.id }); setSelectedCard(null) }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 16,
                    fontFamily: 'Cinzel, serif',
                    fontWeight: 700,
                    fontSize: 11,
                    background: 'linear-gradient(135deg, #c9a84ccc, #c9a84c88)',
                    color: '#fff',
                    border: '1px solid #c9a84c',
                    cursor: 'pointer',
                    boxShadow: '0 0 12px #c9a84c44',
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
                  fontSize: 11,
                  color: '#6b5a7a',
                  background: 'transparent',
                  border: '1px solid #4a3a5a',
                  cursor: 'pointer',
                  marginLeft: 'auto',
                }}
              >
                Cancel (Esc)
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hand with fan effect */}
        <div className="flex items-end justify-center gap-0 flex-1" style={{ perspective: '1000px' }}>
          {currentPlayer.hand.map((card, i) => {
            const { rotation, y } = getCardTransform(i, currentPlayer.hand.length)
            const isSelected = selectedCard === card.id

            return (
              <motion.div
                key={card.id}
                animate={{
                  rotate: isSelected ? 0 : rotation,
                  y: isSelected ? -16 : y,
                  scale: isSelected ? 1.1 : 1,
                  zIndex: isSelected ? 20 : currentPlayer.hand.length - Math.abs(i - currentPlayer.hand.length / 2),
                }}
                whileHover={canAct ? {
                  scale: 1.1,
                  rotate: 0,
                  y: -16,
                  zIndex: 20,
                } : {}}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                  width: 110,
                  height: 165,
                  flexShrink: 0,
                  cursor: canAct ? 'pointer' : 'default',
                  marginLeft: i === 0 ? 0 : -20,
                  transformOrigin: 'bottom center',
                }}
              >
                <CardComponent
                  card={card}
                  onClick={canAct ? () => handleCardClick(card) : undefined}
                  selected={isSelected}
                  disabled={!canAct}
                />
              </motion.div>
            )
          })}

          {currentPlayer.hand.length === 0 && (
            <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#4a3a5a', fontSize: 14, alignSelf: 'center' }}>
              Hand empty — draw a card!
            </p>
          )}

          {/* End Turn button */}
          <motion.button
            onClick={endTurn}
            disabled={turnPhase === 'draw'}
            whileHover={turnPhase !== 'draw' ? { scale: 1.05 } : {}}
            whileTap={turnPhase !== 'draw' ? { scale: 0.95 } : {}}
            style={{
              marginLeft: 32,
              padding: '14px 28px',
              borderRadius: 12,
              fontFamily: 'Cinzel, serif',
              fontWeight: 700,
              fontSize: 14,
              background: turnPhase !== 'draw' ? 'linear-gradient(135deg, #2a7a3d, #4d9f5d)' : '#2a1a3a',
              color: turnPhase !== 'draw' ? '#fff' : '#4a3a5a',
              border: `2px solid ${turnPhase !== 'draw' ? '#4d9f5d' : '#4a3a5a'}`,
              cursor: turnPhase !== 'draw' ? 'pointer' : 'not-allowed',
              boxShadow: turnPhase !== 'draw' ? '0 0 20px #4d9f5d44' : 'none',
              alignSelf: 'center',
            }}
          >
            End Turn →
          </motion.button>
        </div>
      </footer>
    </div>
  )
}

export default DesktopGameBoard
