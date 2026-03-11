// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Character Card Component (mobile-first)
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import type { Player } from '../types/game'
import { getClass } from '../data/classes'
import { useGameStore } from '../store/gameStore'
import { ManaDisplay } from './ManaDisplay'

interface CharacterCardProps {
  player: Player
  isActive: boolean
  compact?: boolean
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  player,
  isActive,
  compact = false
}) => {
  const { useSpecialPower, turnPhase, players, currentPlayerIndex } = useGameStore()
  const cls = getClass(player.classId)
  const [imgError, setImgError] = useState(false)

  const currentPlayer = players[currentPlayerIndex]
  const isCurrentPlayer = player.id === currentPlayer?.id

  const totalMana = Object.values(player.manaPool).reduce((a, b) => a + b, 0)
  const canUseSpecial =
    isActive &&
    isCurrentPlayer &&
    turnPhase === 'action' &&
    !player.usedSpecialPower &&
    totalMana >= cls.manaThreshold

  const handleSpecialPower = () => {
    if (!canUseSpecial) return
    useSpecialPower(undefined, undefined)
  }

  const portraitPath = `/classes/${player.classId}-portrait.png`

  // ── Compact view (for opponent strip) ───────────────────────────────────────
  if (compact) {
    return (
      <motion.div
        className="flex items-center gap-2 rounded-xl p-2"
        style={{
          background: 'rgba(20,12,30,0.9)',
          border: `1px solid ${cls.color}44`,
          minWidth: 140,
          maxWidth: 180,
        }}
      >
        {/* Portrait/Emoji */}
        <div
          className="flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            background: `linear-gradient(135deg, ${cls.color}22, ${cls.color}11)`,
            border: `1px solid ${cls.color}44`,
          }}
        >
          {!imgError ? (
            <img
              src={portraitPath}
              alt={cls.name}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: 20, filter: `drop-shadow(0 0 4px ${cls.color}88)` }}>
              {cls.emoji}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span style={{
              fontFamily: 'Cinzel, serif',
              fontWeight: 700,
              fontSize: 11,
              color: cls.color,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {player.name}
            </span>
            {player.hexed && <span style={{ fontSize: 9 }}>🔮</span>}
            {player.protected && <span style={{ fontSize: 9 }}>🛡️</span>}
          </div>

          <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
            {/* Face-down cards indicator */}
            <div className="flex -space-x-1.5">
              {Array.from({ length: Math.min(player.hand.length, 4) }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: 10,
                    height: 14,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #2a1040, #1e1428)',
                    border: '1px solid #4a3a5a',
                  }}
                />
              ))}
              {player.hand.length > 4 && (
                <span style={{ fontSize: 8, color: '#6b5a7a', marginLeft: 3 }}>
                  +{player.hand.length - 4}
                </span>
              )}
            </div>

            {/* Recipe count */}
            <span style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 10,
              color: '#4d9f5d',
              fontWeight: 700,
            }}>
              ✨{player.completedRecipes.length}
            </span>

            {/* Total mana */}
            <span style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 10,
              color: '#6b5a7a',
            }}>
              ⚗️{totalMana}
            </span>
          </div>
        </div>
      </motion.div>
    )
  }

  // ── Full view (current player) ────────────────────────────────────────────────
  return (
    <motion.div
      className="flex flex-col gap-3 rounded-xl p-3"
      style={{
        background: 'linear-gradient(160deg, rgba(26,18,40,0.95), rgba(14,8,22,0.98))',
        border: `2px solid ${cls.color}88`,
        boxShadow: `0 0 20px ${cls.color}22, inset 0 0 30px ${cls.color}11`,
      }}
    >
      {/* Header row: portrait + info + completed count */}
      <div className="flex items-start gap-3">
        {/* Portrait */}
        <motion.div
          className="flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center"
          style={{
            width: 56,
            height: 56,
            background: `linear-gradient(135deg, ${cls.color}33, ${cls.color}11)`,
            border: `2px solid ${cls.color}66`,
            boxShadow: `0 0 12px ${cls.color}33`,
          }}
          animate={{
            boxShadow: [
              `0 0 8px ${cls.color}33`,
              `0 0 16px ${cls.color}55`,
              `0 0 8px ${cls.color}33`,
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {!imgError ? (
            <img
              src={portraitPath}
              alt={cls.name}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{
              fontSize: 32,
              filter: `drop-shadow(0 0 8px ${cls.color}88)`
            }}>
              {cls.emoji}
            </span>
          )}
        </motion.div>

        {/* Name + class + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 style={{
              fontFamily: 'Cinzel, serif',
              fontWeight: 700,
              fontSize: 16,
              color: cls.color,
              margin: 0,
            }}>
              {player.name}
            </h3>
            {player.hexed && (
              <span style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 12,
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
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 12,
                background: '#c9a84c22',
                color: '#c9a84c',
                border: '1px solid #c9a84c55',
                fontFamily: 'Cinzel, serif',
              }}>
                🛡️ Protected
              </span>
            )}
          </div>
          <p style={{
            fontFamily: 'Crimson Text, serif',
            fontStyle: 'italic',
            color: '#6b5a7a',
            fontSize: 12,
            margin: '2px 0 0 0',
          }}>
            {cls.name}
          </p>
        </div>

        {/* Completed recipes count */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <motion.p
            style={{
              fontFamily: 'Cinzel, serif',
              fontWeight: 900,
              fontSize: 28,
              color: '#4d9f5d',
              margin: 0,
              lineHeight: 1,
            }}
            animate={{
              textShadow: [
                '0 0 8px #4d9f5d44',
                '0 0 16px #4d9f5d88',
                '0 0 8px #4d9f5d44',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {player.completedRecipes.length}
          </motion.p>
          <p style={{
            fontFamily: 'Crimson Text, serif',
            color: '#4a3a5a',
            fontSize: 10,
            margin: 0,
          }}>
            / 5 brewed
          </p>
        </div>
      </div>

      {/* Mana pool */}
      <div>
        <p style={{
          fontFamily: 'Cinzel, serif',
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#6b5a7a',
          marginBottom: 6,
        }}>
          Mana Pool
        </p>
        <ManaDisplay pool={player.manaPool} isActive={isActive} size="md" />
      </div>

      {/* Special power button */}
      <div
        className="flex items-center gap-3 rounded-lg p-2.5"
        style={{
          background: 'rgba(10,5,18,0.6)',
          border: `1px solid ${canUseSpecial ? cls.color + '66' : '#4a3a5a'}`,
        }}
      >
        <div className="flex-1 min-w-0">
          <p style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#6b5a7a',
            marginBottom: 2,
          }}>
            Class Power — {cls.manaThreshold} Mana
          </p>
          <p style={{
            fontFamily: 'Crimson Text, serif',
            fontStyle: 'italic',
            color: '#b8a898',
            fontSize: 11,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {cls.passiveAbility}
          </p>
        </div>
        {isActive && isCurrentPlayer && (
          <motion.button
            onClick={handleSpecialPower}
            disabled={!canUseSpecial}
            whileHover={canUseSpecial ? { scale: 1.06 } : {}}
            whileTap={canUseSpecial ? { scale: 0.95 } : {}}
            animate={canUseSpecial ? {
              boxShadow: [
                `0 0 8px ${cls.color}66`,
                `0 0 14px ${cls.color}aa`,
                `0 0 8px ${cls.color}66`,
              ]
            } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontFamily: 'Cinzel, serif',
              fontWeight: 700,
              fontSize: 10,
              background: canUseSpecial
                ? `linear-gradient(135deg, ${cls.color}cc, ${cls.color}88)`
                : '#2a1a3a',
              color: canUseSpecial ? '#fff' : '#4a3a5a',
              border: `1px solid ${canUseSpecial ? cls.color : '#4a3a5a'}`,
              cursor: canUseSpecial ? 'pointer' : 'not-allowed',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {player.usedSpecialPower ? '✓ Used' : `⚡ ${cls.manaThreshold}`}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

export default CharacterCard
