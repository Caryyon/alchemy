// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Animated Starfield Background (AAA visual overhaul)
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

// Generate stars with deterministic positions
function generateStars(count: number, seed: number = 42) {
  const stars: { id: number; x: number; y: number; size: number; delay: number; duration: number; color: string }[] = []
  let s = seed
  const random = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }

  const colors = ['#ffffff', '#ffffff', '#ffffff', '#c9a84c', '#8b5a9f', '#4d9f5d', '#5c8a8a']

  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      x: random() * 100,
      y: random() * 100,
      size: random() * 2 + 0.5,
      delay: random() * 5,
      duration: random() * 3 + 2,
      color: colors[Math.floor(random() * colors.length)],
    })
  }
  return stars
}

export const Background: React.FC = () => {
  const stars = useMemo(() => generateStars(150), [])

  return (
    <>
      {/* Base gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #12082a 0%, #0a0612 50%, #050308 100%)',
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Animated nebula blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: '-20%',
            left: '10%',
            width: '60vw',
            height: '60vh',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, #8b5a9f33 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <motion.div
          animate={{
            x: [0, -40, 20, 0],
            y: [0, 30, -25, 0],
            opacity: [0.12, 0.2, 0.12],
          }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '5%',
            width: '50vw',
            height: '50vh',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, #4d9f5d22 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
        <motion.div
          animate={{
            x: [0, 20, -30, 0],
            y: [0, -30, 15, 0],
            opacity: [0.1, 0.18, 0.1],
          }}
          transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: '30%',
            right: '20%',
            width: '40vw',
            height: '40vh',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, #5c8a8a22 0%, transparent 70%)',
            filter: 'blur(90px)',
          }}
        />
      </div>

      {/* CSS starfield layer */}
      <div className="starfield" aria-hidden="true" />

      {/* Animated individual stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              borderRadius: '50%',
              background: star.color,
              boxShadow: `0 0 ${star.size * 2}px ${star.color}88`,
            }}
          />
        ))}
      </div>

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(5,3,8,0.5) 80%, rgba(5,3,8,0.8) 100%)',
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Bottom magic mist */}
      <div className="magic-mist" aria-hidden="true" />
    </>
  )
}

export default Background
