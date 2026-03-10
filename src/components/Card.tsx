// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Card Component
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React from 'react'
import type { Card as CardType, IngredientCard, SpellCard, ManaType } from '../types/game'
import { MANA_COLORS, MANA_GRADIENTS } from '../data/cards'

// Map definitionId → art file in /cards/
const CARD_ART: Record<string, string> = {
  'moonstone-dust':      '/cards/moonstone-dust.png',
  'dragon-scale':        '/cards/dragon-scale.png',
  'raven-feather':       '/cards/raven-feather.png',
  'crystal-shard':       '/cards/crystal-shard.png',
  'phoenix-ash':         '/cards/phoenix-ash.png',
  'starlight-essence':   '/cards/starlight-essence.png',
  'ancient-root':        '/cards/ancient-root.png',
  'void-crystal':        '/cards/void-crystal.png',
  'pure-quartz':         '/cards/pure-quartz.png',
  'unicorn-hair':        '/cards/unicorn-hair.png',
  'meteor-fragment':     '/cards/meteor-fragment.png',
  'time-flower':         '/cards/time-flower.png',
  'healing-elixir':      '/cards/healing-elixir.png',
  'fire-bomb':           '/cards/fire-bomb.png',
  'invisibility-dra':    '/cards/invisibility-draught.png',
  'mana-potion':         '/cards/mana-potion.png',
  'truth-serum':         '/cards/truth-serum.png',
  'dragons-breath':      '/cards/dragons-breath.png',
  'shapeshifters-brew':  '/cards/shapeshifters-brew.png',
  'mind-control':        '/cards/mind-control-elixir.png',
  'necromancers-dr':     '/cards/necromancers-draught.png',
  'moonbeam-essence':    '/cards/moonbeam-essence.png',
  'scroll-haste':        '/cards/scroll-of-haste.png',
  'scroll-protection':   '/cards/scroll-of-protection.png',
  'scroll-abundance':    '/cards/scroll-of-abundance.png',
  'scroll-chaos':        '/cards/scroll-of-chaos.png',
  'scroll-wisdom':       '/cards/scroll-of-wisdom.png',
}

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

export const CardComponent: React.FC<CardProps> = ({
  card,
  onClick,
  selected = false,
  disabled = false,
  compact = false,
  faceDown = false,
}) => {
  const accent = getCardAccent(card)
  const gradient = getGradient(card)

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
          className="w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      </div>
    )
  }

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`
        relative rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200
        ${onClick && !disabled ? 'cursor-pointer hover:scale-105' : ''}
        ${selected ? 'scale-105 ring-2 ring-white' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      style={{
        width: compact ? 72 : 160,
        height: compact ? 100 : 224,
        background: '#1a1a1a',
        border: `2px solid ${selected ? '#fff' : accent}`,
        boxShadow: selected
          ? `0 0 16px ${accent}88`
          : onClick && !disabled
          ? `0 0 0px ${accent}00`
          : 'none',
      }}
      onMouseEnter={(e) => {
        if (onClick && !disabled && !selected) {
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 12px ${accent}66`
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
        }
      }}
    >
      {/* Art area */}
      {CARD_ART[card.definitionId] ? (
        <div
          style={{ height: compact ? 44 : 90, width: '100%', overflow: 'hidden', position: 'relative' }}
        >
          <img
            src={CARD_ART[card.definitionId]}
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
      ) : (
        <div
          className={`bg-gradient-to-br ${gradient} flex items-center justify-center`}
          style={{ height: compact ? 44 : 90, width: '100%' }}
        >
          <span className={compact ? 'text-2xl' : 'text-4xl'}>
            {card.type === 'ingredient' ? '⚗️'
              : card.type === 'recipe' ? '🧪'
              : card.type === 'scroll' ? '📜'
              : '✨'}
          </span>
        </div>
      )}

      {/* Card body */}
      <div className="p-1.5 flex flex-col gap-0.5">
        {!compact && <TypeBadge card={card} />}

        <p
          className="font-bold leading-tight"
          style={{
            fontSize: compact ? 9 : 12,
            color: accent,
          }}
        >
          {card.name}
        </p>

        {!compact && (
          <>
            <ManaCostBadge card={card} />
            <p
              className="text-gray-400 leading-tight"
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
