// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Card Component (magical redesign)
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import type { Card as CardType, IngredientCard, SpellCard, ManaType } from '../types/game'
import { MANA_COLORS, MANA_GRADIENTS } from '../data/cards'

interface CardProps {
  card: CardType
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
  compact?: boolean
  faceDown?: boolean
  rotation?: number
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

function getGradient(card: CardType): string {
  const mana = getManaType(card)
  return MANA_GRADIENTS[mana] ?? MANA_GRADIENTS['Any']
}

// ── Mana gem dots ─────────────────────────────────────────────────────────────
function ManaGems({ card }: { card: CardType }) {
  if (card.type === 'ingredient') {
    const ing = card as IngredientCard
    const color = MANA_COLORS[ing.manaType]
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(ing.manaValue, 5) }, (_, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${color}ff, ${color}88)`,
              boxShadow: `0 0 4px ${color}88`,
            }}
          />
        ))}
        {ing.manaValue > 5 && (
          <span style={{ fontSize: 9, color, fontFamily: 'Cinzel, serif' }}>+{ing.manaValue - 5}</span>
        )}
      </div>
    )
  }
  if (card.type === 'spell') {
    const sp = card as SpellCard
    const color = MANA_COLORS[sp.manaType]
    return (
      <div className="flex items-center gap-1">
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${color}ff, ${color}55)`,
            boxShadow: `0 0 6px ${color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 8,
            fontFamily: 'Cinzel, serif',
            fontWeight: 700,
            color: '#fff',
          }}
        >
          {sp.manaCost}
        </div>
      </div>
    )
  }
  return null
}

// ── Card art area ─────────────────────────────────────────────────────────────
function CardArt({ card, height }: { card: CardType; height: number }) {
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
          background: 'linear-gradient(to bottom, transparent 60%, rgba(10,5,20,0.6) 100%)',
        }} />
      </div>
    )
  }

  const gradient = getGradient(card)
  const emoji =
    card.type === 'ingredient' ? '🌿'
    : card.type === 'recipe'   ? '🧪'
    : card.type === 'scroll'   ? '📜'
    : '✨'

  return (
    <div
      className={`bg-gradient-to-br ${gradient} flex items-center justify-center`}
      style={{ height, width: '100%', flexShrink: 0 }}
    >
      <span style={{ fontSize: height < 50 ? 20 : 40, filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }}>
        {emoji}
      </span>
    </div>
  )
}

// ── Rarity indicator ───────────────────────────────────────────────────────────
function RarityBadge({ rarity }: { rarity: string }) {
  if (rarity === 'common') return null
  const isRare = rarity === 'rare'
  return (
    <span className={isRare ? 'rare-shimmer' : 'uncommon-shimmer'} style={{ fontSize: 9, fontFamily: 'Cinzel, serif' }}>
      {isRare ? '◆ RARE' : '◇ UNCOMMON'}
    </span>
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
  return (
    <span style={{
      fontSize: 8,
      fontFamily: 'Cinzel, serif',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: '#8b7a6a',
      padding: '1px 4px',
      borderRadius: 3,
      background: 'rgba(0,0,0,0.4)',
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
}) => {
  const [hovered, setHovered] = useState(false)
  const accent = getCardAccent(card)
  const artHeight = compact ? 44 : 96

  const isIngredient = card.type === 'ingredient'
  const rarity = isIngredient ? (card as IngredientCard).rarity : 'common'
  const isRare = rarity === 'rare'
  const isUncommon = rarity === 'uncommon'

  const cardWidth = compact ? 76 : 148
  const cardHeight = compact ? 108 : 220

  // ── Face-down ───────────────────────────────────────────────────────────
  if (faceDown) {
    return (
      <div
        className="relative rounded-xl overflow-hidden flex-shrink-0 card-back-gradient"
        style={{
          width: compact ? 72 : 110,
          height: compact ? 100 : 154,
          border: '2px solid #8b5a9f44',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5), inset 0 0 20px rgba(139,90,159,0.1)',
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 4,
          border: '1px solid #8b5a9f33',
          borderRadius: 8,
          background: 'radial-gradient(ellipse at 50% 40%, #8b5a9f22, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: compact ? 18 : 28,
        }}>
          ⚗️
        </div>
      </div>
    )
  }

  // ── Face-up card ─────────────────────────────────────────────────────────
  const borderColor = selected ? '#ffffff' : hovered ? accent : accent + '88'
  const glowColor = selected
    ? `0 0 0 2px #fff, 0 0 24px ${accent}cc, 0 0 48px ${accent}44`
    : hovered
    ? `0 0 18px ${accent}88, 0 0 36px ${accent}33`
    : isRare
    ? `0 0 12px #c9a84c44`
    : 'none'

  const translateY = selected ? -10 : hovered ? -7 : 0
  const scale = selected ? 1.05 : hovered ? 1.04 : 1

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative flex-shrink-0 flex flex-col parchment
        ${isRare && !compact ? 'rare-card' : ''}
        ${onClick && !disabled ? 'cursor-pointer' : ''}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
      style={{
        width: cardWidth,
        height: cardHeight,
        borderRadius: 10,
        border: `2px solid ${borderColor}`,
        boxShadow: glowColor,
        overflow: 'hidden',
        transform: `translateY(${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        '--card-rot': `${rotation}deg`,
      } as React.CSSProperties}
    >
      {/* Outer frame inset glow */}
      <div style={{
        position: 'absolute',
        inset: 3,
        borderRadius: 7,
        border: `1px solid ${accent}33`,
        pointerEvents: 'none',
        zIndex: 10,
      }} />

      {/* Rare/uncommon border shimmer strip */}
      {isRare && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 10,
          border: '2px solid transparent',
          background: `linear-gradient(#12082a, #12082a) padding-box, linear-gradient(90deg, #c9a84c, #fff0a0, #c9a84c, #ffd700) border-box`,
          backgroundSize: '200% auto',
          animation: 'shimmer-border 2s linear infinite',
          pointerEvents: 'none',
          zIndex: 9,
        }} />
      )}
      {isUncommon && !compact && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 10,
          border: '2px solid transparent',
          background: `linear-gradient(#12082a, #12082a) padding-box, linear-gradient(90deg, #8888aa, #ccccdd, #8888aa) border-box`,
          backgroundSize: '200% auto',
          animation: 'shimmer-border 3s linear infinite',
          pointerEvents: 'none',
          zIndex: 9,
        }} />
      )}

      {/* Art area */}
      <CardArt card={card} height={artHeight} />

      {/* Divider */}
      <div style={{
        height: 1,
        background: `linear-gradient(90deg, transparent, ${accent}88, transparent)`,
        flexShrink: 0,
      }} />

      {/* Card info body */}
      <div style={{
        padding: compact ? '4px 5px' : '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? 2 : 3,
        flex: 1,
        overflow: 'hidden',
        background: 'linear-gradient(160deg, rgba(26,18,32,0.97), rgba(14,8,22,0.99))',
      }}>
        {!compact && <TypeTag card={card} />}

        {/* Card name */}
        <p style={{
          fontFamily: 'Cinzel, serif',
          fontWeight: 700,
          fontSize: compact ? 8 : 11,
          color: accent,
          lineHeight: 1.2,
          textShadow: `0 0 8px ${accent}44`,
          margin: 0,
        }}>
          {card.name}
        </p>

        {/* Mana gems */}
        <ManaGems card={card} />

        {!compact && (
          <>
            {/* Description */}
            <p style={{
              fontFamily: 'Crimson Text, serif',
              fontStyle: 'italic',
              fontSize: 10,
              color: '#b8a898',
              lineHeight: 1.3,
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
    </div>
  )
}

export default CardComponent
