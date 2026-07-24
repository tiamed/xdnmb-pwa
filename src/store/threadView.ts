import { create } from 'zustand'

interface ThreadViewState {
  poOnly: boolean
  setPoOnly: (v: boolean) => void
  replyOpen: boolean
  setReplyOpen: (v: boolean) => void
  replyTo: string | null
  setReplyTo: (id: string | null) => void
  referencePostId: string | null
  setReferencePostId: (id: string | null) => void
}

export const useThreadViewStore = create<ThreadViewState>((set) => ({
  poOnly: false,
  setPoOnly: (poOnly) => set({ poOnly }),
  replyOpen: false,
  setReplyOpen: (replyOpen) => set({ replyOpen }),
  replyTo: null,
  setReplyTo: (replyTo) => set({ replyTo }),
  referencePostId: null,
  setReferencePostId: (referencePostId) => set({ referencePostId }),
}))