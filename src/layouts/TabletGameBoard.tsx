// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Tablet Game Board Layout
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { useMultiplayerStore } from '../store/multiplayerStore'
import { getClass } from '../data/classes'
import { CharacterCard } from '../components/CharacterCard'
import { RecipeProgressPips } from '../components/ManaDisplay'
import { CardComponent } from '../components/Card'
import { ConnectionStatus } from '../components/ConnectionStatus'
import ActionLog from '../components/ActionLog'
import type { Card, ManaType, IngredientCard, SpellCard, RecipeCard } from '../types/game'
import { MANA_COLORS } from '../data/cards'

const MANA_EMOJIS: Record<string, string> = {
  Fire: '🔥',
  Nature: '🌿',
  Lunar: '🌙',
  Arcane: '🔮',
  Shadow: '🕷️',
  Any: '✦',
}

// ── Opponent Card (compact for sidebar) ────────────────────────────────────
const OpponentCard: React.FC<{ player: typeof useGameStore.getState extends () => { players: infer P } ? P extends Array<infer T> ? T : never : never }> = ({ player }) => {
  const cls = getClass(player.classId)
  const totalMana = Object.values(player.manaPool).reduce((a, b) => a + b, 0)
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className="rounded-lg p-2.5"
      style={{
        background: 'rgba(20,12,30,0.9)',
        border: `1px solid ${cls.color}44`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="rounded-lg overflow-hidden flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            background: `linear-gradient(135deg, ${cls.color}22, ${cls.color}11)`,
            border: `1px solid ${cls.color}44`,
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
            <span style={{ fontSize: 18 }}>{cls.emoji}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p style={{
            fontFamily: 'Cinzel, serif',
            fontWeight: 700,
            fontSize: 11,
            color: cls.color,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {player.name}
          </p>
          <p style={{ fontFamily: 'Crimson Text, serif', fontSize: 9, color: '#6b5a7a', margin: 0 }}>
            {cls.name}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <span style={{ color: '#6b5a7a', fontFamily: 'Cinzel, serif', fontSize: 10 }}>
          🃏 {player.hand.length}
        </span>
        <span style={{ color: '#6b5a7a', fontFamily: 'Cinzel, serif', fontSize: 10 }}>
          ⚗️ {totalMana}
        </span>
        <span style={{ color: '#4d9f5d', fontFamily: 'Cinzel, serif', fontSize: 10, fontWeight: 700 }}>
          ✨ {player.completedRecipes.length}/5
        </span>
      </div>

      {/* Recipe progress preview */}
      <div className="mt-2 flex flex-wrap gap-1">
        {player.recipes.slice(0, 2).map((r) => {
          const total = r.progress.reduce((s, p) => s + p.required, 0)
          const done = r.progress.reduce((s, p) => s + p.contributed, 0)
          const pct = done / total
          return (
            <div
              key={r.id}
              className="rounded px-1.5 py-0.5"
              style={{
                background: `linear-gradient(90deg, #4d9f5d${Math.round(pct * 88).toString(16).padStart(2, '0')} ${pct * 100}%, #2a1a3a ${pct * 100}%)`,
                border: '1px solid #4a3a5a',
                fontSize: 8,
                fontFamily: 'Cinzel, serif',
                color: '#6b5a7a',
              }}
            >
              🧪 {Math.round(pct * 100)}%
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Recipe Card (for center area) ──────────────────────────────────────────
const TabletRecipeCard: React.FC<{
  recipe: RecipeCard
  canInteract: boolean
  onTap: () => void
  isDropTarget?: boolean
}> = ({ recipe, canInteract, onTap, isDropTarget = false }) => {
  const isAdvanced = recipe.difficulty === 'advanced'
  const borderColor = isAdvanced ? '#8b5a9f' : '#4d9f5d'

  return (
    <motion.button
      onClick={canInteract ? onTap : undefined}
      disabled={!canInteract}
      whileHover={canInteract ? { scale: 1.03 } : {}}
      whileTap={canInteract ? { scale: 0.97 } : {}}
      className="recipe-parchment rounded-lg p-3 text-left"
      style={{
        border: isDropTarget ? `2px solid ${borderColor}` : `1px solid ${borderColor}55`,
        boxShadow: isDropTarget ? `0 0 16px ${borderColor}66` : 'none',
        cursor: canInteract ? 'pointer' : 'default',
        opacity: canInteract ? 1 : 0.7,
        width: '100%',
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span style={{
          fontFamily: 'Cinzel, serif',
          fontWeight: 700,
          fontSize: 11,
          color: borderColor,
        }}>
          🧪 {recipe.name}
        </span>
        <span style={{
          fontFamily: 'Cinzel, serif',
          fontSize: 8,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '2px 6px',
          borderRadius: 4,
          background: borderColor + '22',
          color: borderColor,
        }}>
          {recipe.difficulty}
        </span>
      </div>
      <RecipeProgressPips progress={recipe.progress} size="md" />
      {canInteract && (
        <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', fontSize: 10, color: '#4a3a5a', marginTop: 6 }}>
          Tap to assign mana
        </p>
      )}
    </motion.button>
  )
}

// ── Main Tablet Layout ─────────────────────────────────────────────────────
export const TabletGameBoard: React.FC = () => {
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
  const [showLog, setShowLog] = useState(false)

  const currentPlayer = players[currentPlayerIndex]
  const currentClass = currentPlayer ? getClass(currentPlayer.classId) : null
  const opponents = players.filter((_, i) => i !== currentPlayerIndex)
  // myPlayerId available for multiplayer turn validation if needed
  void myPlayerId

  const canDraw = turnPhase === 'draw'
  const canAct = turnPhase === 'action'

  const selectedCardData = currentPlayer ? [...currentPlayer.hand, ...currentPlayer.spellDeck].find(c => c.id === selectedCard) : null

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
  const turnPhaseLabel = { draw: 'DRAW', action: 'ACTION', end: 'END' }[turnPhase]
  const turnPhaseColor = { draw: '#4d9f5d', action: '#8b5a9f', end: '#c9a84c' }[turnPhase]
  const turnPhaseEmoji = { draw: '🃏', action: '⚡', end: '🌙' }[turnPhase]

  if (!currentPlayer) return null

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
            style={{ background: 'rgba(0,0,0,0.85)' }}
            onClick={() => setSelectedRecipe(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="rounded-xl p-4 max-w-xs"
              style={{
                background: 'linear-gradient(160deg, rgba(26,18,40,0.98), rgba(14,8,22,0.99))',
                border: '2px solid #8b5a9f',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, color: '#c9a84c', fontSize: 14, marginBottom: 12 }}>
                🧪 Assign Mana to {selectedRecipe.name}
              </h3>
              <RecipeProgressPips progress={selectedRecipe.progress} size="md" />
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedRecipe.progress
                  .filter(p => p.contributed < p.required)
                  .map(p => {
                    const available = (currentPlayer.manaPool[p.manaType] || 0) + (currentPlayer.manaPool['Any'] || 0)
                    const color = MANA_COLORS[p.manaType]
                    return (
                      <motion.button
                        key={p.manaType}
                        onClick={() => handleAssignMana(p.manaType)}
                        disabled={available === 0}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          fontFamily: 'Cinzel, serif',
                          fontWeight: 700,
                          fontSize: 11,
                          background: available > 0 ? `linear-gradient(135deg, ${color}cc, ${color}88)` : '#2a1a3a',
                          color: available > 0 ? '#fff' : '#4a3a5a',
                          border: `1px solid ${available > 0 ? color : '#4a3a5a'}`,
                          cursor: available > 0 ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {MANA_EMOJIS[p.manaType]} {p.manaType}
                      </motion.button>
                    )
                  })}
              </div>
              <button
                onClick={() => setSelectedRecipe(null)}
                style={{
                  marginTop: 12,
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontFamily: 'Crimson Text, serif',
                  fontSize: 12,
                  color: '#6b5a7a',
                  background: 'transparent',
                  border: '1px solid #4a3a5a',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Row: Left sidebar + Center + Right sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Opponents */}
        <aside
          className="flex-shrink-0 overflow-y-auto"
          style={{
            width: 180,
            padding: '12px 8px',
            borderRight: '1px solid #4a3a5a44',
            background: 'rgba(10,5,18,0.3)',
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
            Opponents
          </p>
          <div className="flex flex-col gap-2">
            {opponents.map((p) => (
              <OpponentCard key={p.id} player={p} />
            ))}
            {opponents.length === 0 && (
              <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#4a3a5a', fontSize: 11 }}>
                Solo game
              </p>
            )}
          </div>
        </aside>

        {/* Center: Header + Market + Cauldron + Recipes */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header
            className="flex items-center justify-between flex-shrink-0"
            style={{
              padding: '8px 16px',
              background: 'rgba(10,5,18,0.95)',
              borderBottom: '1px solid #4a3a5a',
            }}
          >
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 20, filter: 'drop-shadow(0 0 6px #4d9f5d88)' }}>⚗️</span>
              <span style={{ fontFamily: 'Cinzel Decorative, serif', fontWeight: 700, fontSize: 16, color: '#c9a84c' }}>
                Alchemy
              </span>
              <span style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#6b5a7a', fontSize: 11 }}>
                by Ryann Wolff
              </span>
            </div>

            <motion.div
              animate={{ boxShadow: [`0 0 4px ${turnPhaseColor}44`, `0 0 10px ${turnPhaseColor}88`, `0 0 4px ${turnPhaseColor}44`] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                padding: '3px 12px',
                borderRadius: 16,
                background: turnPhaseColor + '22',
                color: turnPhaseColor,
                border: `1px solid ${turnPhaseColor}`,
                fontFamily: 'Cinzel, serif',
                fontWeight: 700,
                fontSize: 10,
              }}
            >
              {turnPhaseEmoji} {turnPhaseLabel} PHASE
            </motion.div>

            <div className="flex items-center gap-3">
              <ConnectionStatus />
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 16, filter: `drop-shadow(0 0 3px ${currentClass?.color}88)` }}>
                  {currentClass?.emoji}
                </span>
                <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, color: currentClass?.color, fontSize: 12 }}>
                  {currentPlayer.name}
                </span>
              </div>
              <button
                onClick={() => setShowLog(!showLog)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 8,
                  fontFamily: 'Cinzel, serif',
                  fontSize: 10,
                  color: '#c9a84c',
                  background: showLog ? 'rgba(201,168,76,0.2)' : 'transparent',
                  border: '1px solid #c9a84c55',
                  cursor: 'pointer',
                }}
              >
                📜 Log
              </button>
            </div>
          </header>

          {/* Market Row */}
          <section
            className="flex-shrink-0"
            style={{ padding: '12px 16px', borderBottom: '1px solid #4a3a5a22' }}
          >
            <div className="flex items-center gap-3">
              {/* Draw deck */}
              <motion.button
                onClick={() => canDraw && drawCard(undefined)}
                disabled={!canDraw || mainDeck.length === 0}
                whileHover={canDraw ? { scale: 1.05 } : {}}
                whileTap={canDraw ? { scale: 0.95 } : {}}
                className="flex-shrink-0 rounded-xl overflow-hidden card-back-gradient flex flex-col items-center justify-center"
                style={{
                  width: 70,
                  height: 105,
                  border: `2px solid ${canDraw ? '#4d9f5d' : '#4a3a5a'}`,
                  cursor: canDraw ? 'pointer' : 'not-allowed',
                }}
              >
                <span style={{ fontSize: 20 }}>⚗️</span>
                <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 9, color: canDraw ? '#4d9f5d' : '#4a3a5a' }}>
                  Draw ({mainDeck.length})
                </span>
              </motion.button>

              {/* Market cards */}
              {marketRow.map((card, i) => (
                <motion.div
                  key={card.id}
                  onClick={() => canDraw && drawCard(i)}
                  style={{ width: 88, height: 132, flexShrink: 0, cursor: canDraw ? 'pointer' : 'default' }}
                >
                  <CardComponent card={card} disabled={!canDraw} compact />
                </motion.div>
              ))}

              {/* Discard */}
              <div
                className="flex-shrink-0 rounded-lg flex flex-col items-center justify-center"
                style={{
                  width: 60,
                  height: 90,
                  background: 'rgba(14,8,22,0.6)',
                  border: '1px solid #4a3a5a',
                }}
              >
                <span style={{ fontSize: 16 }}>🗑️</span>
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: '#6b5a7a' }}>
                  {discardPile.length}
                </span>
              </div>
            </div>
          </section>

          {/* Cauldron + Recipes */}
          <section className="flex-1 overflow-y-auto" style={{ padding: '12px 16px' }}>
            {/* Cauldron */}
            <div className="flex justify-center mb-4">
              <motion.div
                style={{ width: 80, height: 80 }}
                animate={{ filter: ['drop-shadow(0 0 12px #4d9f5d44)', 'drop-shadow(0 0 24px #4d9f5d88)', 'drop-shadow(0 0 12px #4d9f5d44)'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <span style={{ fontSize: 60 }}>⚗️</span>
              </motion.div>
            </div>

            {/* Completed recipes */}
            {currentPlayer.completedRecipes.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {currentPlayer.completedRecipes.map(r => (
                  <span
                    key={r.id}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontFamily: 'Cinzel, serif',
                      fontSize: 10,
                      background: '#4d9f5d22',
                      color: '#4d9f5d',
                      border: '1px solid #4d9f5d66',
                    }}
                  >
                    ✨ {r.name}
                  </span>
                ))}
              </div>
            )}

            {/* Recipe grid */}
            <div className="grid grid-cols-2 gap-3" style={{ maxWidth: 500, margin: '0 auto' }}>
              {currentPlayer.recipes.map(r => (
                <TabletRecipeCard
                  key={r.id}
                  recipe={r}
                  canInteract={canAct}
                  onTap={() => setSelectedRecipe(r)}
                />
              ))}
            </div>
          </section>
        </main>

        {/* Right Sidebar: Action Log (toggleable) */}
        <AnimatePresence>
          {showLog && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex-shrink-0 overflow-y-auto"
              style={{
                borderLeft: '1px solid #4a3a5a44',
                background: 'rgba(10,5,18,0.4)',
              }}
            >
              <div style={{ padding: '12px 10px', width: 200 }}>
                <h3 style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  color: '#6b5a7a',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}>
                  📜 Action Log
                </h3>
                <ActionLog />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Bar: Character + Hand */}
      <footer
        className="flex-shrink-0 flex items-stretch"
        style={{
          height: 220,
          background: 'linear-gradient(180deg, rgba(26,18,40,0.98), rgba(14,8,22,0.99))',
          borderTop: '1px solid #4a3a5a',
        }}
      >
        {/* Character + Mana */}
        <div
          className="flex-shrink-0 overflow-y-auto"
          style={{ width: 220, padding: '12px', borderRight: '1px solid #4a3a5a44' }}
        >
          <CharacterCard player={currentPlayer} isActive={true} />
        </div>

        {/* Hand + Actions */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ padding: '12px' }}>
          {/* Target selection */}
          <AnimatePresence>
            {targetMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 flex-wrap items-center mb-2"
              >
                <span style={{ fontFamily: 'Cinzel, serif', color: '#8b5a9f', fontSize: 11, fontWeight: 700 }}>
                  🎯 Target:
                </span>
                {opponents.map((p) => (
                  <motion.button
                    key={p.id}
                    onClick={() => handleTargetPlayer(p.id)}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '5px 12px',
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
                    padding: '5px 10px',
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

          {/* Action buttons */}
          <AnimatePresence>
            {selectedCardData && canAct && !targetMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 flex-wrap mb-2"
              >
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: '#4d9f5d', fontWeight: 600 }}>
                  {selectedCardData.name}:
                </span>

                {selectedCardData.type === 'ingredient' && (
                  <motion.button
                    onClick={handlePlayIngredient}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 14,
                      fontFamily: 'Cinzel, serif',
                      fontWeight: 700,
                      fontSize: 10,
                      background: `linear-gradient(135deg, ${MANA_COLORS[(selectedCardData as IngredientCard).manaType]}cc, ${MANA_COLORS[(selectedCardData as IngredientCard).manaType]}88)`,
                      color: '#fff',
                      border: `1px solid ${MANA_COLORS[(selectedCardData as IngredientCard).manaType]}`,
                      cursor: 'pointer',
                    }}
                  >
                    {MANA_EMOJIS[(selectedCardData as IngredientCard).manaType]} Play for Mana
                  </motion.button>
                )}

                {selectedCardData.type === 'spell' && (
                  <motion.button
                    onClick={handleCastSpell}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '5px 12px',
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
                    ✨ Cast Spell
                  </motion.button>
                )}

                {selectedCardData.type === 'scroll' && (
                  <motion.button
                    onClick={() => { resolvePendingAction({ scrollCardId: selectedCardData.id }); setSelectedCard(null) }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 14,
                      fontFamily: 'Cinzel, serif',
                      fontWeight: 700,
                      fontSize: 10,
                      background: 'linear-gradient(135deg, #c9a84ccc, #c9a84c88)',
                      color: '#fff',
                      border: '1px solid #c9a84c',
                      cursor: 'pointer',
                    }}
                  >
                    📜 Use Scroll
                  </motion.button>
                )}

                <button
                  onClick={() => setSelectedCard(null)}
                  style={{
                    padding: '5px 10px',
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
          <div className="flex items-end gap-2 overflow-x-auto flex-1" style={{ scrollSnapType: 'x mandatory' }}>
            {currentPlayer.hand.map((card) => (
              <motion.div
                key={card.id}
                animate={{
                  y: selectedCard === card.id ? -8 : 0,
                  scale: selectedCard === card.id ? 1.05 : 1,
                }}
                style={{ flexShrink: 0, scrollSnapAlign: 'start', width: 100, height: 150 }}
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

            {currentPlayer.hand.length === 0 && (
              <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#4a3a5a', fontSize: 12, alignSelf: 'center' }}>
                Hand empty
              </p>
            )}

            {/* Spells */}
            {currentPlayer.spellDeck.length > 0 && (
              <>
                <div style={{ width: 1, height: 100, background: '#4a3a5a44', flexShrink: 0, alignSelf: 'center' }} />
                {currentPlayer.spellDeck.map((card) => (
                  <motion.div
                    key={card.id}
                    animate={{ y: selectedCard === card.id ? -8 : 0, scale: selectedCard === card.id ? 1.05 : 1 }}
                    style={{ flexShrink: 0, scrollSnapAlign: 'start', width: 100, height: 150 }}
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
              </>
            )}

            {/* End Turn button */}
            <motion.button
              onClick={endTurn}
              disabled={turnPhase === 'draw'}
              whileHover={turnPhase !== 'draw' ? { scale: 1.04 } : {}}
              whileTap={turnPhase !== 'draw' ? { scale: 0.96 } : {}}
              className="flex-shrink-0"
              style={{
                padding: '12px 20px',
                borderRadius: 10,
                fontFamily: 'Cinzel, serif',
                fontWeight: 700,
                fontSize: 12,
                background: turnPhase !== 'draw' ? 'linear-gradient(135deg, #2a7a3d, #4d9f5d)' : '#2a1a3a',
                color: turnPhase !== 'draw' ? '#fff' : '#4a3a5a',
                border: `2px solid ${turnPhase !== 'draw' ? '#4d9f5d' : '#4a3a5a'}`,
                cursor: turnPhase !== 'draw' ? 'pointer' : 'not-allowed',
                boxShadow: turnPhase !== 'draw' ? '0 0 14px #4d9f5d44' : 'none',
                scrollSnapAlign: 'start',
                alignSelf: 'center',
              }}
            >
              End Turn →
            </motion.button>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default TabletGameBoard
