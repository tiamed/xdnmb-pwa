import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FavoriteThread {
  id: string
  title: string
  forumName: string
  forumId: string
  preview: string
  img: string
  ext: string
  replyCount: number
  addedAt: number
  lastReplyCount: number
}

interface FavoritesState {
  items: FavoriteThread[]
  addFavorite: (thread: Omit<FavoriteThread, 'addedAt' | 'lastReplyCount'>) => void
  removeFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  updateReplyCount: (id: string, replyCount: number) => void
  syncFromFeed: (thread: Omit<FavoriteThread, 'addedAt' | 'lastReplyCount'>) => void
  clearFavorites: () => void
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],

      addFavorite: (thread) => {
        const { items } = get()
        if (items.find((i) => i.id === thread.id)) return
        const newItem: FavoriteThread = {
          ...thread,
          addedAt: Date.now(),
          lastReplyCount: thread.replyCount,
        }
        set({ items: [newItem, ...items] })
      },

      removeFavorite: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
      },

      isFavorite: (id) => {
        return get().items.some((i) => i.id === id)
      },

      updateReplyCount: (id, replyCount) => {
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, lastReplyCount: replyCount } : i,
          ),
        })
      },

      syncFromFeed: (thread) => {
        const { items } = get()
        const existing = items.find((i) => i.id === thread.id)
        if (existing) {
          set({
            items: items.map((i) =>
              i.id === thread.id
                ? { ...i, replyCount: thread.replyCount, lastReplyCount: thread.replyCount, forumName: thread.forumName, forumId: thread.forumId, title: thread.title, preview: thread.preview, img: thread.img, ext: thread.ext }
                : i,
            ),
          })
        } else {
          const newItem: FavoriteThread = {
            ...thread,
            addedAt: Date.now(),
            lastReplyCount: thread.replyCount,
          }
          set({ items: [newItem, ...items] })
        }
      },

      clearFavorites: () => {
        set({ items: [] })
      },
    }),
    {
      name: 'nmb-favorites',
    },
  ),
)
