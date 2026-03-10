// ────────────────────────────────────────────────────────────────────────────
// Alchemy — Action Log Store
// ────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'

export interface LogEntry {
  id: number
  text: string
  emoji: string
  timestamp: number
}

let _id = 0

interface ActionLogState {
  entries: LogEntry[]
  addEntry: (text: string, emoji?: string) => void
  clear: () => void
}

export const useActionLog = create<ActionLogState>((set) => ({
  entries: [],

  addEntry: (text, emoji = '✦') => {
    const entry: LogEntry = { id: ++_id, text, emoji, timestamp: Date.now() }
    set((s) => ({
      entries: [entry, ...s.entries].slice(0, 8), // keep last 8
    }))
  },

  clear: () => set({ entries: [] }),
}))
