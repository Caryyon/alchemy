// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Player Panel (magical redesign)
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { motion } from 'framer-motion'
import type { Player } from '../types/game'
import { getClass } from '../data/classes'
import { useGameStore } from '../store/gameStore'
import { ManaPoolOrbs } from './ManaOrb'

interface PlayerPanelProps {
  player: Player
  isActive: boolean
  compact?: boolean
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
    useSpecialPower(undefined, undefined)
  }

  // ── Compact (opponent view) ───────────────────────────────────────────────
  if (compact) {
    return (
      <motion.div
        className="rounded-xl p-3 flex items-center gap-3"
        style={{
          background: 'rgba(20,12,30,0.85)',
          border: `1px solid ${isActive ? cls.color + '88' : '#4a3a5a'}`,
          boxShadow: isActive ? `0 0 12px ${cls.color}33` : 'none',
        }}
        animate={isActive ? { boxShadow: [`0 0 8px ${cls.color}44`, `0 0 18px ${cls.color}66`, `0 0 8px ${cls.color}44`] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span style={{ fontSize: 24, filter: `drop-shadow(0 0 4px ${cls.color}88)` }}>{cls.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 13, color: isActive ? cls.color : '#b8a898', margin: 0 }}>
              {player.name}
            </p>
            {player.hexed && <span style={{ fontSize: 10, color: '#8b5a9f', fontFamily: 'Crimson Text, serif' }}>🔮 Hexed</span>}
            {player.protected && <span style={{ fontSize: 10, color: '#c9a84c', fontFamily: 'Crimson Text, serif' }}>🛡️ Protected</span>}
          </div>
          <p style={{ fontFamily: 'Crimson Text, serif', color: '#6b5a7a', fontSize: 12, margin: '2px 0' }}>
            {cls.name}
          </p>
          <p style={{ fontFamily: 'Crimson Text, serif', color: '#6b5a7a', fontSize: 12, margin: 0 }}>
            ✅ {player.completedRecipes.length} brewed · 🃏 {player.hand.length} cards
          </p>
        </div>
        {isActive && (
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ fontFamily: 'Cinzel, serif', color: '#4d9f5d', fontSize: 10, fontWeight: 700 }}
          >
            ACTIVE
          </motion.span>
        )}
      </motion.div>
    )
  }

  // ── Full view (current player) ────────────────────────────────────────────
  return (
    <motion.div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        background: 'linear-gradient(160deg, rgba(26,18,40,0.95), rgba(14,8,22,0.98))',
        border: `2px solid ${isActive ? cls.color : '#4a3a5a'}`,
        boxShadow: isActive ? `0 0 30px ${cls.color}33, inset 0 0 40px ${cls.color}11` : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <motion.span
          style={{ fontSize: 40, filter: `drop-shadow(0 0 8px ${cls.color}88)` }}
          animate={{ filter: [`drop-shadow(0 0 6px ${cls.color}66)`, `drop-shadow(0 0 14px ${cls.color}cc)`, `drop-shadow(0 0 6px ${cls.color}66)`] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {cls.emoji}
        </motion.span>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: 18, color: cls.color, margin: 0 }}>
              {player.name}
            </h3>
            <span style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#6b5a7a', fontSize: 14 }}>
              {cls.name}
            </span>
            {player.hexed && (
              <span style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 20,
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
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 20,
                background: '#c9a84c22',
                color: '#c9a84c',
                border: '1px solid #c9a84c55',
                fontFamily: 'Cinzel, serif',
              }}>
                🛡️ Protected
              </span>
            )}
          </div>
          <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#6b5a7a', fontSize: 13, margin: '2px 0 0 0' }}>
            {cls.description}
          </p>
        </div>

        {/* Recipe count */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <motion.p
            style={{ fontFamily: 'Cinzel, serif', fontWeight: 900, fontSize: 32, color: '#4d9f5d', margin: 0, lineHeight: 1 }}
            animate={{ textShadow: ['0 0 8px #4d9f5d44', '0 0 20px #4d9f5d88', '0 0 8px #4d9f5d44'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {player.completedRecipes.length}
          </motion.p>
          <p style={{ fontFamily: 'Crimson Text, serif', color: '#4a3a5a', fontSize: 11, margin: 0 }}>
            / 5 brewed
          </p>
        </div>
      </div>

      {/* Mana pool */}
      <div>
        <p style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6b5a7a', marginBottom: 8 }}>
          Mana Pool
        </p>
        <ManaPoolOrbs pool={player.manaPool} isActive={isActive} />
      </div>

      {/* Special power button */}
      <div
        className="rounded-xl p-3"
        style={{
          background: 'rgba(10,5,18,0.6)',
          border: `1px solid ${canUseSpecial ? cls.color + '66' : '#4a3a5a'}`,
          transition: 'all 0.3s ease',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b5a7a', marginBottom: 4 }}>
              Class Power — {cls.manaThreshold} Mana
            </p>
            <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#b8a898', fontSize: 13, margin: 0 }}>
              {cls.passiveAbility}
            </p>
          </div>
          {isActive && (
            <motion.button
              onClick={handleSpecialPower}
              disabled={!canUseSpecial}
              whileHover={canUseSpecial ? { scale: 1.06 } : {}}
              whileTap={canUseSpecial ? { scale: 0.95 } : {}}
              animate={canUseSpecial ? {
                boxShadow: [`0 0 8px ${cls.color}66`, `0 0 18px ${cls.color}aa`, `0 0 8px ${cls.color}66`]
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                fontFamily: 'Cinzel, serif',
                fontWeight: 700,
                fontSize: 12,
                background: canUseSpecial ? `linear-gradient(135deg, ${cls.color}cc, ${cls.color}88)` : '#2a1a3a',
                color: canUseSpecial ? '#fff' : '#4a3a5a',
                border: `1px solid ${canUseSpecial ? cls.color : '#4a3a5a'}`,
                cursor: canUseSpecial ? 'pointer' : 'not-allowed',
                flexShrink: 0,
              }}
            >
              {player.usedSpecialPower ? '✓ Used' : `⚡ Use (${cls.manaThreshold})`}
            </motion.button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs flex-wrap">
        {[
          { icon: '🃏', value: player.hand.length, label: 'in hand' },
          { icon: '✨', value: player.spellDeck.length, label: 'spells' },
          { icon: '📜', value: player.recipes.length, label: 'active recipes' },
        ].map(({ icon, value, label }) => (
          <span key={label} style={{ fontFamily: 'Crimson Text, serif', color: '#6b5a7a', fontSize: 13 }}>
            {icon} {value} {label}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

export default PlayerPanel
