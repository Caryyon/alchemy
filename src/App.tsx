// ────────────────────────────────────────────────────────────────────────────
// Alchemy — App Root (with URL hash routing)
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { useMultiplayerStore } from './store/multiplayerStore'
import Setup from './pages/Setup'
import Game from './pages/Game'

function App() {
  const phase = useGameStore((s) => s.phase)
  const hydrateFromMultiplayer = useGameStore((s) => s.hydrateFromMultiplayer)
  const { myPlayerId, isHost } = useMultiplayerStore()

  // Non-host: hydrate game state when server broadcasts game_started
  useEffect(() => {
    const handler = (e: Event) => {
      const { gameState, playerOrder } = (e as CustomEvent).detail
      if (!isHost && gameState) {
        hydrateFromMultiplayer(gameState, playerOrder || [], myPlayerId)
      }
    }
    window.addEventListener('alchemy:game_started', handler)
    return () => window.removeEventListener('alchemy:game_started', handler)
  }, [isHost, myPlayerId, hydrateFromMultiplayer])

  // Also handle state_sync for reconnecting players
  useEffect(() => {
    const handler = (e: Event) => {
      const { gameState } = (e as CustomEvent).detail
      if (gameState && phase !== 'playing') {
        hydrateFromMultiplayer(gameState, [], myPlayerId)
      }
    }
    window.addEventListener('alchemy:state_sync', handler)
    return () => window.removeEventListener('alchemy:state_sync', handler)
  }, [phase, myPlayerId, hydrateFromMultiplayer])

  return (
    <>
      {phase === 'setup' && <Setup />}
      {(phase === 'playing' || phase === 'gameover') && <Game />}
    </>
  )
}

export default App
