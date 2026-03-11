// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Compact Mobile Mana Display
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { motion } from 'framer-motion'
import type { ManaType } from '../types/game'
import { MANA_COLORS } from '../data/cards'

const MANA_EMOJIS: Record<ManaType, string> = {
  Fire: '🔥',
  Nature: '🌿',
  Lunar: '🌙',
  Arcane: '🔮',
  Shadow: '🕷️',
  Any: '✦',
}

const MANA_TYPES: ManaType[] = ['Fire', 'Nature', 'Lunar', 'Arcane', 'Shadow', 'Any']

interface ManaDisplayProps {
  pool: Record<ManaType, number>
  isActive?: boolean
  size?: 'sm' | 'md'
  onManaClick?: (manaType: ManaType) => void
  highlightTypes?: ManaType[]
}

// Compact pip display for a single mana type
function ManaPips({
  manaType,
  amount,
  size = 'md',
  onClick,
  highlight = false,
}: {
  manaType: ManaType
  amount: number
  size?: 'sm' | 'md'
  onClick?: () => void
  highlight?: boolean
}) {
  const color = MANA_COLORS[manaType] ?? '#8b6b47'
  const emoji = MANA_EMOJIS[manaType]
  const pipSize = size === 'sm' ? 6 : 8
  const fontSize = size === 'sm' ? 12 : 14
  const isClickable = !!onClick && amount > 0

  return (
    <motion.button
      onClick={isClickable ? onClick : undefined}
      whileHover={isClickable ? { scale: 1.1 } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      disabled={!isClickable}
      className="flex items-center gap-1"
      style={{
        background: highlight ? `${color}22` : 'transparent',
        border: highlight ? `1px solid ${color}66` : '1px solid transparent',
        borderRadius: 16,
        padding: '3px 8px',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
      }}
    >
      <span style={{ fontSize: fontSize - 2 }}>{emoji}</span>
      <span
        style={{
          fontFamily: 'Cinzel, serif',
          fontWeight: 700,
          fontSize,
          color,
          textShadow: `0 0 8px ${color}44`,
          minWidth: 16,
        }}
      >
        {amount}
      </span>
      {/* Colored pip dots */}
      <div className="flex gap-0.5">
        {Array.from({ length: Math.min(amount, 5) }, (_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05 }}
            style={{
              width: pipSize,
              height: pipSize,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${color}ff, ${color}88)`,
              boxShadow: `0 0 4px ${color}88`,
            }}
          />
        ))}
        {amount > 5 && (
          <span style={{ fontSize: 9, color, fontFamily: 'Cinzel, serif', marginLeft: 2 }}>
            +{amount - 5}
          </span>
        )}
      </div>
    </motion.button>
  )
}

// Compact mana display for mobile
export const ManaDisplay: React.FC<ManaDisplayProps> = ({
  pool,
  isActive = false,
  size = 'md',
  onManaClick,
  highlightTypes = [],
}) => {
  const hasAny = Object.values(pool).some((v) => v > 0)
  const totalMana = Object.values(pool).reduce((a, b) => a + b, 0)

  if (!hasAny) {
    return (
      <div className="flex items-center gap-2">
        <span style={{
          fontFamily: 'Crimson Text, serif',
          fontStyle: 'italic',
          color: '#6b5a7a',
          fontSize: size === 'sm' ? 11 : 13
        }}>
          {isActive ? 'No mana — play ingredients!' : 'Empty'}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {MANA_TYPES.map((type) => {
        const amount = pool[type]
        if (!amount) return null
        return (
          <ManaPips
            key={type}
            manaType={type}
            amount={amount}
            size={size}
            onClick={onManaClick ? () => onManaClick(type) : undefined}
            highlight={highlightTypes.includes(type)}
          />
        )
      })}
      <span style={{
        fontFamily: 'Cinzel, serif',
        fontSize: size === 'sm' ? 10 : 11,
        color: '#6b5a7a',
        marginLeft: 4,
      }}>
        = {totalMana}
      </span>
    </div>
  )
}

// Mobile-optimized recipe progress display using pips
export function RecipeProgressPips({
  progress,
  size = 'md'
}: {
  progress: { manaType: ManaType; contributed: number; required: number }[]
  size?: 'sm' | 'md'
}) {
  const pipSize = size === 'sm' ? 5 : 6

  return (
    <div className="flex flex-wrap gap-2">
      {progress.map((p) => {
        const color = MANA_COLORS[p.manaType]
        const emoji = MANA_EMOJIS[p.manaType]
        const isDone = p.contributed >= p.required

        return (
          <div key={p.manaType} className="flex items-center gap-1">
            <span style={{ fontSize: size === 'sm' ? 10 : 12 }}>{emoji}</span>
            <div className="flex gap-0.5">
              {Array.from({ length: p.required }, (_, i) => {
                const filled = i < p.contributed
                return (
                  <div
                    key={i}
                    style={{
                      width: pipSize,
                      height: pipSize,
                      borderRadius: '50%',
                      background: filled
                        ? `radial-gradient(circle at 35% 35%, ${color}ff, ${color}88)`
                        : 'rgba(30,20,40,0.6)',
                      border: `1px solid ${filled ? color : '#4a3a5a'}`,
                      boxShadow: filled ? `0 0 4px ${color}66` : 'none',
                    }}
                  />
                )
              })}
            </div>
            {isDone && (
              <span style={{ fontSize: 8, color: '#4d9f5d' }}>✓</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Inline mana cost display
export function ManaCostDisplay({
  manaType,
  cost
}: {
  manaType: ManaType
  cost: number
}) {
  const color = MANA_COLORS[manaType]
  const emoji = MANA_EMOJIS[manaType]

  return (
    <span className="inline-flex items-center gap-1" style={{
      padding: '2px 6px',
      borderRadius: 12,
      background: `${color}22`,
      border: `1px solid ${color}44`,
    }}>
      <span style={{ fontSize: 10 }}>{emoji}</span>
      <span style={{
        fontFamily: 'Cinzel, serif',
        fontWeight: 700,
        fontSize: 11,
        color
      }}>
        {cost}
      </span>
    </span>
  )
}

export default ManaDisplay
