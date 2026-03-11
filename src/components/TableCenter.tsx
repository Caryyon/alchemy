// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Table Center Component (cauldron + recipes + market)
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RecipeCard, Card, ManaType } from '../types/game'
import { CardComponent } from './Card'
import { RecipeProgressPips } from './ManaDisplay'
import { MANA_COLORS } from '../data/cards'
import { useGameStore } from '../store/gameStore'

interface TableCenterProps {
  recipes: RecipeCard[]
  completedRecipes: RecipeCard[]
  marketCards: Card[]
  deckSize: number
  discardSize: number
  playerId: string
  isActive: boolean
  manaPool: Record<ManaType, number>
}

// Mana assignment modal
function ManaAssignModal({
  recipe,
  manaPool,
  onAssign,
  onClose,
}: {
  recipe: RecipeCard
  manaPool: Record<ManaType, number>
  onAssign: (manaType: ManaType) => void
  onClose: () => void
}) {
  // Find which mana types this recipe needs and you have
  const neededTypes = recipe.progress
    .filter(p => p.contributed < p.required)
    .map(p => p.manaType)

  const availableMana = neededTypes.filter(type => {
    const directAmount = manaPool[type] || 0
    const anyAmount = manaPool['Any'] || 0
    return directAmount > 0 || anyAmount > 0
  })

  // Add Any mana option if applicable
  const canUseAny = (manaPool['Any'] || 0) > 0 && neededTypes.length > 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="rounded-xl p-4 max-w-xs w-full"
        style={{
          background: 'linear-gradient(160deg, rgba(26,18,40,0.98), rgba(14,8,22,0.99))',
          border: '2px solid #8b5a9f',
          boxShadow: '0 0 40px #8b5a9f44',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{
          fontFamily: 'Cinzel, serif',
          fontWeight: 700,
          color: '#c9a84c',
          fontSize: 14,
          margin: '0 0 8px 0',
        }}>
          🧪 Assign Mana to {recipe.name}
        </h3>

        {/* Recipe progress */}
        <div className="mb-3">
          <RecipeProgressPips progress={recipe.progress} size="md" />
        </div>

        {/* Mana type buttons */}
        <p style={{
          fontFamily: 'Crimson Text, serif',
          color: '#6b5a7a',
          fontSize: 12,
          margin: '0 0 8px 0',
        }}>
          Select mana type to assign:
        </p>

        <div className="flex flex-wrap gap-2">
          {availableMana.length === 0 && !canUseAny ? (
            <p style={{
              fontFamily: 'Crimson Text, serif',
              fontStyle: 'italic',
              color: '#6b5a7a',
              fontSize: 12,
            }}>
              No matching mana available
            </p>
          ) : (
            <>
              {availableMana.map(type => {
                const color = MANA_COLORS[type]
                const amount = manaPool[type] || 0
                return (
                  <motion.button
                    key={type}
                    onClick={() => onAssign(type)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      fontFamily: 'Cinzel, serif',
                      fontWeight: 700,
                      fontSize: 12,
                      background: `linear-gradient(135deg, ${color}cc, ${color}88)`,
                      color: '#fff',
                      border: `1px solid ${color}`,
                      cursor: 'pointer',
                      boxShadow: `0 0 12px ${color}44`,
                    }}
                  >
                    {type} ({amount})
                  </motion.button>
                )
              })}
              {canUseAny && (
                <motion.button
                  onClick={() => {
                    // Assign Any mana to first needed type
                    if (neededTypes.length > 0) {
                      onAssign(neededTypes[0])
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontFamily: 'Cinzel, serif',
                    fontWeight: 700,
                    fontSize: 12,
                    background: 'linear-gradient(135deg, #8b6b47cc, #8b6b4788)',
                    color: '#fff',
                    border: '1px solid #8b6b47',
                    cursor: 'pointer',
                    boxShadow: '0 0 12px #8b6b4744',
                  }}
                >
                  Any ✦ ({manaPool['Any']})
                </motion.button>
              )}
            </>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 12,
            padding: '6px 14px',
            borderRadius: 6,
            fontFamily: 'Crimson Text, serif',
            fontSize: 13,
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
  )
}

// Compact recipe card for mobile
function CompactRecipeCard({
  recipe,
  isActive,
  playerId,
  onTap,
}: {
  recipe: RecipeCard
  isActive: boolean
  playerId: string
  onTap: () => void
}) {
  const { players, currentPlayerIndex, turnPhase } = useGameStore()
  const isCurrentPlayer = players[currentPlayerIndex]?.id === playerId
  const canInteract = isActive && isCurrentPlayer && turnPhase === 'action'

  const isAdvanced = recipe.difficulty === 'advanced'
  const borderColor = isAdvanced ? '#8b5a9f' : '#4d9f5d'
  const totalProgress = recipe.progress.reduce((s, p) => s + p.contributed, 0)
  const totalRequired = recipe.progress.reduce((s, p) => s + p.required, 0)
  const pctDone = totalProgress / totalRequired

  return (
    <motion.button
      onClick={canInteract ? onTap : undefined}
      disabled={!canInteract}
      whileHover={canInteract ? { scale: 1.03 } : {}}
      whileTap={canInteract ? { scale: 0.97 } : {}}
      className="recipe-parchment rounded-lg p-2.5 text-left"
      style={{
        border: `1px solid ${borderColor}55`,
        minWidth: 140,
        flex: '1 1 140px',
        maxWidth: '48%',
        boxShadow: pctDone > 0.7 ? `0 0 10px ${borderColor}44` : 'none',
        cursor: canInteract ? 'pointer' : 'default',
        opacity: canInteract ? 1 : 0.7,
      }}
    >
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span style={{
          fontFamily: 'Cinzel, serif',
          fontWeight: 700,
          fontSize: 10,
          color: borderColor,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          🧪 {recipe.name}
        </span>
        <span style={{
          fontFamily: 'Cinzel, serif',
          fontSize: 7,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '1px 4px',
          borderRadius: 3,
          background: borderColor + '22',
          color: borderColor,
        }}>
          {recipe.difficulty}
        </span>
      </div>
      <RecipeProgressPips progress={recipe.progress} size="sm" />
      {canInteract && (
        <p style={{
          fontFamily: 'Crimson Text, serif',
          fontStyle: 'italic',
          fontSize: 9,
          color: '#4a3a5a',
          margin: '4px 0 0 0',
        }}>
          Tap to assign mana
        </p>
      )}
    </motion.button>
  )
}

// Compact market card display
function CompactMarketCard({
  card,
  canDraw,
  onDraw,
  rotation,
}: {
  card: Card
  canDraw: boolean
  onDraw: () => void
  rotation: number
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1 flex-shrink-0"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div style={{ width: 80, height: 120 }}>
        <CardComponent
          card={card}
          onClick={canDraw ? onDraw : undefined}
          disabled={!canDraw}
          compact
          rotation={rotation}
        />
      </div>
      {canDraw && (
        <motion.span
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 8,
            color: '#4d9f5d',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Take
        </motion.span>
      )}
    </motion.div>
  )
}

const ROTATIONS = [-2, 1, -1.5, 2, -1]

export const TableCenter: React.FC<TableCenterProps> = ({
  recipes,
  completedRecipes,
  marketCards,
  deckSize,
  discardSize,
  playerId,
  isActive,
  manaPool,
}) => {
  const { turnPhase, drawCard, assignManaToRecipe, players, currentPlayerIndex } = useGameStore()
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeCard | null>(null)
  const [cauldronImgError, setCauldronImgError] = useState(false)

  const canDraw = turnPhase === 'draw'
  const currentPlayer = players[currentPlayerIndex]

  const handleAssignMana = (manaType: ManaType) => {
    if (selectedRecipe) {
      assignManaToRecipe(selectedRecipe.id, manaType, 1)
      setSelectedRecipe(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mana Assignment Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <ManaAssignModal
            recipe={selectedRecipe}
            manaPool={manaPool}
            onAssign={handleAssignMana}
            onClose={() => setSelectedRecipe(null)}
          />
        )}
      </AnimatePresence>

      {/* Cauldron + Recipes area */}
      <div
        className="rounded-xl p-4"
        style={{
          background: 'linear-gradient(180deg, rgba(15,10,24,0.9), rgba(20,14,30,0.95))',
          border: '1px solid #4a3a5a44',
        }}
      >
        {/* Cauldron */}
        <div className="flex justify-center mb-4">
          <motion.div
            className="flex items-center justify-center"
            style={{
              width: 80,
              height: 80,
            }}
            animate={{
              filter: [
                'drop-shadow(0 0 12px #4d9f5d44)',
                'drop-shadow(0 0 24px #4d9f5d88)',
                'drop-shadow(0 0 12px #4d9f5d44)',
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {!cauldronImgError ? (
              <img
                src="/cauldron.png"
                alt="Cauldron"
                onError={() => setCauldronImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <span style={{
                fontSize: 48,
                filter: 'drop-shadow(0 0 16px #4d9f5d88)',
              }}>
                ⚗️
              </span>
            )}
          </motion.div>
        </div>

        {/* Completed recipes badges */}
        {completedRecipes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center mb-3">
            {completedRecipes.map(r => (
              <motion.span
                key={r.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  padding: '3px 8px',
                  borderRadius: 12,
                  fontFamily: 'Cinzel, serif',
                  fontSize: 9,
                  background: 'linear-gradient(135deg, #4d9f5d22, #4d9f5d11)',
                  color: '#4d9f5d',
                  border: '1px solid #4d9f5d66',
                }}
              >
                ✨ {r.name}
              </motion.span>
            ))}
          </div>
        )}

        {/* Active recipes grid */}
        <div className="flex flex-wrap gap-2 justify-center">
          {recipes.map(r => (
            <CompactRecipeCard
              key={r.id}
              recipe={r}
              isActive={isActive}
              playerId={playerId}
              onTap={() => setSelectedRecipe(r)}
            />
          ))}
          {recipes.length === 0 && (
            <p style={{
              fontFamily: 'Crimson Text, serif',
              fontStyle: 'italic',
              color: '#4d9f5d',
              fontSize: 12,
            }}>
              All recipes complete!
            </p>
          )}
        </div>
      </div>

      {/* Market Row */}
      <div>
        <p style={{
          fontFamily: 'Cinzel, serif',
          fontSize: 9,
          letterSpacing: '0.15em',
          color: '#6b5a7a',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          ✦ Market · {deckSize} in deck
        </p>

        <div className="flex items-end gap-2 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
          {/* Draw from deck */}
          <motion.button
            onClick={() => canDraw && drawCard(undefined)}
            disabled={!canDraw || deckSize === 0}
            whileHover={canDraw && deckSize > 0 ? { scale: 1.05, y: -2 } : {}}
            whileTap={canDraw ? { scale: 0.95 } : {}}
            className="flex-shrink-0 rounded-xl overflow-hidden card-back-gradient flex flex-col items-center justify-center"
            style={{
              width: 60,
              height: 90,
              border: `2px solid ${canDraw ? '#4d9f5d' : '#4a3a5a'}`,
              boxShadow: canDraw ? '0 0 16px #4d9f5d44' : 'none',
              cursor: canDraw && deckSize > 0 ? 'pointer' : 'not-allowed',
              scrollSnapAlign: 'start',
            }}
          >
            <motion.span
              style={{ fontSize: 20 }}
              animate={canDraw ? {
                filter: ['drop-shadow(0 0 4px #4d9f5d66)', 'drop-shadow(0 0 10px #4d9f5dcc)', 'drop-shadow(0 0 4px #4d9f5d66)']
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⚗️
            </motion.span>
            <span style={{
              fontFamily: 'Cinzel, serif',
              fontWeight: 700,
              fontSize: 8,
              color: canDraw ? '#4d9f5d' : '#4a3a5a',
            }}>
              Draw
            </span>
          </motion.button>

          {/* Market cards */}
          {marketCards.map((card, i) => (
            <div key={card.id} style={{ scrollSnapAlign: 'start' }}>
              <CompactMarketCard
                card={card}
                canDraw={canDraw}
                onDraw={() => drawCard(i)}
                rotation={ROTATIONS[i % ROTATIONS.length]}
              />
            </div>
          ))}

          {/* Discard pile */}
          <div
            className="flex-shrink-0 rounded-lg flex flex-col items-center justify-center"
            style={{
              width: 50,
              height: 75,
              background: 'rgba(14,8,22,0.6)',
              border: '1px solid #4a3a5a',
              scrollSnapAlign: 'start',
            }}
          >
            <span style={{ fontSize: 16 }}>🗑️</span>
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: '#6b5a7a' }}>
              {discardSize}
            </span>
          </div>
        </div>

        {canDraw && (
          <motion.p
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              fontFamily: 'Crimson Text, serif',
              fontStyle: 'italic',
              color: '#4d9f5d',
              fontSize: 12,
              marginTop: 6,
            }}
          >
            👆 {currentPlayer?.name}: Draw or take from market
          </motion.p>
        )}
      </div>
    </div>
  )
}

export default TableCenter
