import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface HistoryItem {
  id: string
  title: string
  forumName: string
  forumId: string
  preview: string
  img: string
  ext: string
  replyCount: number
  visitedAt: number
}

interface HistoryState {
  items: HistoryItem[]
  addHistory: (item: HistoryItem) => void
  removeHistory: (id: string) => void
  clearHistory: () => void
}

const MAX_HISTORY = 500

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      items: [],

      addHistory: (item) => {
        const { items } = get()
        // 移除已存在的同 id 项
        const filtered = items.filter((i) => i.id !== item.id)
        // 插入到最前面
        const newItems = [item, ...filtered].slice(0, MAX_HISTORY)
        set({ items: newItems })
      },

      removeHistory: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
      },

      clearHistory: () => {
        set({ items: [] })
      },
    }),
    {
      name: 'nmb-history',
    },
  ),
)
