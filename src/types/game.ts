// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Type Definitions
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

export type ManaType = 'Fire' | 'Nature' | 'Lunar' | 'Arcane' | 'Shadow' | 'Any'

export type CardType = 'ingredient' | 'recipe' | 'spell' | 'scroll'

export type Rarity = 'common' | 'uncommon' | 'rare'

export type TurnPhase = 'draw' | 'action' | 'end'

export type GamePhase = 'setup' | 'playing' | 'gameover'

// ── Base Card ────────────────────────────────────────────────────────────────

export interface BaseCard {
  id: string           // unique instance id (e.g. "moonstone-dust-1")
  definitionId: string // card definition id (e.g. "moonstone-dust")
  name: string
  type: CardType
  description: string
  image?: string       // path to card art, e.g. "/cards/moonstone-dust.png"
}

// ── Ingredient Card ──────────────────────────────────────────────────────────

export interface IngredientCard extends BaseCard {
  type: 'ingredient'
  manaType: ManaType
  manaValue: number
  rarity: Rarity
  specialEffect?: 'draw_extra'   // Time Flower
}

// ── Recipe Card ──────────────────────────────────────────────────────────────

export interface RecipeCost {
  manaType: ManaType
  amount: number
}

export interface RecipeProgress {
  manaType: ManaType
  contributed: number
  required: number
}

export interface RecipeCard extends BaseCard {
  type: 'recipe'
  difficulty: 'basic' | 'advanced'
  cost: RecipeCost[]
  progress: RecipeProgress[]   // tracks how much mana has been contributed
  completed: boolean
}

// ── Spell Card ───────────────────────────────────────────────────────────────

export interface SpellCard extends BaseCard {
  type: 'spell'
  classId: string
  manaCost: number
  manaType: ManaType
  effect: SpellEffect
}

export type SpellEffect =
  | { kind: 'draw_ingredients'; amount: number }
  | { kind: 'draw_any'; amount: number }
  | { kind: 'double_next_mana' }
  | { kind: 'steal_ingredient' }     // from target player
  | { kind: 'block_spell' }          // blocks next spell targeting you
  | { kind: 'cancel_spell' }         // cancel spell being cast
  | { kind: 'transmute_ingredient' } // change any ingredient's mana type
  | { kind: 'return_spell' }         // return target spell to owner's hand
  | { kind: 'discard_random'; amount: number }   // target player discards
  | { kind: 'destroy_ingredient' }   // destroy target ingredient
  | { kind: 'all_discard_ingredient'; amount: number }
  | { kind: 'next_ingredient_bonus'; bonus: number }
  | { kind: 'all_draw'; amount: number }
  | { kind: 'prevent_spells' }       // no spells this turn
  | { kind: 'show_hand_steal' }      // show hand, steal 1
  | { kind: 'copy_spell' }           // copy next spell cast
  | { kind: 'drain'; drawAmount: number; discardAmount: number }
  | { kind: 'hex' }                  // skip next draw phase
  | { kind: 'swap_hands' }           // swap hands with any player
  | { kind: 'shadowweave' }          // target's next spell costs +2

// ── Scroll Card ──────────────────────────────────────────────────────────────

export interface ScrollCard extends BaseCard {
  type: 'scroll'
  effect: ScrollEffect
}

export type ScrollEffect =
  | { kind: 'extra_turn' }
  | { kind: 'protection' }           // immune to spells this round
  | { kind: 'draw'; amount: number }
  | { kind: 'chaos_shuffle' }        // all shuffle + redraw
  | { kind: 'wisdom'; look: number; keep: number }

// ── Union Card ───────────────────────────────────────────────────────────────

export type Card = IngredientCard | RecipeCard | SpellCard | ScrollCard

// ── Alchemist Class ──────────────────────────────────────────────────────────

export interface AlchemistClass {
  id: string
  name: string
  mana: ManaType
  description: string
  passiveAbility: string
  manaThreshold: number
  color: string
  emoji: string
}

// ── Player ───────────────────────────────────────────────────────────────────

export interface Player {
  id: string
  name: string
  classId: string
  hand: Card[]
  spellDeck: SpellCard[]
  recipes: RecipeCard[]            // 5 recipe cards, tracks progress
  completedRecipes: RecipeCard[]
  manaPool: Record<ManaType, number>
  protected: boolean               // from Scroll of Protection / Thorn Barrier
  hexed: boolean                   // skip next draw phase
  usedSpecialPower: boolean        // once per turn
  doubleNextMana: boolean          // Wild Growth effect
  extraSpellCost: number           // Shadowweave effect
  spellsPrevented: boolean         // Soothing Melody effect
}

// ── Game State ───────────────────────────────────────────────────────────────

export interface GameState {
  phase: GamePhase
  players: Player[]
  currentPlayerIndex: number
  turnPhase: TurnPhase
  mainDeck: Card[]
  marketRow: Card[]               // 5 face-up cards
  discardPile: Card[]
  winner: string | null
  message: string                  // feedback message for UI
  pendingAction: PendingAction | null

  // Actions
  startGame: (playerCount: number, classes: string[], names: string[]) => void
  drawCard: (fromMarketIndex?: number) => void
  playIngredient: (cardId: string) => void
  castSpell: (cardId: string, targetPlayerId?: string) => void
  assignManaToRecipe: (recipeId: string, manaType: ManaType, amount: number) => void
  useSpecialPower: (targetPlayerId?: string, cardId?: string) => void
  discardCard: (cardId: string) => void
  endTurn: () => void
  resolvePendingAction: (choice: unknown) => void
  resetGame: () => void
  hydrateFromMultiplayer: (gameState: Partial<GameState>, playerOrder: string[], myPlayerId: string | null) => void
}

// ── Pending Actions (for multi-step interactions) ────────────────────────────

export type PendingAction =
  | { kind: 'pick_discard_card'; playerId: string }
  | { kind: 'pick_steal_target'; spellCardId: string }
  | { kind: 'pick_hand_steal'; targetPlayerId: string }
  | { kind: 'pick_transmute_ingredient'; cardId: string }
  | { kind: 'wisdom_pick'; cards: Card[]; keep: number }
  | { kind: 'special_druid_pick'; cardId: string }
  | { kind: 'special_witch_pick'; cardIds: string[] }
  | { kind: 'special_bard_pick'; targetPlayerId: string }
  | { kind: 'swap_hands_pick'; spellCardId: string }
