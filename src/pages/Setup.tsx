// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Setup Screen (magical redesign)
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CLASSES } from '../data/classes'
import { useGameStore } from '../store/gameStore'
import Background from '../components/Background'
import OnlineLobby from '../components/OnlineLobby'

type Mode = 'home' | 'hotseat' | 'online'

export const Setup: React.FC = () => {
  const [mode, setMode] = useState<Mode>('home')

  return (
    <>
      <Background />
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative"
        style={{ zIndex: 1 }}
      >
        <AnimatePresence mode="wait">
          {mode === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-10"
            >
              <HomeScreen onSelect={setMode} />
            </motion.div>
          )}
          {mode === 'hotseat' && (
            <motion.div
              key="hotseat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col items-center"
            >
              <HotseatSetup onBack={() => setMode('home')} />
            </motion.div>
          )}
          {mode === 'online' && (
            <motion.div
              key="online"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col items-center"
            >
              <OnlineLobby onBack={() => setMode('home')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

// ── Home Screen ───────────────────────────────────────────────────────────────

function HomeScreen({ onSelect }: { onSelect: (m: Mode) => void }) {
  return (
    <>
      {/* Big title */}
      <div className="text-center">
        <h1
          className="title-shimmer"
          style={{
            fontSize: 'clamp(48px, 10vw, 96px)',
            letterSpacing: '0.08em',
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          ✨ ALCHEMY ✨
        </h1>
        <p style={{
          fontFamily: 'Crimson Text, serif',
          fontStyle: 'italic',
          color: '#c9a84c',
          fontSize: 20,
          marginTop: 8,
          letterSpacing: '0.05em',
        }}>
          A game by Ryann Wolff
        </p>
        <p style={{
          fontFamily: 'Crimson Text, serif',
          color: '#8b7a6a',
          fontSize: 15,
          marginTop: 4,
        }}>
          Brew potions · Collect mana · Outmaneuver your rivals
        </p>
      </div>

      {/* Mode selection */}
      <div className="flex flex-col gap-4 w-full" style={{ maxWidth: 400 }}>
        <ModeButton
          icon="🎲"
          title="Play on this device"
          subtitle="Pass & play with 2–4 players"
          onClick={() => onSelect('hotseat')}
          color="#4d9f5d"
        />
        <ModeButton
          icon="🌐"
          title="Play online"
          subtitle="Share a link — play from anywhere"
          onClick={() => onSelect('online')}
          color="#8b5a9f"
        />
      </div>

      <p style={{ color: '#4a3a5a', fontFamily: 'Crimson Text, serif', fontSize: 13 }}>
        First to complete 5 recipes wins!
      </p>
    </>
  )
}

function ModeButton({
  icon,
  title,
  subtitle,
  onClick,
  color,
}: {
  icon: string
  title: string
  subtitle: string
  onClick: () => void
  color: string
}) {
  const [hov, setHov] = useState(false)
  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: hov ? color + '22' : 'rgba(26,18,40,0.8)',
        border: `2px solid ${hov ? color : color + '55'}`,
        borderRadius: 16,
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        cursor: 'pointer',
        boxShadow: hov ? `0 0 24px ${color}44` : 'none',
        transition: 'all 0.2s ease',
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: 32 }}>{icon}</span>
      <div>
        <div style={{ fontFamily: 'Cinzel, serif', fontWeight: 700, color: hov ? color : '#e8d5b7', fontSize: 16 }}>
          {title}
        </div>
        <div style={{ fontFamily: 'Crimson Text, serif', color: '#8b7a6a', fontSize: 13 }}>
          {subtitle}
        </div>
      </div>
    </motion.button>
  )
}

// ── Hotseat Setup ─────────────────────────────────────────────────────────────

function HotseatSetup({ onBack }: { onBack: () => void }) {
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
  const canStart = activeClasses.every((c) => c !== '') && new Set(activeClasses).size === playerCount

  const handleStart = () => {
    if (!canStart) return
    startGame(playerCount, activeClasses, activeNames)
  }

  return (
    <div className="w-full flex flex-col items-center gap-6" style={{ maxWidth: 720 }}>
      {/* Back + title */}
      <div className="w-full flex items-center gap-4">
        <button
          onClick={onBack}
          style={{
            background: 'rgba(26,18,40,0.7)',
            border: '1px solid #4a3a5a',
            borderRadius: 8,
            padding: '6px 12px',
            color: '#8b7a9a',
            fontFamily: 'Cinzel, serif',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <h2 style={{ fontFamily: 'Cinzel, serif', color: '#c9a84c', fontSize: 20, margin: 0 }}>
          ⚗️ Setup Game
        </h2>
      </div>

      {/* Setup panel */}
      <div
        className="w-full parchment rounded-2xl p-6 flex flex-col gap-6"
        style={{ border: '1px solid #8b5a9f44' }}
      >
        {/* Player count */}
        <div>
          <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 11, letterSpacing: '0.15em', color: '#6b5a7a', textTransform: 'uppercase', marginBottom: 10, margin: '0 0 10px 0' }}>
            Number of Alchemists
          </h3>
          <div className="flex gap-3">
            {[2, 3, 4].map((n) => (
              <motion.button
                key={n}
                onClick={() => setPlayerCount(n)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: playerCount === n ? 'radial-gradient(circle at 35% 35%, #4d9f5dcc, #4d9f5d88)' : 'rgba(26,18,40,0.6)',
                  border: `2px solid ${playerCount === n ? '#4d9f5d' : '#4a3a5a'}`,
                  color: playerCount === n ? '#fff' : '#6b5a7a',
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 700,
                  fontSize: 20,
                  cursor: 'pointer',
                  boxShadow: playerCount === n ? '0 0 16px #4d9f5d66' : 'none',
                }}
              >
                {n}
              </motion.button>
            ))}
          </div>
          <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#6b5a7a', fontSize: 13, marginTop: 6 }}>
            {playerCount === 2 ? '7 cards each' : playerCount === 3 ? '6 cards each' : '5 cards each'}
          </p>
        </div>

        {/* Players */}
        <div className="flex flex-col gap-4">
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
          {!canStart && (
            <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#c9a84c', fontSize: 14 }}>
              Each alchemist must choose a unique class.
            </p>
          )}
          <motion.button
            onClick={handleStart}
            disabled={!canStart}
            whileHover={canStart ? { scale: 1.05 } : {}}
            whileTap={canStart ? { scale: 0.97 } : {}}
            className={canStart ? 'brew-button' : ''}
            style={{
              padding: '16px 48px',
              borderRadius: 16,
              fontFamily: 'Cinzel, serif',
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: '0.08em',
              background: canStart
                ? 'linear-gradient(135deg, #2a7a3d, #4d9f5d, #8b5a9f)'
                : '#2a1a3a',
              color: canStart ? '#fff' : '#4a3a5a',
              border: `2px solid ${canStart ? '#4d9f5d' : '#3a2a4a'}`,
              cursor: canStart ? 'pointer' : 'not-allowed',
              opacity: canStart ? 1 : 0.5,
            }}
          >
            ✨ Begin Brewing
          </motion.button>
        </div>
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
    <motion.div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: selected ? selected.color + '11' : 'rgba(26,18,40,0.5)',
        border: `1px solid ${selected ? selected.color + '66' : '#4a3a5a'}`,
        boxShadow: selected ? `0 0 20px ${selected.color}22` : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <div className="flex items-center gap-3">
        <motion.span
          key={selected?.emoji}
          initial={{ scale: 0.5, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          style={{ fontSize: 28 }}
        >
          {selected?.emoji ?? '❓'}
        </motion.span>
        <div className="flex-1">
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: 9, letterSpacing: '0.15em', color: '#6b5a7a', textTransform: 'uppercase', marginBottom: 4 }}>
            Player {playerIndex + 1}
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: `1px solid ${selected?.color ?? '#4a3a5a'}`,
              color: '#e8d5b7',
              fontFamily: 'Cinzel, serif',
              fontWeight: 700,
              fontSize: 16,
              outline: 'none',
              width: '100%',
            }}
            maxLength={20}
          />
        </div>
      </div>

      {/* Class grid */}
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {CLASSES.map((cls) => {
          const isSelected = selectedClass === cls.id
          const isUsed = usedClasses.has(cls.id) && !isSelected

          return (
            <motion.button
              key={cls.id}
              onClick={() => !isUsed && onClassSelect(cls.id)}
              disabled={isUsed}
              whileHover={!isUsed ? { scale: 1.08 } : {}}
              whileTap={!isUsed ? { scale: 0.95 } : {}}
              style={{
                borderRadius: 12,
                padding: '10px 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                background: isSelected ? cls.color + '22' : 'rgba(14,8,22,0.6)',
                border: `2px solid ${isSelected ? cls.color : '#4a3a5a'}`,
                boxShadow: isSelected ? `0 0 14px ${cls.color}55` : 'none',
                cursor: isUsed ? 'not-allowed' : 'pointer',
                opacity: isUsed ? 0.3 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              <span style={{ fontSize: 22, filter: isSelected ? `drop-shadow(0 0 6px ${cls.color})` : 'none' }}>
                {cls.emoji}
              </span>
              <span style={{
                fontFamily: 'Cinzel, serif',
                fontSize: 8,
                fontWeight: 700,
                color: isSelected ? cls.color : '#6b5a7a',
                textAlign: 'center',
                lineHeight: 1.2,
              }}>
                {cls.name.replace('The ', '')}
              </span>
            </motion.button>
          )
        })}
      </div>

      {selected && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-3"
          style={{ background: 'rgba(10,5,18,0.7)', border: `1px solid ${selected.color}33` }}
        >
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: 10, fontWeight: 700, color: selected.color, marginBottom: 3 }}>
            ✨ Class Power — {selected.mana} Mana
          </p>
          <p style={{ fontFamily: 'Crimson Text, serif', fontStyle: 'italic', color: '#b8a898', fontSize: 13 }}>
            {selected.passiveAbility}
          </p>
          <p style={{ fontFamily: 'Crimson Text, serif', color: '#6b5a7a', fontSize: 12, marginTop: 2 }}>
            {selected.description}
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

export default Setup
