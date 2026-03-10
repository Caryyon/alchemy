// ────────────────────────────────────────────────────────────────────────────
// Alchemy — App Root
// A strategic card game by Ryann Wolff
// ────────────────────────────────────────────────────────────────────────────

import { useGameStore } from './store/gameStore'
import Setup from './pages/Setup'
import Game from './pages/Game'

function App() {
  const { phase } = useGameStore()

  return (
    <>
      {phase === 'setup' && <Setup />}
      {(phase === 'playing' || phase === 'gameover') && <Game />}
    </>
  )
}

export default App
