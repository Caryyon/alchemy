// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Card Component (AAA visual overhaul)
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import type { Card as CardType, IngredientCard, SpellCard, ManaType } from '../types/game'
import { MANA_COLORS } from '../data/cards'

type CardSize = 'xs' | 'sm' | 'md'

interface CardProps {
  card: CardType
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
  compact?: boolean
  faceDown?: boolean
  rotation?: number
  size?: CardSize
}

// Mana type gradients for card art area
const MANA_ART_GRADIENTS: Record<ManaType, string> = {
  Fire: 'linear-gradient(135deg, #3a0f00 0%, #8b2500 50%, #d4774a33 100%)',
  Nature: 'linear-gradient(135deg, #0a1a0a 0%, #1a4a1a 50%, #4d9f5d33 100%)',
  Lunar: 'linear-gradient(135deg, #1a0a2a 0%, #3a1a5a 50%, #8b5a9f33 100%)',
  Arcane: 'linear-gradient(135deg, #0a1a2a 0%, #1a2a4a 50%, #5c8a8a33 100%)',
  Shadow: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #4a6b8a33 100%)',
  Any: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a3a 50%, #c9a84c22 100%)',
}

function getManaType(card: CardType): ManaType {
  if (card.type === 'ingredient') return (card as IngredientCard).manaType
  if (card.type === 'spell') return (card as SpellCard).manaType
  return 'Any'
}

function getCardAccent(card: CardType): string {
  const mana = getManaType(card)
  return MANA_COLORS[mana] ?? '#8b6b47'
}

// ── Mana gem dots ─────────────────────────────────────────────────────────────
function ManaGems({ card, compact, size }: { card: CardType; compact?: boolean; size?: CardSize }) {
  const gemSize = size === 'xs' ? 4 : compact ? 6 : 8

  if (card.type === 'ingredient') {
    const ing = card as IngredientCard
    const color = MANA_COLORS[ing.manaType]
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(ing.manaValue, 5) }, (_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
            style={{
              width: gemSize,
              height: gemSize,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${color}ff, ${color}88)`,
              boxShadow: `0 0 ${gemSize / 2}px ${color}aa, inset 0 1px 2px rgba(255,255,255,0.3)`,
              border: `1px solid ${color}cc`,
            }}
          />
        ))}
        {ing.manaValue > 5 && (
          <span style={{ fontSize: 9, color, fontFamily: 'Cinzel, serif', fontWeight: 700 }}>+{ing.manaValue - 5}</span>
        )}
      </div>
    )
  }
  if (card.type === 'spell') {
    const sp = card as SpellCard
    const color = MANA_COLORS[sp.manaType]
    const orbSize = size === 'xs' ? 10 : compact ? 14 : 18
    const orbFontSize = size === 'xs' ? 6 : compact ? 8 : 10
    return (
      <div className="flex items-center gap-1">
        <motion.div
          whileHover={{ scale: 1.1 }}
          style={{
            width: orbSize,
            height: orbSize,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${color}ff, ${color}55)`,
            boxShadow: `0 0 8px ${color}88, inset 0 1px 2px rgba(255,255,255,0.3)`,
            border: `1px solid ${color}aa`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: orbFontSize,
            fontFamily: 'Cinzel, serif',
            fontWeight: 700,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {sp.manaCost}
        </motion.div>
      </div>
    )
  }
  return null
}

// ── Card art area ─────────────────────────────────────────────────────────────
function CardArt({ card, height, compact }: { card: CardType; height: number; compact?: boolean }) {
  const manaType = getManaType(card)
  const gradient = MANA_ART_GRADIENTS[manaType]

  if (card.image) {
    return (
      <div style={{ height, width: '100%', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
        <img
          src={card.image}
          alt={card.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
          }}
        />
        {/* Art overlay vignette */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, transparent 50%, rgba(10,5,20,0.7) 100%)',
        }} />
        {/* Grain texture overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
        }} />
      </div>
    )
  }

  const emoji =
    card.type === 'ingredient' ? '🌿'
    : card.type === 'recipe'   ? '🧪'
    : card.type === 'scroll'   ? '📜'
    : '✨'

  return (
    <div
      style={{
        height,
        width: '100%',
        flexShrink: 0,
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <motion.span
        animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          fontSize: compact ? 24 : 44,
          filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.4))',
        }}
      >
        {emoji}
      </motion.span>
      {/* Grain texture overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        pointerEvents: 'none',
      }} />
    </div>
  )
}

// ── Rarity indicator ───────────────────────────────────────────────────────────
function RarityBadge({ rarity }: { rarity: string }) {
  if (rarity === 'common') return null
  const isRare = rarity === 'rare'
  return (
    <motion.span
      animate={{ opacity: [1, 0.7, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className={isRare ? 'rare-shimmer' : 'uncommon-shimmer'}
      style={{ fontSize: 9, fontFamily: 'Cinzel, serif', fontWeight: 700 }}
    >
      {isRare ? '◆ RARE' : '◇ UNCOMMON'}
    </motion.span>
  )
}

// ── Type tag ──────────────────────────────────────────────────────────────────
function TypeTag({ card }: { card: CardType }) {
  const icons: Record<CardType['type'], string> = {
    ingredient: '⚗️',
    recipe: '🧪',
    spell: '✨',
    scroll: '📖',
  }
  const accent = getCardAccent(card)
  return (
    <span style={{
      fontSize: 8,
      fontFamily: 'Cinzel, serif',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: accent,
      padding: '2px 6px',
      borderRadius: 4,
      background: `${accent}15`,
      border: `1px solid ${accent}33`,
    }}>
      {icons[card.type]} {card.type}
    </span>
  )
}

// ── Main Card component ───────────────────────────────────────────────────────
export const CardComponent: React.FC<CardProps> = ({
  card,
  onClick,
  selected = false,
  disabled = false,
  compact = false,
  faceDown = false,
  rotation = 0,
  size,
}) => {
  const [hovered, setHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const accent = getCardAccent(card)

  // When size prop is provided, the card fills its container (100%×100%)
  // and adjusts internal sizing accordingly
  const fillContainer = size === 'xs' || size === 'sm'
  const effectiveCompact = compact || fillContainer

  const artHeight = size === 'xs' ? 36 : size === 'sm' ? 44 : compact ? 44 : 96

  const isIngredient = card.type === 'ingredient'
  const rarity = isIngredient ? (card as IngredientCard).rarity : 'common'
  const isRare = rarity === 'rare'
  const isUncommon = rarity === 'uncommon'

  // When filling container, use 100% dimensions; otherwise use fixed sizes
  const cardWidth = fillContainer ? '100%' : compact ? 76 : 148
  const cardHeight = fillContainer ? '100%' : compact ? 108 : 220

  // ── Face-down ───────────────────────────────────────────────────────────
  if (faceDown) {
    const faceDownWidth = fillContainer ? '100%' : effectiveCompact ? 72 : 110
    const faceDownHeight = fillContainer ? '100%' : effectiveCompact ? 100 : 154
    return (
      <motion.div
        whileHover={{ scale: 1.02, rotateY: 5 }}
        className="relative rounded-xl overflow-hidden flex-shrink-0"
        style={{
          width: faceDownWidth,
          height: faceDownHeight,
          background: 'linear-gradient(135deg, #12082a 0%, #1e1428 25%, #2a1040 50%, #1e1428 75%, #12082a 100%)',
          border: '2px solid #8b5a9f55',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6), inset 0 0 30px rgba(139,90,159,0.15)',
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 4,
          border: '1px solid #8b5a9f44',
          borderRadius: 8,
          background: 'radial-gradient(ellipse at 50% 40%, #8b5a9f22, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <motion.span
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{ fontSize: size === 'xs' ? 14 : effectiveCompact ? 20 : 32, filter: 'drop-shadow(0 0 8px #8b5a9f66)' }}
          >
            ⚗️
          </motion.span>
        </div>
        {/* Inner pattern */}
        <div style={{
          position: 'absolute',
          inset: 12,
          border: '1px dashed #8b5a9f33',
          borderRadius: 4,
        }} />
      </motion.div>
    )
  }

  // ── Face-up card ─────────────────────────────────────────────────────────
  const borderColor = selected ? '#c9a84c' : hovered ? accent : `${accent}66`
  const glowIntensity = selected ? 'high' : hovered ? 'medium' : isRare ? 'low' : 'none'

  const glowStyles: Record<string, string> = {
    high: `0 0 0 2px ${accent}88, 0 0 30px ${accent}88, 0 0 60px ${accent}44`,
    medium: `0 0 20px ${accent}66, 0 0 40px ${accent}33`,
    low: `0 0 15px #c9a84c33`,
    none: '0 4px 16px rgba(0,0,0,0.5)',
  }

  const translateY = selected ? -12 : hovered ? -8 : 0
  const scale = selected ? 1.06 : hovered ? 1.04 : 1

  return (
    <motion.div
      ref={cardRef}
      onClick={!disabled ? onClick : undefined}
      onHoverStart={() => !disabled && setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      animate={{
        y: translateY,
        scale,
        rotateZ: rotation,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`
        relative flex-shrink-0 flex flex-col
        ${isRare && !effectiveCompact ? 'rare-card' : ''}
        ${onClick && !disabled ? 'cursor-pointer' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
      style={{
        width: cardWidth,
        height: cardHeight,
        borderRadius: 12,
        border: `1.5px solid ${borderColor}`,
        boxShadow: glowStyles[glowIntensity],
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #1e1228 0%, #0f0a1a 100%)',
        transition: 'border-color 0.2s ease',
        '--card-rot': `${rotation}deg`,
      } as React.CSSProperties}
    >
      {/* Outer frame inset glow */}
      <div style={{
        position: 'absolute',
        inset: 3,
        borderRadius: 9,
        border: `1px solid ${accent}22`,
        pointerEvents: 'none',
        zIndex: 10,
      }} />

      {/* Shine effect on hover */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: hovered ? '200%' : '-100%' }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 15,
        }}
      />

      {/* Rare/uncommon border shimmer strip */}
      {isRare && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 12,
          border: '2px solid transparent',
          background: `linear-gradient(#12082a, #12082a) padding-box, linear-gradient(90deg, #c9a84c, #fff0a0, #c9a84c, #ffd700) border-box`,
          backgroundSize: '200% auto',
          animation: 'shimmer-border 2s linear infinite',
          pointerEvents: 'none',
          zIndex: 9,
        }} />
      )}
      {isUncommon && !effectiveCompact && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 12,
          border: '2px solid transparent',
          background: `linear-gradient(#12082a, #12082a) padding-box, linear-gradient(90deg, #8888aa, #ccccdd, #8888aa) border-box`,
          backgroundSize: '200% auto',
          animation: 'shimmer-border 3s linear infinite',
          pointerEvents: 'none',
          zIndex: 9,
        }} />
      )}

      {/* Art area */}
      <CardArt card={card} height={artHeight} compact={effectiveCompact} />

      {/* Metallic divider with gem accent */}
      <div style={{
        height: 2,
        background: `linear-gradient(90deg, transparent 5%, ${accent}66 20%, ${accent}aa 50%, ${accent}66 80%, transparent 95%)`,
        flexShrink: 0,
        position: 'relative',
      }}>
        {/* Center gem dot */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${accent}, ${accent}88)`,
          boxShadow: `0 0 6px ${accent}`,
        }} />
      </div>

      {/* Card info body */}
      <div style={{
        padding: size === 'xs' ? '3px 4px' : effectiveCompact ? '5px 6px' : '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: size === 'xs' ? 2 : effectiveCompact ? 3 : 4,
        flex: 1,
        overflow: 'hidden',
        background: 'linear-gradient(175deg, rgba(26,18,32,0.95) 0%, rgba(14,8,22,0.98) 100%)',
      }}>
        {!effectiveCompact && <TypeTag card={card} />}

        {/* Card name */}
        <p style={{
          fontFamily: 'Cinzel, serif',
          fontWeight: 700,
          fontSize: size === 'xs' ? 7 : effectiveCompact ? 9 : 12,
          color: accent,
          lineHeight: 1.2,
          textShadow: `0 0 10px ${accent}44`,
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: size === 'xs' ? 'nowrap' : undefined,
        }}>
          {card.name}
        </p>

        {/* Mana gems */}
        <ManaGems card={card} compact={effectiveCompact} size={size} />

        {!effectiveCompact && (
          <>
            {/* Description */}
            <p style={{
              fontFamily: 'Crimson Text, serif',
              fontStyle: 'italic',
              fontSize: 10,
              color: '#b8a898',
              lineHeight: 1.35,
              margin: 0,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}>
              {card.description}
            </p>

            {/* Rarity */}
            {isIngredient && (
              <div style={{ marginTop: 'auto' }}>
                <RarityBadge rarity={rarity} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Selected pulse ring */}
      {selected && (
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.02, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: 14,
            border: '2px solid #c9a84c',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        />
      )}
    </motion.div>
  )
}

export default CardComponent
