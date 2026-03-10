# Alchemy ✨

**A strategic card game by Ryann Wolff**

> Brew potions. Collect mana. Outmaneuver your rivals.

Alchemy is a pass-and-play card game for 2–4 players. Each player takes on the role of an Alchemist — choosing from one of five magical classes — and races to complete 5 potion recipes before their opponents. Manage your mana, deploy ingredients, cast powerful spells, and use your class's unique ability to gain the upper hand.

**First Alchemist to complete 5 recipes wins.**

---

## How to Play

### Setup
1. Choose the number of players (2–4)
2. Each player selects a unique **Alchemist Class**
3. Players receive:
   - Starting hand (7 cards for 2p / 6 cards for 3p / 5 cards for 4p)
   - 5 recipe cards to complete
   - Their class's 8 spell cards as a separate deck
4. 5 cards are placed face-up as the **Market Row**

### Turn Structure

Each turn has three phases:

**1. Draw Phase**
- Draw 1 card from the main deck, OR
- Take 1 card from the Market Row (it's immediately replaced)

**2. Action Phase** *(do as many as you want)*
- 🧪 **Play Ingredients** — add cards from your hand to your mana pool
- ✨ **Cast Spells** — spend mana to cast spells from your spell deck
- 📜 **Use Scrolls** — play scroll cards from your hand for instant effects
- 🏺 **Brew Recipes** — assign mana from your pool toward recipe completion
- ⚡ **Use Class Power** — once per turn, spend 3 mana to activate your class ability

**3. End Phase**
- All unspent mana is lost (mana resets to 0)
- Discard down to 7 cards if over the limit

### Mana System
- Playing ingredient cards adds mana to your pool
- Mana is typed (Fire, Nature, Lunar, Arcane, Shadow) or "Any"
- Mana can be spent on spells or assigned toward recipe progress
- **Recipe progress persists between turns** — you build up potions over multiple turns
- Unspent mana at end of turn is lost

### Winning
Complete **5 recipe cards** to win. Recipes track progress turn-by-turn; once a recipe's mana requirements are fully met, it's automatically completed.

---

## Alchemist Classes

### 🌿 The Druid
- **Mana:** Nature
- **Description:** A nature-loving magician who draws power from the earth.
- **Class Power (3 mana):** Return one card from your hand to the draw pile and draw a new one.

### 🔮 The Mage
- **Mana:** Arcane
- **Description:** A wise wizard dedicated to the study of magic.
- **Class Power (3 mana):** Discard one card from your hand, draw a new card from the pile.

### 🔥 The Sorcerer
- **Mana:** Fire
- **Description:** A powerful magician with a thirst for destruction.
- **Class Power (3 mana):** Draw two extra cards from the draw pile.

### 🌙 The Bard
- **Mana:** Lunar
- **Description:** A charming performer who uses music and moonlight magic.
- **Class Power (3 mana):** Choose one card from an opponent's hand and add it to your own.

### 🕷️ The Witch
- **Mana:** Shadow
- **Description:** A skilled potions maker with a mysterious past.
- **Class Power (3 mana):** Swap two cards in your hand with two cards from the draw pile.

---

## Card Types

### ⚗️ Ingredient Cards (60 total in main deck)
The building blocks of your mana pool. Playing an ingredient adds its mana value to your pool for the turn.

| Rarity | Count | Mana Value |
|--------|-------|------------|
| Common | 4× each (20 total) | 1 mana |
| Uncommon | 3× each (15 total) | 2 mana |
| Rare | 2× each (6 total) | 1–3 mana (any type) |

Special: **Time Flower** — draw an extra card when played.

### 🧪 Recipe Cards (25 total)
Your goal. Each player starts with 5. Recipes require specific combinations of mana across multiple turns.

- **Basic (3×):** Healing Elixir, Fire Bomb, Invisibility Draught, Mana Potion, Truth Serum
- **Advanced (2×):** Dragon's Breath, Shapeshifter's Brew, Mind Control Elixir, Necromancer's Draught, Moonbeam Essence

### ✨ Spell Cards (8 per class, kept separate from main deck)
Class-specific abilities. Pay the mana cost to cast. Each class has 4 unique spells with 2 copies each.

- **Druid:** Nature's Bounty, Wild Growth, Beast Form, Thorn Barrier
- **Mage:** Arcane Intellect, Dispel Magic, Transmutation, Counterspell
- **Sorcerer:** Fireball, Burning Hands, Meteor, Fire Shield
- **Bard:** Inspiring Song, Soothing Melody, Discord, Enchantment
- **Witch:** Soul Drain, Hex, Dark Bargain, Shadowweave

### 📜 Scroll Cards (15 total in main deck)
Powerful instant effects drawn from the main deck.

| Scroll | Effect |
|--------|--------|
| Scroll of Haste | Take an extra turn immediately |
| Scroll of Protection | Immune to all spells this round |
| Scroll of Abundance | Draw 3 cards immediately |
| Scroll of Chaos | All players shuffle hands and redraw same number |
| Scroll of Wisdom | Look at top 5 cards of deck, keep 2 |

---

## Development Setup

```bash
# Clone the repo
git clone git@github.com:Caryyon/alchemy.git
cd alchemy

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Tech Stack
- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Zustand](https://zustand-demo.pmnd.rs/) for game state management
- No backend — fully local, pass-and-play multiplayer

### Project Structure
```
src/
  data/
    cards.ts      ← all 140+ card definitions
    classes.ts    ← 5 alchemist classes
  types/
    game.ts       ← TypeScript types
  store/
    gameStore.ts  ← Zustand game state + rules engine
  components/
    Card.tsx      ← card rendering
    Hand.tsx      ← player hand
    RecipeBoard.tsx
    MarketRow.tsx
    PlayerPanel.tsx
    GameBoard.tsx ← main layout
  pages/
    Setup.tsx     ← game setup
    Game.tsx      ← game screen
```

---

*Alchemy was designed by Ryann Wolff. Built with ❤️ by her dad.*
