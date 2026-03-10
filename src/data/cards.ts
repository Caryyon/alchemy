// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Card Definitions
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import type {
  IngredientCard,
  RecipeCard,
  SpellCard,
  ScrollCard,
  Card,
  ManaType,
} from '../types/game'

// ── Helpers ──────────────────────────────────────────────────────────────────

let _uid = 0
const uid = (prefix: string) => `${prefix}-${++_uid}`

function copies<T>(count: number, factory: (_i: number) => T): T[] {
  return Array.from({ length: count }, (_, i) => factory(i + 1))
}

// ── Ingredient Cards ─────────────────────────────────────────────────────────

// Image paths for cards that have art. undefined = use gradient placeholder.
const CARD_IMAGES: Record<string, string | undefined> = {
  // Ingredients
  'moonstone-dust':      '/cards/moonstone-dust.png',
  'dragon-scale':        '/cards/dragon-scale.png',
  'fairy-wings':         undefined,                          // no art — gradient placeholder
  'crystal-shard':       '/cards/crystal-shard.png',
  'raven-feather':       '/cards/raven-feather.png',
  'phoenix-ash':         '/cards/phoenix-ash.png',
  'starlight-essence':   '/cards/starlight-essence.png',
  'ancient-root':        '/cards/ancient-root.png',
  'void-crystal':        '/cards/void-crystal.png',
  'pure-quartz':         '/cards/pure-quartz.png',
  'unicorn-hair':        '/cards/unicorn-hair.png',
  'meteor-fragment':     '/cards/meteor-fragment.png',
  'time-flower':         '/cards/time-flower.png',
  // Recipes
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
  // Scrolls
  'scroll-haste':        '/cards/scroll-of-haste.png',
  'scroll-protection':   '/cards/scroll-of-protection.png',
  'scroll-abundance':    '/cards/scroll-of-abundance.png',
  'scroll-chaos':        '/cards/scroll-of-chaos.png',
  'scroll-wisdom':       '/cards/scroll-of-wisdom.png',
  // Spells — no art, gradient by mana color
}

function makeIngredient(
  defId: string,
  name: string,
  manaType: ManaType,
  manaValue: number,
  rarity: IngredientCard['rarity'],
  count: number,
  specialEffect?: IngredientCard['specialEffect'],
): IngredientCard[] {
  return copies(count, (_i) => ({
    id: uid(defId),
    definitionId: defId,
    name,
    type: 'ingredient' as const,
    description: specialEffect
      ? 'Draw an extra card when played.'
      : `Provides ${manaValue} ${manaType} mana.`,
    image: CARD_IMAGES[defId],
    manaType,
    manaValue,
    rarity,
    specialEffect,
  }))
}

export const INGREDIENT_CARDS: IngredientCard[] = [
  // Common — 4 copies each (20 total)
  ...makeIngredient('moonstone-dust',  'Moonstone Dust',  'Lunar',  1, 'common',   4),
  ...makeIngredient('dragon-scale',    'Dragon Scale',    'Fire',   1, 'common',   4),
  ...makeIngredient('fairy-wings',     'Fairy Wings',     'Nature', 1, 'common',   4),  // gradient placeholder
  ...makeIngredient('crystal-shard',   'Crystal Shard',   'Arcane', 1, 'common',   4),
  ...makeIngredient('raven-feather',   'Raven Feather',   'Shadow', 1, 'common',   4),

  // Uncommon — 3 copies each (15 total)
  ...makeIngredient('phoenix-ash',       'Phoenix Ash',       'Fire',   2, 'uncommon', 3),
  ...makeIngredient('starlight-essence', 'Starlight Essence', 'Lunar',  2, 'uncommon', 3),
  ...makeIngredient('ancient-root',      'Ancient Root',      'Nature', 2, 'uncommon', 3),
  ...makeIngredient('void-crystal',      'Void Crystal',      'Shadow', 2, 'uncommon', 3),
  ...makeIngredient('pure-quartz',       'Pure Quartz',       'Arcane', 2, 'uncommon', 3),

  // Rare — 2 copies each (6 total)
  ...makeIngredient('unicorn-hair',      'Unicorn Hair',      'Any',    1, 'rare',     2),
  ...makeIngredient('meteor-fragment',   'Meteor Fragment',   'Any',    3, 'rare',     2),
  ...makeIngredient('time-flower',       'Time Flower',       'Any',    1, 'rare',     2, 'draw_extra'),
]

// ── Recipe Cards ─────────────────────────────────────────────────────────────

function makeRecipe(
  defId: string,
  name: string,
  difficulty: RecipeCard['difficulty'],
  cost: RecipeCard['cost'],
  count: number,
): RecipeCard[] {
  return copies(count, () => ({
    id: uid(defId),
    definitionId: defId,
    name,
    type: 'recipe' as const,
    description: cost
      .map((c) => `${c.amount} ${c.manaType}`)
      .join(' + '),
    image: CARD_IMAGES[defId],
    difficulty,
    cost,
    progress: cost.map((c) => ({
      manaType: c.manaType,
      contributed: 0,
      required: c.amount,
    })),
    completed: false,
  }))
}

export const RECIPE_CARDS: RecipeCard[] = [
  // Basic — 3 copies each (15 total)
  ...makeRecipe('healing-elixir',     'Healing Elixir',     'basic', [{ manaType: 'Nature', amount: 2 }, { manaType: 'Lunar',   amount: 1 }], 3),
  ...makeRecipe('fire-bomb',          'Fire Bomb',          'basic', [{ manaType: 'Fire',   amount: 2 }, { manaType: 'Arcane',  amount: 1 }], 3),
  ...makeRecipe('invisibility-dra',   'Invisibility Draught','basic',[{ manaType: 'Shadow', amount: 2 }, { manaType: 'Nature',  amount: 1 }], 3),
  ...makeRecipe('mana-potion',        'Mana Potion',        'basic', [{ manaType: 'Arcane', amount: 2 }, { manaType: 'Fire',    amount: 1 }], 3),
  ...makeRecipe('truth-serum',        'Truth Serum',        'basic', [{ manaType: 'Lunar',  amount: 2 }, { manaType: 'Shadow',  amount: 1 }], 3),

  // Advanced — 2 copies each (10 total)
  ...makeRecipe('dragons-breath',     "Dragon's Breath",    'advanced', [{ manaType: 'Fire',   amount: 3 }, { manaType: 'Arcane',  amount: 2 }], 2),
  ...makeRecipe('shapeshifters-brew', "Shapeshifter's Brew",'advanced', [{ manaType: 'Nature', amount: 3 }, { manaType: 'Shadow',  amount: 2 }], 2),
  ...makeRecipe('mind-control',       'Mind Control Elixir','advanced', [{ manaType: 'Arcane', amount: 3 }, { manaType: 'Lunar',   amount: 2 }], 2),
  ...makeRecipe('necromancers-dr',    "Necromancer's Draught",'advanced',[{ manaType: 'Shadow', amount: 3 }, { manaType: 'Fire',    amount: 2 }], 2),
  ...makeRecipe('moonbeam-essence',   'Moonbeam Essence',   'advanced', [{ manaType: 'Lunar',  amount: 3 }, { manaType: 'Nature',  amount: 2 }], 2),
]

// ── Spell Cards ──────────────────────────────────────────────────────────────

function makeSpell(
  defId: string,
  name: string,
  classId: string,
  manaType: ManaType,
  manaCost: number,
  description: string,
  effect: SpellCard['effect'],
  count: number,
): SpellCard[] {
  return copies(count, () => ({
    id: uid(defId),
    definitionId: defId,
    name,
    type: 'spell' as const,
    image: CARD_IMAGES[defId],   // spells have no art — will be undefined → gradient
    classId,
    manaType,
    manaCost,
    description,
    effect,
  }))
}

export const SPELL_CARDS: SpellCard[] = [
  // ── Druid (Nature) ──────────────────────────────────────────────────────
  ...makeSpell('natures-bounty', "Nature's Bounty", 'druid', 'Nature', 2,
    'Draw 2 ingredient cards.',
    { kind: 'draw_ingredients', amount: 2 }, 2),
  ...makeSpell('wild-growth', 'Wild Growth', 'druid', 'Nature', 1,
    'Double mana from your next ingredient.',
    { kind: 'double_next_mana' }, 2),
  ...makeSpell('beast-form', 'Beast Form', 'druid', 'Nature', 3,
    'Steal a random ingredient from target player.',
    { kind: 'steal_ingredient' }, 2),
  ...makeSpell('thorn-barrier', 'Thorn Barrier', 'druid', 'Nature', 2,
    'Block the next spell cast at you.',
    { kind: 'block_spell' }, 2),

  // ── Mage (Arcane) ────────────────────────────────────────────────────────
  ...makeSpell('arcane-intellect', 'Arcane Intellect', 'mage', 'Arcane', 2,
    'Draw 2 cards of any type.',
    { kind: 'draw_any', amount: 2 }, 2),
  ...makeSpell('dispel-magic', 'Dispel Magic', 'mage', 'Arcane', 1,
    "Cancel a spell as it's being cast.",
    { kind: 'cancel_spell' }, 2),
  ...makeSpell('transmutation', 'Transmutation', 'mage', 'Arcane', 3,
    "Change any ingredient's mana type.",
    { kind: 'transmute_ingredient' }, 2),
  ...makeSpell('counterspell', 'Counterspell', 'mage', 'Arcane', 2,
    "Return target spell to owner's hand.",
    { kind: 'return_spell' }, 2),

  // ── Sorcerer (Fire) ──────────────────────────────────────────────────────
  ...makeSpell('fireball', 'Fireball', 'sorcerer', 'Fire', 2,
    'Target player discards 1 random card.',
    { kind: 'discard_random', amount: 1 }, 2),
  ...makeSpell('burning-hands', 'Burning Hands', 'sorcerer', 'Fire', 1,
    'Destroy target ingredient.',
    { kind: 'destroy_ingredient' }, 2),
  ...makeSpell('meteor', 'Meteor', 'sorcerer', 'Fire', 3,
    'All players discard 1 ingredient.',
    { kind: 'all_discard_ingredient', amount: 1 }, 2),
  ...makeSpell('fire-shield', 'Fire Shield', 'sorcerer', 'Fire', 2,
    'Next ingredient you play gives +1 mana.',
    { kind: 'next_ingredient_bonus', bonus: 1 }, 2),

  // ── Bard (Lunar) ─────────────────────────────────────────────────────────
  ...makeSpell('inspiring-song', 'Inspiring Song', 'bard', 'Lunar', 1,
    'All players draw 1 card.',
    { kind: 'all_draw', amount: 1 }, 2),
  ...makeSpell('soothing-melody', 'Soothing Melody', 'bard', 'Lunar', 2,
    'Prevent all spells this turn.',
    { kind: 'prevent_spells' }, 2),
  ...makeSpell('discord', 'Discord', 'bard', 'Lunar', 2,
    "Target player shows hand, steal 1 card.",
    { kind: 'show_hand_steal' }, 2),
  ...makeSpell('enchantment', 'Enchantment', 'bard', 'Lunar', 3,
    'Copy any spell another player casts.',
    { kind: 'copy_spell' }, 2),

  // ── Witch (Shadow) ───────────────────────────────────────────────────────
  ...makeSpell('soul-drain', 'Soul Drain', 'witch', 'Shadow', 1,
    'Target player discards 1 card; you draw 1.',
    { kind: 'drain', drawAmount: 1, discardAmount: 1 }, 2),
  ...makeSpell('hex', 'Hex', 'witch', 'Shadow', 2,
    "Target player skips their next draw phase.",
    { kind: 'hex' }, 2),
  ...makeSpell('dark-bargain', 'Dark Bargain', 'witch', 'Shadow', 3,
    'Swap hands with any player.',
    { kind: 'swap_hands' }, 2),
  ...makeSpell('shadowweave', 'Shadowweave', 'witch', 'Shadow', 2,
    "Target player's next spell costs +2 mana.",
    { kind: 'shadowweave' }, 2),
]

// ── Scroll Cards ─────────────────────────────────────────────────────────────

function makeScroll(
  defId: string,
  name: string,
  description: string,
  effect: ScrollCard['effect'],
  count: number,
): ScrollCard[] {
  return copies(count, () => ({
    id: uid(defId),
    definitionId: defId,
    name,
    type: 'scroll' as const,
    image: CARD_IMAGES[defId],
    description,
    effect,
  }))
}

export const SCROLL_CARDS: ScrollCard[] = [
  ...makeScroll('scroll-haste',      'Scroll of Haste',      'Take an extra turn immediately.',                             { kind: 'extra_turn' },                  3),
  ...makeScroll('scroll-protection', 'Scroll of Protection', 'Immune to all spells this round.',                           { kind: 'protection' },                  3),
  ...makeScroll('scroll-abundance',  'Scroll of Abundance',  'Draw 3 cards immediately.',                                  { kind: 'draw', amount: 3 },             3),
  ...makeScroll('scroll-chaos',      'Scroll of Chaos',      'All players shuffle hands and redraw same number.',          { kind: 'chaos_shuffle' },               3),
  ...makeScroll('scroll-wisdom',     'Scroll of Wisdom',     'Look at top 5 cards of deck, keep 2.',                      { kind: 'wisdom', look: 5, keep: 2 },    3),
]

// ── Full Main Deck (ingredients + scrolls) ───────────────────────────────────

export function buildMainDeck(): Card[] {
  const deck: Card[] = [
    ...INGREDIENT_CARDS,
    ...SCROLL_CARDS,
  ]
  return shuffleDeck(deck)
}

export function buildRecipeDeck(): RecipeCard[] {
  return shuffleDeck([...RECIPE_CARDS]) as RecipeCard[]
}

export function getSpellsForClass(classId: string): SpellCard[] {
  return SPELL_CARDS.filter((s) => s.classId === classId).map((s) => ({ ...s }))
}

export function shuffleDeck<T>(deck: T[]): T[] {
  const arr = [...deck]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ── Mana color map ────────────────────────────────────────────────────────────

export const MANA_COLORS: Record<ManaType, string> = {
  Fire:   '#d4774a',
  Nature: '#4d9f5d',
  Lunar:  '#8b5a9f',
  Arcane: '#5c8a8a',
  Shadow: '#4a6b8a',
  Any:    '#8b6b47',
}

export const MANA_GRADIENTS: Record<ManaType, string> = {
  Fire:   'from-orange-900 via-orange-700 to-red-800',
  Nature: 'from-green-900 via-green-700 to-emerald-800',
  Lunar:  'from-purple-900 via-purple-700 to-violet-800',
  Arcane: 'from-teal-900 via-teal-700 to-cyan-800',
  Shadow: 'from-blue-950 via-blue-900 to-slate-800',
  Any:    'from-yellow-900 via-amber-800 to-orange-900',
}
