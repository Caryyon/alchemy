// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Recipe Board (parchment redesign)
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { motion } from 'framer-motion'
import type { RecipeCard, ManaType } from '../types/game'
import { MANA_COLORS } from '../data/cards'
import { useGameStore } from '../store/gameStore'

interface RecipeBoardProps {
  recipes: RecipeCard[]
  completedRecipes: RecipeCard[]
  playerId: string
  isActive: boolean
}

function ProgressBar({ contributed, required, manaType }: {
  contributed: number
  required: number
  manaType: ManaType
}) {
  const pct = Math.min(100, (contributed / required) * 100)
  const color = MANA_COLORS[manaType]

  return (
    <div className="flex items-center gap-2">
      <span style={{ fontFamily: 'Cinzel, serif', fontSize: 8, color: '#6b5a7a', width: 44, textAlign: 'right' }}>
        {manaType}
      </span>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(10,5,18,0.6)', border: '1px solid #4a3a5a', overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${color}88, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: contributed >= required ? '#4d9f5d' : '#6b5a7a', width: 28 }}>
        {contributed}/{required}
      </span>
      {/* Mana color dot */}
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${color}ff, ${color}55)`,
        boxShadow: `0 0 4px ${color}66`,
        flexShrink: 0,
      }} />
    </div>
  )
}

function RecipeCardDisplay({ recipe, isActive, playerId }: {
  recipe: RecipeCard
  isActive: boolean
  playerId: string
}) {
  const { players, currentPlayerIndex, turnPhase, assignManaToRecipe } = useGameStore()
  const isCurrentPlayer = players[currentPlayerIndex]?.id === playerId

  const handleAssign = (manaType: ManaType) => {
    if (!isActive || !isCurrentPlayer || turnPhase !== 'action') return
    assignManaToRecipe(recipe.id, manaType, 1)
  }

  const isAdvanced = recipe.difficulty === 'advanced'
  const borderColor = isAdvanced ? '#8b5a9f' : '#4d9f5d'
  const totalProgress = recipe.progress.reduce((s, p) => s + p.contributed, 0)
  const totalRequired = recipe.progress.reduce((s, p) => s + p.required, 0)
  const pctDone = totalProgress / totalRequired

  return (
    <motion.div
      className="recipe-parchment rounded-xl p-3 flex flex-col gap-2"
      style={{
        border: `1px solid ${borderColor}66`,
        minWidth: 180,
        maxWidth: 220,
        boxShadow: pctDone > 0.7 ? `0 0 12px ${borderColor}44` : 'none',
        transition: 'box-shadow 0.3s ease',
      }}
      whileHover={{ scale: isActive && isCurrentPlayer ? 1.02 : 1 }}
    >
      {/* Recipe header */}
      <div className="flex items-center justify-between gap-2">
        <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 11, color: borderColor }}>
          🧪 {recipe.name}
        </span>
        <span style={{
          fontFamily: 'Cinzel, serif',
          fontSize: 8,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '2px 6px',
          borderRadius: 4,
          background: borderColor + '22',
          color: borderColor,
        }}>
          {recipe.difficulty}
        </span>
      </div>

      {/* Progress bars (clickable to assign mana) */}
      <div className="flex flex-col gap-1.5">
        {recipe.progress.map((p) => (
          <button
            key={p.manaType}
            onClick={() => handleAssign(p.manaType)}
            disabled={!isActive || !isCurrentPlayer || turnPhase !== 'action' || p.contributed >= p.required}
            style={{
              all: 'unset',
              display: 'block',
              cursor:
                isActive && isCurrentPlayer && turnPhase === 'action' && p.contributed < p.required
                  ? 'pointer'
                  : 'default',
            }}
          >
            <ProgressBar
              contributed={p.contributed}
              required={p.required}
              manaType={p.manaType}
            />
          </button>
        ))}
      </div>

      {isActive && isCurrentPlayer && turnPhase === 'action' && (
        <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', fontSize: 10, color: '#4a3a5a', margin: 0 }}>
          Click a bar to assign mana
        </p>
      )}
    </motion.div>
  )
}

export const RecipeBoard: React.FC<RecipeBoardProps> = ({
  recipes,
  completedRecipes,
  playerId,
  isActive,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {completedRecipes.length > 0 && (
        <div>
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: '0.15em', color: '#4d9f5d', textTransform: 'uppercase', marginBottom: 6 }}>
            ✦ Completed ({completedRecipes.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {completedRecipes.map((r) => (
              <motion.div
                key={r.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 600,
                  fontSize: 12,
                  background: 'linear-gradient(135deg, #4d9f5d22, #4d9f5d11)',
                  color: '#4d9f5d',
                  border: '1px solid #4d9f5d88',
                  boxShadow: '0 0 8px #4d9f5d33',
                }}
              >
                ✨ {r.name}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: '0.15em', color: '#6b5a7a', textTransform: 'uppercase', marginBottom: 8 }}>
          In Progress ({recipes.length})
        </p>
        <div className="flex flex-wrap gap-3">
          {recipes.map((r) => (
            <RecipeCardDisplay
              key={r.id}
              recipe={r}
              isActive={isActive}
              playerId={playerId}
            />
          ))}
          {recipes.length === 0 && (
            <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#4a3a5a', fontSize: 14 }}>
              All recipes complete!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecipeBoard
