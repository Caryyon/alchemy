// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Player Panel Component
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React from 'react'
import type { Player, ManaType } from '../types/game'
import { MANA_COLORS } from '../data/cards'
import { getClass } from '../data/classes'
import { useGameStore } from '../store/gameStore'

interface PlayerPanelProps {
  player: Player
  isActive: boolean
  compact?: boolean
}

const MANA_TYPES: ManaType[] = ['Fire', 'Nature', 'Lunar', 'Arcane', 'Shadow', 'Any']

function ManaPoolDisplay({ pool, isActive }: { pool: Record<ManaType, number>; isActive: boolean }) {
  const hasAny = Object.values(pool).some((v) => v > 0)

  if (!hasAny) {
    return (
      <span className="text-gray-600 text-xs italic">
        {isActive ? 'No mana — play ingredients!' : 'Empty'}
      </span>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {MANA_TYPES.map((type) => {
        const amount = pool[type]
        if (!amount) return null
        const color = MANA_COLORS[type]
        return (
          <div
            key={type}
            className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ background: color + '22', color, border: `1px solid ${color}` }}
          >
            <span>{amount}</span>
            <span className="text-[10px]">{type}</span>
          </div>
        )
      })}
    </div>
  )
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({ player, isActive, compact = false }) => {
  const { useSpecialPower, turnPhase } = useGameStore()
  const cls = getClass(player.classId)

  const totalMana = Object.values(player.manaPool).reduce((a, b) => a + b, 0)
  const canUseSpecial =
    isActive &&
    turnPhase === 'action' &&
    !player.usedSpecialPower &&
    totalMana >= cls.manaThreshold

  const handleSpecialPower = () => {
    if (!canUseSpecial) return
    // Classes that need a target or card selection
    if (['bard'].includes(player.classId)) {
      // Will set pendingAction
      useSpecialPower(undefined, undefined)
    } else {
      useSpecialPower(undefined, undefined)
    }
  }

  if (compact) {
    return (
      <div
        className="rounded-xl p-3 flex items-center gap-3"
        style={{
          background: '#1a1a1a',
          border: `1px solid ${isActive ? cls.color : '#2f2f2f'}`,
        }}
      >
        <span className="text-xl">{cls.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm truncate" style={{ color: isActive ? cls.color : '#888' }}>
              {player.name}
            </p>
            {player.hexed && <span className="text-[10px] text-purple-400">🔮 Hexed</span>}
            {player.protected && <span className="text-[10px] text-yellow-400">🛡️ Protected</span>}
          </div>
          <p className="text-xs text-gray-500">{cls.name}</p>
          <p className="text-xs text-gray-500">
            ✅ {player.completedRecipes.length} | 📜 {player.recipes.length} left | 🃏 {player.hand.length} cards
          </p>
        </div>
        {isActive && (
          <span className="text-green-400 text-xs font-bold animate-pulse">ACTIVE</span>
        )}
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{
        background: '#1a1a1a',
        border: `2px solid ${isActive ? cls.color : '#2f2f2f'}`,
        boxShadow: isActive ? `0 0 20px ${cls.color}33` : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{cls.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-lg" style={{ color: cls.color }}>
              {player.name}
            </h3>
            <span className="text-xs text-gray-500">{cls.name}</span>
            {player.hexed && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900 text-purple-300">
                🔮 Hexed
              </span>
            )}
            {player.protected && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900 text-yellow-300">
                🛡️ Protected
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{cls.description}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold" style={{ color: '#4d9f5d' }}>
            {player.completedRecipes.length}
          </p>
          <p className="text-[10px] text-gray-500">/ 5 brewed</p>
        </div>
      </div>

      {/* Mana Pool */}
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Mana Pool</p>
        <ManaPoolDisplay pool={player.manaPool} isActive={isActive} />
      </div>

      {/* Special Power */}
      <div
        className="rounded-lg p-2"
        style={{ background: '#0d0d0d', border: '1px solid #2f2f2f' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-0.5">
              Class Power — {cls.manaThreshold} mana
            </p>
            <p className="text-xs text-gray-300">{cls.passiveAbility}</p>
          </div>
          {isActive && (
            <button
              onClick={handleSpecialPower}
              disabled={!canUseSpecial}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex-shrink-0"
              style={{
                background: canUseSpecial ? cls.color : '#2f2f2f',
                color: canUseSpecial ? '#fff' : '#555',
                cursor: canUseSpecial ? 'pointer' : 'not-allowed',
                boxShadow: canUseSpecial ? `0 0 10px ${cls.color}88` : 'none',
              }}
            >
              {player.usedSpecialPower ? '✓ Used' : `Use (${cls.manaThreshold})`}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-xs text-gray-500">
        <span>🃏 {player.hand.length} in hand</span>
        <span>✨ {player.spellDeck.length} spells</span>
        <span>📜 {player.recipes.length} active recipes</span>
      </div>
    </div>
  )
}

export default PlayerPanel
