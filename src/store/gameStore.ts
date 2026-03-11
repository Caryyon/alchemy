// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Game State (Zustand)
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'
import type {
  GameState,
  Player,
  Card,
  ManaType,
  IngredientCard,
  SpellCard,
  ScrollCard,
  RecipeCard,
} from '../types/game'
import {
  buildMainDeck,
  buildRecipeDeck,
  getSpellsForClass,
  shuffleDeck,
} from '../data/cards'

// ── Helpers ──────────────────────────────────────────────────────────────────

const HAND_LIMITS: Record<number, number> = { 2: 7, 3: 6, 4: 5 }
const MAX_HAND = 7
const WIN_RECIPES = 5

function emptyManaPool(): Record<ManaType, number> {
  return { Fire: 0, Nature: 0, Lunar: 0, Arcane: 0, Shadow: 0, Any: 0 }
}

function totalMana(pool: Record<ManaType, number>): number {
  return Object.values(pool).reduce((a, b) => a + b, 0)
}

function manaOfType(pool: Record<ManaType, number>, type: ManaType): number {
  if (type === 'Any') return totalMana(pool)
  // For specific types, include the Any pool as a wildcard
  return (pool[type] ?? 0) + (pool['Any'] ?? 0)
}

function removeCardById(cards: Card[], id: string): [Card[], Card | undefined] {
  const idx = cards.findIndex((c) => c.id === id)
  if (idx === -1) return [cards, undefined]
  const removed = cards[idx]
  return [[...cards.slice(0, idx), ...cards.slice(idx + 1)], removed]
}

function findCard(cards: Card[], id: string): Card | undefined {
  return cards.find((c) => c.id === id)
}

function randomItem<T>(arr: T[]): T | undefined {
  if (!arr.length) return undefined
  return arr[Math.floor(Math.random() * arr.length)]
}

function cloneRecipeProgress(recipe: RecipeCard): RecipeCard {
  return {
    ...recipe,
    progress: recipe.progress.map((p) => ({ ...p })),
  }
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'setup',
  players: [],
  currentPlayerIndex: 0,
  turnPhase: 'draw',
  mainDeck: [],
  marketRow: [],
  discardPile: [],
  winner: null,
  message: 'Welcome to Alchemy!',
  pendingAction: null,

  // ── startGame ────────────────────────────────────────────────────────────

  startGame: (playerCount, classes, names) => {
    const mainDeck = buildMainDeck()
    const recipeDeck = buildRecipeDeck()

    const handSize = HAND_LIMITS[playerCount] ?? 5

    let deckCursor = 0
    const dealCards = (count: number): Card[] => {
      const dealt = mainDeck.slice(deckCursor, deckCursor + count)
      deckCursor += count
      return dealt
    }

    // Build players
    const players: Player[] = classes.map((classId, i) => {
      const hand = dealCards(handSize)
      const recipes = recipeDeck.splice(0, 5).map(cloneRecipeProgress)
      const spellDeck = getSpellsForClass(classId)

      return {
        id: `player-${i + 1}`,
        name: names[i] || `Player ${i + 1}`,
        classId,
        hand,
        spellDeck,
        recipes,
        completedRecipes: [],
        manaPool: emptyManaPool(),
        protected: false,
        hexed: false,
        usedSpecialPower: false,
        doubleNextMana: false,
        extraSpellCost: 0,
        spellsPrevented: false,
      }
    })

    const remainingDeck = mainDeck.slice(deckCursor)
    const marketRow = remainingDeck.slice(0, 5)
    const finalDeck = remainingDeck.slice(5)

    set({
      phase: 'playing',
      players,
      currentPlayerIndex: 0,
      turnPhase: 'draw',
      mainDeck: finalDeck,
      marketRow,
      discardPile: [],
      winner: null,
      message: `${players[0].name}'s turn — Draw a card to begin!`,
      pendingAction: null,
    })
  },

  // ── drawCard ─────────────────────────────────────────────────────────────

  drawCard: (fromMarketIndex) => {
    const state = get()
    if (state.turnPhase !== 'draw') {
      set({ message: 'You can only draw during the draw phase.' })
      return
    }

    const player = state.players[state.currentPlayerIndex]
    if (player.hexed) {
      // Hexed: skip draw phase
      const newPlayers = [...state.players]
      newPlayers[state.currentPlayerIndex] = {
        ...player,
        hexed: false,
      }
      set({
        players: newPlayers,
        turnPhase: 'action',
        message: `${player.name} is hexed and skips their draw phase!`,
      })
      return
    }

    let drawnCard: Card | undefined
    let newDeck = [...state.mainDeck]
    let newMarket = [...state.marketRow]

    if (fromMarketIndex !== undefined) {
      drawnCard = newMarket[fromMarketIndex]
      if (!drawnCard) {
        set({ message: 'No card at that market position.' })
        return
      }
      // Replace from deck
      if (newDeck.length > 0) {
        newMarket[fromMarketIndex] = newDeck[0]
        newDeck = newDeck.slice(1)
      } else {
        newMarket = [...newMarket.slice(0, fromMarketIndex), ...newMarket.slice(fromMarketIndex + 1)]
      }
    } else {
      if (newDeck.length === 0) {
        set({ message: 'The deck is empty!' })
        return
      }
      drawnCard = newDeck[0]
      newDeck = newDeck.slice(1)
    }

    const newPlayers = [...state.players]
    newPlayers[state.currentPlayerIndex] = {
      ...player,
      hand: [...player.hand, drawnCard],
    }

    // Check Time Flower
    let extraMessage = ''
    if (drawnCard.type === 'ingredient' && (drawnCard as IngredientCard).specialEffect === 'draw_extra') {
      if (newDeck.length > 0) {
        const bonusCard = newDeck[0]
        newDeck = newDeck.slice(1)
        newPlayers[state.currentPlayerIndex] = {
          ...newPlayers[state.currentPlayerIndex],
          hand: [...newPlayers[state.currentPlayerIndex].hand, bonusCard],
        }
        extraMessage = ' Time Flower blooms — drew an extra card!'
      }
    }

    set({
      players: newPlayers,
      mainDeck: newDeck,
      marketRow: newMarket,
      turnPhase: 'action',
      message: `${player.name} drew ${drawnCard.name}.${extraMessage}`,
    })
  },

  // ── playIngredient ────────────────────────────────────────────────────────

  playIngredient: (cardId) => {
    const state = get()
    if (state.turnPhase !== 'action') {
      set({ message: 'You can only play cards during the action phase.' })
      return
    }

    const player = state.players[state.currentPlayerIndex]
    const [newHand, card] = removeCardById(player.hand, cardId)

    if (!card || card.type !== 'ingredient') {
      set({ message: 'That card is not an ingredient.' })
      return
    }

    const ingredient = card as IngredientCard

    let manaValue = ingredient.manaValue
    if (player.doubleNextMana) {
      manaValue *= 2
    }

    const newPool = { ...player.manaPool }
    const manaType = ingredient.manaType === 'Any' ? 'Any' : ingredient.manaType
    newPool[manaType] = (newPool[manaType] ?? 0) + manaValue

    let extraDraw = ''
    let newDeck = [...state.mainDeck]
    let updatedHand = newHand

    if (ingredient.specialEffect === 'draw_extra' && newDeck.length > 0) {
      const bonusCard = newDeck[0]
      newDeck = newDeck.slice(1)
      updatedHand = [...updatedHand, bonusCard]
      extraDraw = ` Time Flower blooms — drew ${bonusCard.name}!`
    }

    const newPlayers = [...state.players]
    newPlayers[state.currentPlayerIndex] = {
      ...player,
      hand: updatedHand,
      manaPool: newPool,
      doubleNextMana: false,
    }

    set({
      players: newPlayers,
      mainDeck: newDeck,
      discardPile: [...state.discardPile, card],
      message: `Played ${ingredient.name} — +${manaValue} ${manaType} mana.${extraDraw}`,
    })
  },

  // ── castSpell ─────────────────────────────────────────────────────────────

  castSpell: (cardId, targetPlayerId) => {
    const state = get()
    if (state.turnPhase !== 'action') {
      set({ message: 'You can only cast spells during the action phase.' })
      return
    }

    const casterIdx = state.currentPlayerIndex
    const caster = state.players[casterIdx]

    if (caster.spellsPrevented) {
      set({ message: 'Soothing Melody prevents all spells this turn!' })
      return
    }

    // Find spell in hand or spell deck
    let spell = findCard(caster.hand, cardId) as SpellCard | undefined
    let fromSpellDeck = false

    if (!spell) {
      spell = caster.spellDeck.find((s) => s.id === cardId)
      fromSpellDeck = true
    }

    if (!spell || spell.type !== 'spell') {
      // Try scroll
      const scrollCard = findCard(caster.hand, cardId)
      if (scrollCard && scrollCard.type === 'scroll') {
        get().resolvePendingAction({ scrollCardId: cardId })
        return
      }
      set({ message: 'Spell not found.' })
      return
    }

    // Check mana cost
    const manaType = spell.manaType
    const cost = spell.manaCost + caster.extraSpellCost
    const available = manaOfType(caster.manaPool, manaType)

    if (available < cost) {
      set({ message: `Not enough ${manaType} mana. Need ${cost}, have ${available}.` })
      return
    }

    // Spend mana
    const newPool = { ...caster.manaPool }
    if (manaType === 'Any') {
      let remaining = cost
      const types: ManaType[] = ['Fire', 'Nature', 'Lunar', 'Arcane', 'Shadow', 'Any']
      for (const t of types) {
        if (remaining <= 0) break
        const spend = Math.min(newPool[t], remaining)
        newPool[t] -= spend
        remaining -= spend
      }
    } else {
      // Drain specific type first, then Any for remainder
      const fromSpecific = Math.min(newPool[manaType] ?? 0, cost)
      newPool[manaType] = (newPool[manaType] ?? 0) - fromSpecific
      const remainder = cost - fromSpecific
      if (remainder > 0) {
        newPool['Any'] -= remainder
      }
    }

    // Remove spell from wherever it was
    let newHand = [...caster.hand]
    let newSpellDeck = [...caster.spellDeck]

    if (fromSpellDeck) {
      newSpellDeck = newSpellDeck.filter((s) => s.id !== cardId)
    } else {
      newHand = newHand.filter((c) => c.id !== cardId)
    }

    const newPlayers: Player[] = state.players.map((p, i) =>
      i === casterIdx
        ? { ...p, hand: newHand, spellDeck: newSpellDeck, manaPool: newPool, extraSpellCost: 0 }
        : p
    )

    // Resolve spell effect
    const result = resolveSpellEffect(spell, newPlayers, casterIdx, targetPlayerId, state)

    set({
      players: result.players,
      mainDeck: result.deck ?? state.mainDeck,
      discardPile: [...(result.discard ?? state.discardPile), spell],
      message: result.message,
      pendingAction: result.pendingAction ?? null,
    })
  },

  // ── assignManaToRecipe ────────────────────────────────────────────────────

  assignManaToRecipe: (recipeId, manaType, amount) => {
    const state = get()
    if (state.turnPhase !== 'action') {
      set({ message: 'You can only assign mana during the action phase.' })
      return
    }

    const playerIdx = state.currentPlayerIndex
    const player = state.players[playerIdx]
    const recipe = player.recipes.find((r) => r.id === recipeId)

    if (!recipe) {
      set({ message: 'Recipe not found.' })
      return
    }

    const progressEntry = recipe.progress.find((p) => p.manaType === manaType)
    if (!progressEntry) {
      set({ message: `This recipe doesn't need ${manaType} mana.` })
      return
    }

    const needed = progressEntry.required - progressEntry.contributed
    const toSpend = Math.min(amount, needed)

    // Check available mana (include Any pool for specific types)
    const available = manaType === 'Any'
      ? totalMana(player.manaPool)
      : (player.manaPool[manaType] ?? 0) + (player.manaPool['Any'] ?? 0)

    if (available < toSpend) {
      set({ message: `Not enough ${manaType} mana.` })
      return
    }

    // Spend mana
    const newPool = { ...player.manaPool }
    if (manaType === 'Any') {
      let remaining = toSpend
      const types: ManaType[] = ['Fire', 'Nature', 'Lunar', 'Arcane', 'Shadow', 'Any']
      for (const t of types) {
        if (remaining <= 0) break
        const spend = Math.min(newPool[t], remaining)
        newPool[t] -= spend
        remaining -= spend
      }
    } else {
      // Drain specific type first, then Any for remainder
      const fromSpecific = Math.min(newPool[manaType] ?? 0, toSpend)
      newPool[manaType] = (newPool[manaType] ?? 0) - fromSpecific
      const remainder = toSpend - fromSpecific
      if (remainder > 0) {
        newPool['Any'] -= remainder
      }
    }

    // Update recipe progress
    const newRecipes = player.recipes.map((r) => {
      if (r.id !== recipeId) return r
      const newProgress = r.progress.map((p) =>
        p.manaType === manaType
          ? { ...p, contributed: p.contributed + toSpend }
          : p
      )
      const completed = newProgress.every((p) => p.contributed >= p.required)
      return { ...r, progress: newProgress, completed }
    })

    const completedRecipe = newRecipes.find((r) => r.id === recipeId && r.completed)

    const newCompleted = completedRecipe
      ? [...player.completedRecipes, completedRecipe]
      : player.completedRecipes

    const remainingRecipes = completedRecipe
      ? newRecipes.filter((r) => r.id !== recipeId)
      : newRecipes

    const newPlayers = [...state.players]
    newPlayers[playerIdx] = {
      ...player,
      manaPool: newPool,
      recipes: remainingRecipes,
      completedRecipes: newCompleted,
    }

    let message = `Contributed ${toSpend} ${manaType} mana to ${recipe.name}.`
    let winner = state.winner

    if (completedRecipe) {
      message = `✨ ${player.name} completed ${recipe.name}!`
      if (newCompleted.length >= WIN_RECIPES) {
        winner = player.id
        message = `🏆 ${player.name} wins by completing ${WIN_RECIPES} recipes!`
      }
    }

    set({
      players: newPlayers,
      winner,
      phase: winner ? 'gameover' : state.phase,
      message,
    })
  },

  // ── useSpecialPower ───────────────────────────────────────────────────────

  useSpecialPower: (targetPlayerId, cardId) => {
    const state = get()
    if (state.turnPhase !== 'action') {
      set({ message: 'You can only use your special power during the action phase.' })
      return
    }

    const playerIdx = state.currentPlayerIndex
    const player = state.players[playerIdx]

    if (player.usedSpecialPower) {
      set({ message: 'You have already used your special power this turn.' })
      return
    }

    // Check mana threshold
    const cls = player.classId
    const threshold = 3 // same for all classes

    if (totalMana(player.manaPool) < threshold) {
      set({ message: `Need at least ${threshold} total mana to use your special power.` })
      return
    }

    // Spend threshold mana (from any pool)
    const newPool = { ...player.manaPool }
    let remaining = threshold
    const types: ManaType[] = ['Fire', 'Nature', 'Lunar', 'Arcane', 'Shadow', 'Any']
    for (const t of types) {
      if (remaining <= 0) break
      const spend = Math.min(newPool[t], remaining)
      newPool[t] -= spend
      remaining -= spend
    }

    let newPlayers = [...state.players]
    let newDeck = [...state.mainDeck]
    let message = ''

    if (cls === 'druid') {
      if (!cardId) {
        // Prompt player to pick a card to return
        newPlayers[playerIdx] = { ...player, manaPool: newPool, usedSpecialPower: true }
        set({
          players: newPlayers,
          pendingAction: { kind: 'special_druid_pick', cardId: '' },
          message: 'Druid power: Choose a card from your hand to return to the draw pile.',
        })
        return
      }
      // Return card, draw new one
      const [newHand, returned] = removeCardById(player.hand, cardId)
      if (!returned) { set({ message: 'Card not found.' }); return }
      const shuffled = shuffleDeck([returned, ...newDeck])
      const drawn = shuffled[0]
      newDeck = shuffled.slice(1)
      newPlayers[playerIdx] = {
        ...player,
        hand: [...newHand, drawn],
        manaPool: newPool,
        usedSpecialPower: true,
      }
      message = `Druid returns ${returned.name} and draws ${drawn.name}.`

    } else if (cls === 'mage') {
      if (!cardId) {
        newPlayers[playerIdx] = { ...player, manaPool: newPool, usedSpecialPower: true }
        set({
          players: newPlayers,
          pendingAction: { kind: 'special_druid_pick', cardId: '' }, // reuse same prompt style
          message: 'Mage power: Choose a card to discard and draw a new one.',
        })
        return
      }
      const [newHand, discarded] = removeCardById(player.hand, cardId)
      if (!discarded) { set({ message: 'Card not found.' }); return }
      const drawn = newDeck.length > 0 ? newDeck[0] : undefined
      newDeck = drawn ? newDeck.slice(1) : newDeck
      newPlayers[playerIdx] = {
        ...player,
        hand: drawn ? [...newHand, drawn] : newHand,
        manaPool: newPool,
        usedSpecialPower: true,
      }
      set({ discardPile: [...state.discardPile, discarded] })
      message = drawn
        ? `Mage discards ${discarded.name} and draws ${drawn.name}.`
        : `Mage discards ${discarded.name} (deck empty).`

    } else if (cls === 'sorcerer') {
      // Draw 2 extra cards
      const drawn = newDeck.slice(0, 2)
      newDeck = newDeck.slice(2)
      newPlayers[playerIdx] = {
        ...player,
        hand: [...player.hand, ...drawn],
        manaPool: newPool,
        usedSpecialPower: true,
      }
      message = `Sorcerer draws ${drawn.length} extra card${drawn.length !== 1 ? 's' : ''}!`

    } else if (cls === 'bard') {
      if (!targetPlayerId) {
        newPlayers[playerIdx] = { ...player, manaPool: newPool, usedSpecialPower: true }
        set({
          players: newPlayers,
          pendingAction: { kind: 'special_bard_pick', targetPlayerId: '' },
          message: "Bard power: Choose an opponent's card to take.",
        })
        return
      }
      const targetIdx = state.players.findIndex((p) => p.id === targetPlayerId)
      if (targetIdx === -1) { set({ message: 'Target not found.' }); return }
      const target = state.players[targetIdx]
      if (!target.hand.length) { set({ message: 'Target has no cards.' }); return }
      const stolen = randomItem(target.hand)!
      const newTargetHand = target.hand.filter((c) => c.id !== stolen.id)
      newPlayers[playerIdx] = {
        ...player,
        hand: [...player.hand, stolen],
        manaPool: newPool,
        usedSpecialPower: true,
      }
      newPlayers[targetIdx] = { ...target, hand: newTargetHand }
      message = `Bard steals ${stolen.name} from ${target.name}!`

    } else if (cls === 'witch') {
      // Swap 2 cards in hand with 2 from deck
      if (player.hand.length < 2) {
        set({ message: 'Not enough cards in hand to swap.' })
        return
      }
      const toSwap = player.hand.slice(0, 2)
      const drawn = newDeck.slice(0, 2)
      newDeck = [...newDeck.slice(2), ...toSwap]
      const newHand = [...player.hand.slice(2), ...drawn]
      newPlayers[playerIdx] = {
        ...player,
        hand: newHand,
        manaPool: newPool,
        usedSpecialPower: true,
      }
      message = `Witch swaps 2 cards with the draw pile.`
    }

    set({ players: newPlayers, mainDeck: newDeck, message, pendingAction: null })
  },

  // ── discardCard ───────────────────────────────────────────────────────────

  discardCard: (cardId) => {
    const state = get()
    const player = state.players[state.currentPlayerIndex]
    const [newHand, card] = removeCardById(player.hand, cardId)

    if (!card) {
      set({ message: 'Card not found.' })
      return
    }

    const newPlayers = [...state.players]
    newPlayers[state.currentPlayerIndex] = { ...player, hand: newHand }

    set({
      players: newPlayers,
      discardPile: [...state.discardPile, card],
      message: `Discarded ${card.name}.`,
    })
  },

  // ── endTurn ───────────────────────────────────────────────────────────────

  endTurn: () => {
    const state = get()
    const playerIdx = state.currentPlayerIndex
    const player = state.players[playerIdx]

    // Discard down to max hand size
    const handLimit = MAX_HAND
    let hand = [...player.hand]
    const extras: Card[] = []
    while (hand.length > handLimit) {
      const discarded = hand.pop()!
      extras.push(discarded)
    }

    const newPlayers = [...state.players]
    newPlayers[playerIdx] = {
      ...player,
      hand,
      manaPool: emptyManaPool(),
      usedSpecialPower: false,
      doubleNextMana: false,
      spellsPrevented: false,
    }

    const nextIdx = (playerIdx + 1) % state.players.length
    const nextPlayer = newPlayers[nextIdx]

    set({
      players: newPlayers,
      currentPlayerIndex: nextIdx,
      turnPhase: 'draw',
      discardPile: [...state.discardPile, ...extras],
      message: `${nextPlayer.name}'s turn — Draw a card!`,
      pendingAction: null,
    })
  },

  // ── resolvePendingAction ──────────────────────────────────────────────────

  resolvePendingAction: (choice: unknown) => {
    const state = get()
    const pending = state.pendingAction
    if (!pending) return

    const playerIdx = state.currentPlayerIndex
    const player = state.players[playerIdx]
    const newPlayers = [...state.players]
    let newDeck = [...state.mainDeck]

    if (pending.kind === 'special_druid_pick' || pending.kind === 'special_bard_pick') {
      const { cardId } = choice as { cardId?: string; targetPlayerId?: string }
      const { targetPlayerId } = choice as { cardId?: string; targetPlayerId?: string }

      if (pending.kind === 'special_druid_pick' && cardId) {
        get().useSpecialPower(undefined, cardId)
        return
      }
      if (pending.kind === 'special_bard_pick' && targetPlayerId) {
        get().useSpecialPower(targetPlayerId)
        return
      }
    }

    if (pending.kind === 'pick_steal_target') {
      // Handled in castSpell
    }

    if (pending.kind === 'wisdom_pick') {
      const { kept } = choice as { kept: string[] }
      const discard = pending.cards.filter((c) => !kept.includes(c.id))
      newPlayers[playerIdx] = {
        ...player,
        hand: [...player.hand, ...pending.cards.filter((c) => kept.includes(c.id))],
      }
      set({
        players: newPlayers,
        mainDeck: newDeck,
        discardPile: [...state.discardPile, ...discard],
        pendingAction: null,
        message: 'You kept your chosen cards.',
      })
      return
    }

    // Play a scroll card
    if ((choice as { scrollCardId?: string }).scrollCardId) {
      const { scrollCardId } = choice as { scrollCardId: string }
      const scrollCard = findCard(player.hand, scrollCardId) as ScrollCard | undefined
      if (!scrollCard || scrollCard.type !== 'scroll') return

      const [newHand] = removeCardById(player.hand, scrollCardId)
      newPlayers[playerIdx] = { ...player, hand: newHand }

      const effect = scrollCard.effect
      let message = `${player.name} used ${scrollCard.name}!`

      if (effect.kind === 'extra_turn') {
        // Staying on same player — just discard + message
        set({
          players: newPlayers,
          discardPile: [...state.discardPile, scrollCard],
          pendingAction: null,
          message: `${message} Take another turn!`,
        })
        return
      }

      if (effect.kind === 'protection') {
        newPlayers[playerIdx] = { ...newPlayers[playerIdx], protected: true }
        set({
          players: newPlayers,
          discardPile: [...state.discardPile, scrollCard],
          pendingAction: null,
          message: `${message} You are protected from spells this round.`,
        })
        return
      }

      if (effect.kind === 'draw') {
        const drawn = newDeck.slice(0, effect.amount)
        newDeck = newDeck.slice(effect.amount)
        newPlayers[playerIdx] = { ...newPlayers[playerIdx], hand: [...newHand, ...drawn] }
        set({
          players: newPlayers,
          mainDeck: newDeck,
          discardPile: [...state.discardPile, scrollCard],
          pendingAction: null,
          message: `${message} Drew ${drawn.length} cards.`,
        })
        return
      }

      if (effect.kind === 'chaos_shuffle') {
        const allHands = newPlayers.map((p) => [...p.hand])
        const combined = allHands.flat()
        const shuffled = shuffleDeck(combined)
        let offset = 0
        newPlayers.forEach((p, i) => {
          const size = allHands[i].length
          newPlayers[i] = { ...p, hand: shuffled.slice(offset, offset + size) }
          offset += size
        })
        set({
          players: newPlayers,
          discardPile: [...state.discardPile, scrollCard],
          pendingAction: null,
          message: `${message} All hands shuffled and redrawn!`,
        })
        return
      }

      if (effect.kind === 'wisdom') {
        const cards = newDeck.slice(0, effect.look)
        newDeck = newDeck.slice(effect.look)
        set({
          players: newPlayers,
          mainDeck: newDeck,
          discardPile: [...state.discardPile, scrollCard],
          pendingAction: { kind: 'wisdom_pick', cards, keep: effect.keep },
          message: `${message} Choose ${effect.keep} cards to keep from the top ${effect.look}.`,
        })
        return
      }

      set({ pendingAction: null, message })
    }
  },

  // ── resetGame ─────────────────────────────────────────────────────────────

  resetGame: () => {
    set({
      phase: 'setup',
      players: [],
      currentPlayerIndex: 0,
      turnPhase: 'draw',
      mainDeck: [],
      marketRow: [],
      discardPile: [],
      winner: null,
      message: 'Welcome to Alchemy!',
      pendingAction: null,
    })
  },

  // ── hydrateFromMultiplayer ─────────────────────────────────────────────────
  // Hydrates the local game store with state received from the server (for non-host players)

  hydrateFromMultiplayer: (gameState: Partial<GameState>, playerOrder: string[], _myPlayerId: string | null) => {
    // Extract the game state properties we need (excluding actions)
    const {
      phase,
      players,
      currentPlayerIndex,
      turnPhase,
      mainDeck,
      marketRow,
      discardPile,
      winner,
      message,
      pendingAction,
    } = gameState

    // Determine the current player index based on playerOrder
    let newCurrentPlayerIndex = currentPlayerIndex ?? 0
    if (playerOrder.length > 0 && players && players.length > 0) {
      // The first player in playerOrder is the starting player
      const startingPlayerId = playerOrder[0]
      const idx = players.findIndex(p => p.id === startingPlayerId)
      if (idx !== -1) {
        newCurrentPlayerIndex = idx
      }
    }

    set({
      phase: phase ?? 'playing',
      players: players ?? [],
      currentPlayerIndex: newCurrentPlayerIndex,
      turnPhase: turnPhase ?? 'draw',
      mainDeck: mainDeck ?? [],
      marketRow: marketRow ?? [],
      discardPile: discardPile ?? [],
      winner: winner ?? null,
      message: message ?? 'Game started!',
      pendingAction: pendingAction ?? null,
    })
  },
}))

// ── Spell Resolution ──────────────────────────────────────────────────────────

interface SpellResult {
  players: Player[]
  deck?: Card[]
  discard?: Card[]
  message: string
  pendingAction?: GameState['pendingAction']
}

function resolveSpellEffect(
  spell: SpellCard,
  players: Player[],
  casterIdx: number,
  targetPlayerId: string | undefined,
  state: GameState,
): SpellResult {
  const caster = players[casterIdx]
  const targetIdx = targetPlayerId
    ? players.findIndex((p) => p.id === targetPlayerId)
    : -1
  const target = targetIdx >= 0 ? players[targetIdx] : undefined
  let newPlayers = [...players]
  let newDeck = [...state.mainDeck]
  const newDiscard = [...state.discardPile]

  const effect = spell.effect

  switch (effect.kind) {
    case 'draw_ingredients': {
      const ingredients = newDeck.filter((c) => c.type === 'ingredient').slice(0, effect.amount)
      const idsDrawn = new Set(ingredients.map((c) => c.id))
      newDeck = newDeck.filter((c) => !idsDrawn.has(c.id))
      newPlayers[casterIdx] = { ...caster, hand: [...caster.hand, ...ingredients] }
      return { players: newPlayers, deck: newDeck, message: `${caster.name} draws ${ingredients.length} ingredient(s) with Nature's Bounty!` }
    }

    case 'draw_any': {
      const drawn = newDeck.slice(0, effect.amount)
      newDeck = newDeck.slice(effect.amount)
      newPlayers[casterIdx] = { ...caster, hand: [...caster.hand, ...drawn] }
      return { players: newPlayers, deck: newDeck, message: `${caster.name} draws ${drawn.length} card(s) with Arcane Intellect!` }
    }

    case 'double_next_mana': {
      newPlayers[casterIdx] = { ...caster, doubleNextMana: true }
      return { players: newPlayers, message: `${caster.name}'s next ingredient gives double mana!` }
    }

    case 'steal_ingredient': {
      if (!target || targetIdx === -1) {
        return { players: newPlayers, message: 'No target selected.' }
      }
      const ingredients = target.hand.filter((c) => c.type === 'ingredient')
      if (!ingredients.length) {
        return { players: newPlayers, message: `${target.name} has no ingredients to steal!` }
      }
      const stolen = randomItem(ingredients)!
      newPlayers[targetIdx] = { ...target, hand: target.hand.filter((c) => c.id !== stolen.id) }
      newPlayers[casterIdx] = { ...caster, hand: [...caster.hand, stolen] }
      return { players: newPlayers, message: `${caster.name} steals ${stolen.name} from ${target.name}!` }
    }

    case 'block_spell': {
      newPlayers[casterIdx] = { ...caster, protected: true }
      return { players: newPlayers, message: `${caster.name} raises a Thorn Barrier!` }
    }

    case 'cancel_spell':
    case 'return_spell': {
      return { players: newPlayers, message: `${caster.name} counters the next spell!` }
    }

    case 'transmute_ingredient': {
      return { players: newPlayers, message: `${caster.name} can now change an ingredient's mana type. (UI: pick ingredient)` }
    }

    case 'discard_random': {
      if (!target || targetIdx === -1) {
        return { players: newPlayers, message: 'No target selected.' }
      }
      if (target.protected) {
        newPlayers[targetIdx] = { ...target, protected: false }
        return { players: newPlayers, message: `${target.name} is protected! Barrier blocks the Fireball.` }
      }
      const discarded: Card[] = []
      let newTargetHand = [...target.hand]
      for (let i = 0; i < effect.amount; i++) {
        if (!newTargetHand.length) break
        const pick = randomItem(newTargetHand)!
        newTargetHand = newTargetHand.filter((c) => c.id !== pick.id)
        discarded.push(pick)
      }
      newPlayers[targetIdx] = { ...target, hand: newTargetHand }
      return {
        players: newPlayers,
        discard: [...newDiscard, ...discarded],
        message: `${caster.name}'s Fireball forces ${target.name} to discard ${discarded.map((c) => c.name).join(', ')}!`,
      }
    }

    case 'destroy_ingredient': {
      if (!target || targetIdx === -1) {
        return { players: newPlayers, message: 'No target selected.' }
      }
      const ingredients = target.hand.filter((c) => c.type === 'ingredient')
      if (!ingredients.length) return { players: newPlayers, message: `${target.name} has no ingredients!` }
      const destroyed = randomItem(ingredients)!
      newPlayers[targetIdx] = { ...target, hand: target.hand.filter((c) => c.id !== destroyed.id) }
      return {
        players: newPlayers,
        discard: [...newDiscard, destroyed],
        message: `${caster.name} burns ${destroyed.name} from ${target?.name ?? 'target'}'s hand!`,
      }
    }

    case 'all_discard_ingredient': {
      newPlayers = newPlayers.map((p, i) => {
        if (i === casterIdx) return p
        if (p.protected) return { ...p, protected: false }
        const ingredients = p.hand.filter((c) => c.type === 'ingredient')
        if (!ingredients.length) return p
        const pick = randomItem(ingredients)!
        return { ...p, hand: p.hand.filter((c) => c.id !== pick.id) }
      })
      return { players: newPlayers, message: `${caster.name}'s Meteor strikes! All players discard an ingredient.` }
    }

    case 'next_ingredient_bonus': {
      // Stored on caster as a flag — simplified
      newPlayers[casterIdx] = { ...caster, doubleNextMana: true }
      return { players: newPlayers, message: `${caster.name}'s Fire Shield: next ingredient gives bonus mana!` }
    }

    case 'all_draw': {
      newPlayers = newPlayers.map((p, i) => {
        if (i === casterIdx) return p
        const drawn = newDeck.slice(0, effect.amount)
        newDeck = newDeck.slice(effect.amount)
        return { ...p, hand: [...p.hand, ...drawn] }
      })
      // Caster too
      const casterDrawn = newDeck.slice(0, effect.amount)
      newDeck = newDeck.slice(effect.amount)
      newPlayers[casterIdx] = { ...caster, hand: [...caster.hand, ...casterDrawn] }
      return { players: newPlayers, deck: newDeck, message: `${caster.name} sings an Inspiring Song — everyone draws ${effect.amount} card(s)!` }
    }

    case 'prevent_spells': {
      // Mark all players
      newPlayers = newPlayers.map((p) => ({ ...p, spellsPrevented: true }))
      return { players: newPlayers, message: `${caster.name}'s Soothing Melody prevents all spells this turn!` }
    }

    case 'show_hand_steal': {
      if (!target || targetIdx === -1) {
        return { players: newPlayers, message: 'No target selected.' }
      }
      const stolen = randomItem(target.hand)
      if (!stolen) return { players: newPlayers, message: `${target.name} has no cards!` }
      newPlayers[targetIdx] = { ...target, hand: target.hand.filter((c) => c.id !== stolen.id) }
      newPlayers[casterIdx] = { ...caster, hand: [...caster.hand, stolen] }
      return { players: newPlayers, message: `${caster.name} uses Discord on ${target.name} and steals ${stolen.name}!` }
    }

    case 'copy_spell': {
      return { players: newPlayers, message: `${caster.name} casts Enchantment — will copy the next spell cast!` }
    }

    case 'drain': {
      if (!target || targetIdx === -1) {
        return { players: newPlayers, message: 'No target selected.' }
      }
      if (target.protected) {
        newPlayers[targetIdx] = { ...target, protected: false }
        return { players: newPlayers, message: `${target.name} is protected from Soul Drain!` }
      }
      // Target discards
      const discarded: Card[] = []
      let newTargetHand = [...target.hand]
      for (let i = 0; i < effect.discardAmount; i++) {
        const pick = randomItem(newTargetHand)
        if (!pick) break
        newTargetHand = newTargetHand.filter((c) => c.id !== pick.id)
        discarded.push(pick)
      }
      // Caster draws
      const drawn = newDeck.slice(0, effect.drawAmount)
      newDeck = newDeck.slice(effect.drawAmount)
      newPlayers[targetIdx] = { ...target, hand: newTargetHand }
      newPlayers[casterIdx] = { ...caster, hand: [...caster.hand, ...drawn] }
      return {
        players: newPlayers,
        deck: newDeck,
        discard: [...newDiscard, ...discarded],
        message: `${caster.name} drains ${target.name}'s soul — they discard and ${caster.name} draws!`,
      }
    }

    case 'hex': {
      if (!target || targetIdx === -1) {
        return { players: newPlayers, message: 'No target selected.' }
      }
      if (target.protected) {
        newPlayers[targetIdx] = { ...target, protected: false }
        return { players: newPlayers, message: `${target.name} is protected from Hex!` }
      }
      newPlayers[targetIdx] = { ...target, hexed: true }
      return { players: newPlayers, message: `${caster.name} hexes ${target.name} — they'll skip their next draw phase!` }
    }

    case 'swap_hands': {
      if (!target || targetIdx === -1) {
        return { players: newPlayers, message: 'No target selected.' }
      }
      const casterHand = [...caster.hand]
      const targetHand = [...target.hand]
      newPlayers[casterIdx] = { ...caster, hand: targetHand }
      newPlayers[targetIdx] = { ...target, hand: casterHand }
      return { players: newPlayers, message: `${caster.name} makes a Dark Bargain — swapping hands with ${target.name}!` }
    }

    case 'shadowweave': {
      if (!target || targetIdx === -1) {
        return { players: newPlayers, message: 'No target selected.' }
      }
      newPlayers[targetIdx] = { ...target, extraSpellCost: (target.extraSpellCost ?? 0) + 2 }
      return { players: newPlayers, message: `${caster.name} weaves shadows — ${target.name}'s next spell costs +2 mana!` }
    }

    default:
      return { players: newPlayers, message: `${caster.name} casts ${spell.name}!` }
  }
}
