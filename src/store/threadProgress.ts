import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ThreadProgress {
  /** API page the user was reading */
  page: number
  /** Visible post id used as scroll anchor */
  postId: string | null
  /** Distance from scroll container top to the anchor post top */
  offset: number
  updatedAt: number
}

interface ThreadProgressState {
  byId: Record<string, ThreadProgress>
  save: (threadId: string, progress: Omit<ThreadProgress, 'updatedAt'>) => void
  get: (threadId: string) => ThreadProgress | undefined
  clear: (threadId: string) => void
}

const MAX_ENTRIES = 300

export const useThreadProgressStore = create<ThreadProgressState>()(
  persist(
    (set, get) => ({
      byId: {},

      save: (threadId, progress) => {
        if (!threadId) return
        set(state => {
          const byId = { ...state.byId, [threadId]: { ...progress, updatedAt: Date.now() } }
          const ids = Object.keys(byId)
          if (ids.length <= MAX_ENTRIES) return { byId }
          // Drop oldest when over cap
          const sorted = ids.sort((a, b) => (byId[a].updatedAt ?? 0) - (byId[b].updatedAt ?? 0))
          for (let i = 0; i < ids.length - MAX_ENTRIES; i++) delete byId[sorted[i]]
          return { byId }
        })
      },

      get: (threadId) => get().byId[threadId],

      clear: (threadId) => {
        set(state => {
          if (!state.byId[threadId]) return state
          const byId = { ...state.byId }
          delete byId[threadId]
          return { byId }
        })
      },
    }),
    { name: 'nmb-thread-progress' },
  ),
)
