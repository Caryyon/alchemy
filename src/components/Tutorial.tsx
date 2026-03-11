// ────────────────────────────────────────────────────────────────────────────
// Alchemy — In-Game Tutorial
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TUTORIAL_STORAGE_KEY = 'alchemy_tutorial_seen'

interface TutorialStep {
  title: string
  content: string
  highlight?: boolean
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Welcome to Alchemy!',
    content:
      'Welcome, aspiring alchemist! This tutorial will teach you the fundamentals of the game. Use the arrows below to navigate, or skip if you already know how to play.',
  },
  {
    title: 'Your Goal',
    content:
      'The first player to complete 5 recipes wins the game. Brew potions by channeling mana into your recipe cards. Each recipe requires specific types and amounts of mana.',
  },
  {
    title: 'Turn Phases',
    content:
      'Each turn has three phases: Draw (pick a card from the market or deck), Action (play ingredients, cast spells, brew recipes), and End (finish your turn and pass to the next player).',
  },
  {
    title: 'The Market Row',
    content:
      'The market row shows 5 face-up cards you can draw from. You can also draw blind from the deck. During your Draw phase, click any market card or the deck to draw.',
  },
  {
    title: 'Your Hand',
    content:
      'Your hand holds cards you can play. Ingredients provide mana when played. Scrolls have powerful one-time effects. You can hold up to 7 cards.',
  },
  {
    title: 'Playing Ingredients',
    content:
      'Click an ingredient card in your hand during the Action phase to play it. The ingredient will add its mana value to your mana pool for that type (Fire, Nature, Lunar, Arcane, or Shadow).',
  },
  {
    title: 'Any Mana is a WILDCARD!',
    content:
      'Some ingredients produce "Any" mana. This is a WILDCARD that can be spent as ANY mana type! If a recipe needs Fire mana and you have Any mana, you can use it. Any mana is extremely flexible and valuable!',
    highlight: true,
  },
  {
    title: 'Mana Pool Resets',
    content:
      'Your mana pool resets at the end of your turn. Make sure to spend your mana before ending your turn, or it will be lost! Plan carefully to maximize each turn.',
  },
  {
    title: 'Brewing Recipes',
    content:
      'To brew a recipe, click on the colored progress bars beneath each recipe card. Each click spends 1 mana of that type from your pool. Fill all bars completely to complete the recipe!',
  },
  {
    title: 'Spells',
    content:
      'Your class has unique spells that appear in your spell deck. Spells cost mana to cast and have powerful effects—drawing cards, stealing from opponents, or disrupting their plans.',
  },
  {
    title: 'Class Special Power',
    content:
      'Each class has a special power you can use once per turn if you have at least 3 total mana. Look for your class ability in the player panel. Use it wisely!',
  },
  {
    title: 'End Turn',
    content:
      'When you\'ve finished your actions, click "End Turn" to pass play to the next player. Remember: mana resets, so spend it before you end!',
  },
]

interface TutorialProps {
  onClose: () => void
}

export const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const step = tutorialSteps[currentStep]
  const isLast = currentStep === tutorialSteps.length - 1
  const isFirst = currentStep === 0

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true')
      onClose()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSkip = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true')
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 flex items-end justify-center pb-6 pointer-events-none"
      style={{
        zIndex: 100,
        background: 'rgba(10, 5, 18, 0.75)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="pointer-events-auto"
        style={{
          background: 'rgba(10, 5, 18, 0.92)',
          border: step.highlight ? '2px solid #c9a84c' : '2px solid #4d9f5d',
          borderRadius: 16,
          padding: '24px 32px',
          maxWidth: 560,
          width: '90%',
          boxShadow: step.highlight
            ? '0 0 40px rgba(201, 168, 76, 0.4), 0 0 80px rgba(201, 168, 76, 0.2)'
            : '0 0 40px rgba(77, 159, 93, 0.3)',
        }}
      >
        {/* Title */}
        <AnimatePresence mode="wait">
          <motion.h2
            key={`title-${currentStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            style={{
              fontFamily: 'Cinzel, serif',
              fontWeight: 700,
              fontSize: 20,
              color: step.highlight ? '#c9a84c' : '#4d9f5d',
              margin: '0 0 12px 0',
            }}
          >
            {step.highlight && '⭐ '}
            {step.title}
          </motion.h2>
        </AnimatePresence>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.p
            key={`content-${currentStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            style={{
              fontFamily: 'Crimson Text, serif',
              fontSize: 16,
              lineHeight: 1.6,
              color: '#e8d5b7',
              margin: '0 0 20px 0',
            }}
          >
            {step.content}
          </motion.p>
        </AnimatePresence>

        {/* Progress dots */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 20,
          }}
        >
          {tutorialSteps.map((_, idx) => (
            <motion.div
              key={idx}
              animate={{
                scale: idx === currentStep ? 1.2 : 1,
                backgroundColor: idx === currentStep ? '#4d9f5d' : idx < currentStep ? '#4d9f5d66' : '#3a2a4a',
              }}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                cursor: 'pointer',
              }}
              onClick={() => setCurrentStep(idx)}
            />
          ))}
        </div>

        {/* Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {/* Skip link */}
          <motion.button
            onClick={handleSkip}
            whileHover={{ color: '#e8d5b7' }}
            style={{
              fontFamily: 'Crimson Text, serif',
              fontSize: 14,
              color: '#6b5a7a',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Skip Tutorial
          </motion.button>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            {!isFirst && (
              <motion.button
                onClick={handlePrev}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 600,
                  fontSize: 14,
                  padding: '10px 20px',
                  borderRadius: 10,
                  background: 'transparent',
                  border: '1px solid #4a3a5a',
                  color: '#8b7a8a',
                  cursor: 'pointer',
                }}
              >
                Previous
              </motion.button>
            )}
            <motion.button
              onClick={handleNext}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              style={{
                fontFamily: 'Cinzel, serif',
                fontWeight: 700,
                fontSize: 14,
                padding: '10px 24px',
                borderRadius: 10,
                background: isLast
                  ? 'linear-gradient(135deg, #c9a84c, #a8873d)'
                  : 'linear-gradient(135deg, #2a7a3d, #4d9f5d)',
                border: isLast ? '2px solid #c9a84c' : '2px solid #4d9f5d',
                color: '#fff',
                cursor: 'pointer',
                boxShadow: isLast
                  ? '0 0 16px rgba(201, 168, 76, 0.4)'
                  : '0 0 16px rgba(77, 159, 93, 0.3)',
              }}
            >
              {isLast ? 'Start Playing!' : 'Next'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(false)

  const openTutorial = () => setShowTutorial(true)
  const closeTutorial = () => setShowTutorial(false)

  const shouldAutoShow = (): boolean => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(TUTORIAL_STORAGE_KEY) !== 'true'
  }

  return {
    showTutorial,
    openTutorial,
    closeTutorial,
    shouldAutoShow,
  }
}

export default Tutorial
