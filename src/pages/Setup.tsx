// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Setup Screen
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { CLASSES } from '../data/classes'
import { useGameStore } from '../store/gameStore'

export const Setup: React.FC = () => {
  const { startGame } = useGameStore()

  const [playerCount, setPlayerCount] = useState(2)
  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4'])
  const [selectedClasses, setSelectedClasses] = useState<string[]>(['druid', 'mage', '', ''])

  const handleClassSelect = (playerIdx: number, classId: string) => {
    setSelectedClasses((prev) => {
      const next = [...prev]
      next[playerIdx] = classId
      return next
    })
  }

  const handleNameChange = (playerIdx: number, name: string) => {
    setPlayerNames((prev) => {
      const next = [...prev]
      next[playerIdx] = name
      return next
    })
  }

  const activeClasses = selectedClasses.slice(0, playerCount)
  const activeNames = playerNames.slice(0, playerCount)
  const usedClasses = new Set(activeClasses)

  const canStart =
    activeClasses.every((c) => c !== '') &&
    new Set(activeClasses).size === playerCount // no duplicate classes

  const handleStart = () => {
    if (!canStart) return
    startGame(playerCount, activeClasses, activeNames)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: '#0d0d0d', color: '#e0e0e0' }}
    >
      {/* Title */}
      <div className="text-center mb-12">
        <h1
          className="text-6xl font-black tracking-tight mb-2"
          style={{
            background: 'linear-gradient(135deg, #4d9f5d, #8b5a9f)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          ⚗️ Alchemy
        </h1>
        <p className="text-gray-400 text-lg">A strategic card game by Ryann Wolff</p>
        <p className="text-gray-600 text-sm mt-2">
          Brew potions. Collect mana. Outmaneuver your rivals. First to complete 5 recipes wins.
        </p>
      </div>

      {/* Setup card */}
      <div
        className="w-full max-w-3xl rounded-2xl p-8 flex flex-col gap-8"
        style={{ background: '#1a1a1a', border: '1px solid #2f2f2f' }}
      >
        {/* Player count */}
        <div>
          <h2 className="text-sm uppercase tracking-widest text-gray-500 mb-3">
            Number of Players
          </h2>
          <div className="flex gap-3">
            {[2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                className="px-6 py-3 rounded-xl font-bold text-lg transition-all duration-200 hover:scale-105"
                style={{
                  background: playerCount === n ? '#4d9f5d' : '#252525',
                  color: playerCount === n ? '#fff' : '#666',
                  border: `2px solid ${playerCount === n ? '#4d9f5d' : '#2f2f2f'}`,
                  boxShadow: playerCount === n ? '0 0 16px #4d9f5d44' : 'none',
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {playerCount === 2 ? '7 cards each' : playerCount === 3 ? '6 cards each' : '5 cards each'}
          </p>
        </div>

        {/* Player setups */}
        <div className="flex flex-col gap-6">
          {Array.from({ length: playerCount }, (_, i) => (
            <PlayerSetup
              key={i}
              playerIndex={i}
              name={playerNames[i]}
              selectedClass={selectedClasses[i]}
              usedClasses={usedClasses}
              onNameChange={(name) => handleNameChange(i, name)}
              onClassSelect={(classId) => handleClassSelect(i, classId)}
            />
          ))}
        </div>

        {/* Start button */}
        <div className="flex flex-col items-center gap-3">
          {!canStart && activeClasses.some((c) => c === '') && (
            <p className="text-yellow-500 text-sm">Each player must choose a class.</p>
          )}
          {canStart && new Set(activeClasses).size !== playerCount && (
            <p className="text-yellow-500 text-sm">Each player must choose a unique class.</p>
          )}

          <button
            onClick={handleStart}
            disabled={!canStart}
            className="px-12 py-4 rounded-2xl font-black text-xl transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: canStart
                ? 'linear-gradient(135deg, #4d9f5d, #8b5a9f)'
                : '#2f2f2f',
              color: '#fff',
              boxShadow: canStart ? '0 0 30px #4d9f5d44' : 'none',
            }}
          >
            ✨ Begin Brewing
          </button>
        </div>
      </div>

      {/* Rules teaser */}
      <div className="mt-8 text-center text-gray-600 text-sm max-w-lg">
        <p>
          Each turn: draw a card → play ingredients for mana → cast spells → assign mana to recipes.
          Complete 5 recipes to win!
        </p>
      </div>
    </div>
  )
}

// ── Player Setup Row ──────────────────────────────────────────────────────────

interface PlayerSetupProps {
  playerIndex: number
  name: string
  selectedClass: string
  usedClasses: Set<string>
  onNameChange: (name: string) => void
  onClassSelect: (classId: string) => void
}

function PlayerSetup({
  playerIndex,
  name,
  selectedClass,
  usedClasses,
  onNameChange,
  onClassSelect,
}: PlayerSetupProps) {
  const selected = CLASSES.find((c) => c.id === selectedClass)

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{
        background: '#252525',
        border: `1px solid ${selected ? selected.color + '66' : '#2f2f2f'}`,
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{selected?.emoji ?? '❓'}</span>
        <div className="flex-1">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Player {playerIndex + 1}</p>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="bg-transparent border-b text-white font-bold text-lg focus:outline-none w-full"
            style={{ borderColor: selected?.color ?? '#2f2f2f' }}
            maxLength={20}
          />
        </div>
      </div>

      {/* Class grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {CLASSES.map((cls) => {
          const isSelected = selectedClass === cls.id
          const isUsed = usedClasses.has(cls.id) && !isSelected

          return (
            <button
              key={cls.id}
              onClick={() => !isUsed && onClassSelect(cls.id)}
              disabled={isUsed}
              className="rounded-xl p-3 flex flex-col items-center gap-1 transition-all duration-200 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: isSelected ? cls.color + '22' : '#1a1a1a',
                border: `2px solid ${isSelected ? cls.color : '#2f2f2f'}`,
                boxShadow: isSelected ? `0 0 12px ${cls.color}44` : 'none',
              }}
            >
              <span className="text-2xl">{cls.emoji}</span>
              <span
                className="text-xs font-bold text-center leading-tight"
                style={{ color: isSelected ? cls.color : '#888' }}
              >
                {cls.name}
              </span>
              <span className="text-[9px] text-gray-600 text-center leading-tight">
                {cls.mana} mana
              </span>
            </button>
          )
        })}
      </div>

      {selected && (
        <div
          className="rounded-lg p-3"
          style={{ background: '#1a1a1a', border: `1px solid ${selected.color}33` }}
        >
          <p className="text-xs font-bold mb-1" style={{ color: selected.color }}>
            ✨ Class Ability
          </p>
          <p className="text-xs text-gray-400">{selected.passiveAbility}</p>
          <p className="text-xs text-gray-600 mt-1">{selected.description}</p>
        </div>
      )}
    </div>
  )
}

export default Setup
