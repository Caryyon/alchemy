// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Mana Orb Component (AAA visual overhaul)
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

// Light/dark variants for gradient
const MANA_LIGHT_COLORS: Record<ManaType, string> = {
  Fire: '#ff8844',
  Nature: '#66cc77',
  Lunar: '#bb88dd',
  Arcane: '#88cccc',
  Shadow: '#7799bb',
  Any: '#eedd88',
}

interface ManaOrbProps {
  manaType: ManaType
  amount: number
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  showGain?: boolean
}

export const ManaOrb: React.FC<ManaOrbProps> = ({
  manaType,
  amount,
  size = 'md',
  pulse = false,
  showGain = false,
}) => {
  const color = MANA_COLORS[manaType] ?? '#8b6b47'
  const lightColor = MANA_LIGHT_COLORS[manaType] ?? '#ccaa77'
  const emoji = MANA_EMOJIS[manaType]

  const dims = size === 'sm' ? 28 : size === 'lg' ? 48 : 36
  const fontSize = size === 'sm' ? 11 : size === 'lg' ? 18 : 14

  return (
    <motion.div
      initial={showGain ? { scale: 0, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className="flex-shrink-0 relative"
      style={{
        width: dims,
        height: dims,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${lightColor} 0%, ${color} 50%, ${color}88 100%)`,
        border: `2px solid ${color}cc`,
        boxShadow: `
          0 0 ${dims / 2}px ${color}66,
          0 0 ${dims}px ${color}33,
          inset 0 2px 4px rgba(255,255,255,0.4),
          inset 0 -2px 4px rgba(0,0,0,0.3)
        `,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Inner glow highlight */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '20%',
          width: '30%',
          height: '20%',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.35)',
          filter: 'blur(2px)',
        }}
      />

      {/* Amount text */}
      <motion.span
        animate={pulse ? { scale: [1, 1.2, 1] } : {}}
        transition={pulse ? { duration: 0.5, repeat: 2 } : {}}
        style={{
          fontSize,
          fontFamily: 'Cinzel, serif',
          fontWeight: 700,
          color: '#fff',
          textShadow: `0 0 8px ${color}, 0 1px 2px rgba(0,0,0,0.5)`,
          lineHeight: 1,
          zIndex: 1,
        }}
      >
        {amount}
      </motion.span>

      {/* Emoji indicator */}
      <span
        style={{
          position: 'absolute',
          bottom: -2,
          right: -4,
          fontSize: size === 'sm' ? 8 : 10,
          lineHeight: 1,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
        }}
      >
        {emoji}
      </span>

      {/* Pulse animation ring */}
      {pulse && (
        <motion.div
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `2px solid ${color}`,
          }}
        />
      )}
    </motion.div>
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
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          fontFamily: 'Crimson Text, serif',
          fontStyle: 'italic',
          color: '#6b5a7a',
          fontSize: 13,
        }}
      >
        {isActive ? 'No mana yet — play ingredients!' : 'Empty'}
      </motion.span>
    )
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <AnimatePresence mode="popLayout">
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
              showGain
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default ManaOrb
