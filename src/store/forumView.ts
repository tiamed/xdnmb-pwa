import { create } from 'zustand'

interface ForumViewState {
  createThreadOpen: boolean
  setCreateThreadOpen: (v: boolean) => void
}

export const useForumViewStore = create<ForumViewState>((set) => ({
  createThreadOpen: false,
  setCreateThreadOpen: (createThreadOpen) => set({ createThreadOpen }),
}))