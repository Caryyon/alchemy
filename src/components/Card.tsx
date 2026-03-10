// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Card Component
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React from 'react'
import type { Card as CardType, IngredientCard, SpellCard, ManaType } from '../types/game'
import { MANA_COLORS, MANA_GRADIENTS } from '../data/cards'

interface CardProps {
  card: CardType
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
  compact?: boolean
  faceDown?: boolean
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

function TypeBadge({ card }: { card: CardType }) {
  const labels: Record<CardType['type'], string> = {
    ingredient: '⚗️ Ingredient',
    recipe: '📜 Recipe',
    spell: '✨ Spell',
    scroll: '📖 Scroll',
  }
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(0,0,0,0.4)', color: '#aaa' }}
    >
      {labels[card.type]}
    </span>
  )
}

function ManaCostBadge({ card }: { card: CardType }) {
  if (card.type === 'ingredient') {
    const ing = card as IngredientCard
    const color = MANA_COLORS[ing.manaType]
    return (
      <div className="flex items-center gap-1">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: color + '33', color, border: `1px solid ${color}` }}
        >
          +{ing.manaValue} {ing.manaType}
        </span>
      </div>
    )
  }
  if (card.type === 'spell') {
    const sp = card as SpellCard
    const color = MANA_COLORS[sp.manaType]
    return (
      <div className="flex items-center gap-1">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: color + '33', color, border: `1px solid ${color}` }}
        >
          {sp.manaCost} {sp.manaType}
        </span>
      </div>
    )
  }
  return null
}

// ── Art Area ──────────────────────────────────────────────────────────────────
// Uses card.image (set in cards.ts) when art exists.
// Falls back to a mana-colored gradient for fairy-wings, spells, and any card without art.

function CardArt({ card, height }: { card: CardType; height: number }) {
  if (card.image) {
    return (
      <div style={{ height, width: '100%', overflow: 'hidden', flexShrink: 0 }}>
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
      </div>
    )
  }

  // Gradient placeholder (fairy-wings, spells, any card without art)
  const gradient = getGradient(card)
  const emoji =
    card.type === 'ingredient' ? '🌿'   // fairy-wings
    : card.type === 'recipe'   ? '🧪'
    : card.type === 'scroll'   ? '📜'
    : '✨'                               // spell

  return (
    <div
      className={`bg-gradient-to-br ${gradient} flex items-center justify-center`}
      style={{ height, width: '100%', flexShrink: 0 }}
    >
      <span style={{ fontSize: height < 50 ? 20 : 36 }}>{emoji}</span>
    </div>
  )
}

export const CardComponent: React.FC<CardProps> = ({
  card,
  onClick,
  selected = false,
  disabled = false,
  compact = false,
  faceDown = false,
}) => {
  const accent = getCardAccent(card)
  const artHeight = compact ? 44 : 90

  // ── Face-down (deck pile / opponent hand) ────────────────────────────────
  if (faceDown) {
    return (
      <div
        className="relative rounded-xl overflow-hidden flex-shrink-0"
        style={{
          width: compact ? 72 : 120,
          height: compact ? 100 : 168,
          border: '2px solid #2f2f2f',
        }}
      >
        <img
          src="/cards/card-back.png"
          alt="Card back"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={(e) => {
            // Fallback if card-back.png is missing for some reason
            const el = e.currentTarget as HTMLImageElement
            el.style.display = 'none'
            ;(el.parentElement as HTMLDivElement).style.background =
              'linear-gradient(135deg, #1a1a1a, #0d0d0d)'
          }}
        />
      </div>
    )
  }

  // ── Face-up card ─────────────────────────────────────────────────────────
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        relative rounded-xl overflow-hidden flex-shrink-0 flex flex-col transition-all duration-200
        ${onClick && !disabled ? 'cursor-pointer hover:scale-105' : ''}
        ${selected ? 'scale-105' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      style={{
        width: compact ? 72 : 160,
        height: compact ? 100 : 224,
        background: '#1a1a1a',
        border: `2px solid ${selected ? '#fff' : accent}`,
        boxShadow: selected
          ? `0 0 16px ${accent}88`
          : 'none',
      }}
      onMouseEnter={(e) => {
        if (onClick && !disabled) {
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 12px ${accent}66`
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
        }
      }}
    >
      {/* Art */}
      <CardArt card={card} height={artHeight} />

      {/* Text body */}
      <div className="p-1.5 flex flex-col gap-0.5 flex-1 overflow-hidden">
        {!compact && <TypeBadge card={card} />}

        <p
          className="font-bold leading-tight"
          style={{ fontSize: compact ? 9 : 12, color: accent }}
        >
          {card.name}
        </p>

        {!compact && (
          <>
            <ManaCostBadge card={card} />
            <p
              className="text-gray-400 leading-tight overflow-hidden"
              style={{ fontSize: 10, marginTop: 2 }}
            >
              {card.description}
            </p>
            {card.type === 'ingredient' && (card as IngredientCard).rarity !== 'common' && (
              <span
                className="text-[9px] uppercase tracking-widest mt-auto"
                style={{
                  color: (card as IngredientCard).rarity === 'rare' ? '#d4774a' : '#8b5a9f',
                }}
              >
                ◆ {(card as IngredientCard).rarity}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CardComponent
