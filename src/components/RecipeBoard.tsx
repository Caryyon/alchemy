// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Recipe Board Component
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React from 'react'
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
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-gray-400 w-12">{manaType}</span>
      <div className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] text-gray-400 w-8 text-right">
        {contributed}/{required}
      </span>
    </div>
  )
}

function RecipeCardDisplay({ recipe, isActive, playerId }: {
  recipe: RecipeCard
  isActive: boolean
  playerId: string
}) {
  const { players, currentPlayerIndex, turnPhase, assignManaToRecipe } = useGameStore()
  const player = players.find((p) => p.id === playerId)
  const isCurrentPlayer = players[currentPlayerIndex]?.id === playerId

  const handleAssign = (manaType: ManaType) => {
    if (!isActive || !isCurrentPlayer || turnPhase !== 'action') return
    assignManaToRecipe(recipe.id, manaType, 1)
  }

  const difficultyColor = recipe.difficulty === 'advanced' ? '#8b5a9f' : '#4d9f5d'

  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-2"
      style={{
        background: '#1a1a1a',
        border: `1px solid ${difficultyColor}`,
        minWidth: 180,
        maxWidth: 220,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm" style={{ color: difficultyColor }}>
          🧪 {recipe.name}
        </span>
        <span
          className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded"
          style={{ background: difficultyColor + '22', color: difficultyColor }}
        >
          {recipe.difficulty}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        {recipe.progress.map((p) => (
          <button
            key={p.manaType}
            onClick={() => handleAssign(p.manaType)}
            disabled={!isActive || !isCurrentPlayer || turnPhase !== 'action'}
            className="w-full text-left rounded transition-colors"
            style={{
              cursor: isActive && isCurrentPlayer && turnPhase === 'action' && p.contributed < p.required
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

      {isActive && isCurrentPlayer && turnPhase === 'action' && player && (
        <p className="text-[9px] text-gray-600 italic">Click a progress bar to assign mana</p>
      )}
    </div>
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
          <p className="text-xs uppercase tracking-widest text-green-500 mb-1">
            ✓ Completed ({completedRecipes.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {completedRecipes.map((r) => (
              <div
                key={r.id}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold"
                style={{ background: '#4d9f5d22', color: '#4d9f5d', border: '1px solid #4d9f5d' }}
              >
                ✨ {r.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
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
            <p className="text-gray-600 text-sm italic">All recipes complete!</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecipeBoard
