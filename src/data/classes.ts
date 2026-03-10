// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Alchemist Class Definitions
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import type { AlchemistClass } from '../types/game'

export const CLASSES: AlchemistClass[] = [
  {
    id: 'druid',
    name: 'The Druid',
    mana: 'Nature',
    description: 'A nature-loving magician who draws power from the earth.',
    passiveAbility: 'Return one card from your hand to the draw pile and draw a new one.',
    manaThreshold: 3,
    color: '#4d9f5d',
    emoji: '🌿',
  },
  {
    id: 'mage',
    name: 'The Mage',
    mana: 'Arcane',
    description: 'A wise wizard dedicated to the study of magic.',
    passiveAbility: 'Discard one card from your hand, draw a new card from the pile.',
    manaThreshold: 3,
    color: '#5c8a8a',
    emoji: '🔮',
  },
  {
    id: 'sorcerer',
    name: 'The Sorcerer',
    mana: 'Fire',
    description: 'A powerful magician with a thirst for destruction.',
    passiveAbility: 'Draw two extra cards from the draw pile.',
    manaThreshold: 3,
    color: '#d4774a',
    emoji: '🔥',
  },
  {
    id: 'bard',
    name: 'The Bard',
    mana: 'Lunar',
    description: 'A charming performer who uses music and moonlight magic.',
    passiveAbility: "Choose one card from an opponent's hand and add it to your own.",
    manaThreshold: 3,
    color: '#8b5a9f',
    emoji: '🌙',
  },
  {
    id: 'witch',
    name: 'The Witch',
    mana: 'Shadow',
    description: 'A skilled potions maker with a mysterious past.',
    passiveAbility: 'Swap two cards in your hand with two cards from the draw pile.',
    manaThreshold: 3,
    color: '#4a6b8a',
    emoji: '🕷️',
  },
]

export const getClass = (id: string): AlchemistClass => {
  const cls = CLASSES.find((c) => c.id === id)
  if (!cls) throw new Error(`Unknown class: ${id}`)
  return cls
}
