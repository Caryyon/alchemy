// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Mana Orb Component
// ────────────────────────────────────────────────────────────────────────────

import React from 'react'
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

interface ManaOrbProps {
  manaType: ManaType
  amount: number
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
}

export const ManaOrb: React.FC<ManaOrbProps> = ({ manaType, amount, size = 'md', pulse = false }) => {
  const color = MANA_COLORS[manaType] ?? '#8b6b47'
  const emoji = MANA_EMOJIS[manaType]

  const dims = size === 'sm' ? 28 : size === 'lg' ? 48 : 36
  const fontSize = size === 'sm' ? 11 : size === 'lg' ? 18 : 14

  return (
    <div
      className="mana-orb flex-shrink-0 relative"
      style={{
        width: dims,
        height: dims,
        background: `radial-gradient(circle at 35% 35%, ${color}dd 0%, ${color}88 50%, ${color}33 100%)`,
        border: `2px solid ${color}cc`,
        boxShadow: `0 0 12px ${color}66, inset 0 0 8px ${color}22`,
        animation: pulse ? 'pulse-orb 1s ease-in-out 3' : 'pulse-orb 2.5s ease-in-out infinite',
      }}
    >
      <span
        style={{
          fontSize,
          fontFamily: 'Cinzel, serif',
          fontWeight: 700,
          color: '#fff',
          textShadow: `0 0 8px ${color}`,
          lineHeight: 1,
        }}
      >
        {amount}
      </span>
      {/* Tiny emoji indicator */}
      <span
        style={{
          position: 'absolute',
          bottom: -2,
          right: -4,
          fontSize: 9,
          lineHeight: 1,
        }}
      >
        {emoji}
      </span>
    </div>
  )
}

interface ManaPoolOrbsProps {
  pool: Record<ManaType, number>
  isActive: boolean
  pulseMana?: ManaType | null
}

const MANA_TYPES: ManaType[] = ['Fire', 'Nature', 'Lunar', 'Arcane', 'Shadow', 'Any']

export const ManaPoolOrbs: React.FC<ManaPoolOrbsProps> = ({ pool, isActive, pulseMana }) => {
  const hasAny = Object.values(pool).some((v) => v > 0)

  if (!hasAny) {
    return (
      <span style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#6b5a7a', fontSize: 13 }}>
        {isActive ? 'No mana yet — play ingredients!' : 'Empty'}
      </span>
    )
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {MANA_TYPES.map((type) => {
        const amount = pool[type]
        if (!amount) return null
        return (
          <ManaOrb
            key={type}
            manaType={type}
            amount={amount}
            size="md"
            pulse={pulseMana === type}
          />
        )
      })}
    </div>
  )
}

export default ManaOrb
