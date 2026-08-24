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
  focusPostId: string | null
  setFocusPostId: (id: string | null) => void
  currentPage: number
  totalPages: number
  setCurrentPage: (page: number) => void
  setTotalPages: (total: number) => void
  jumpToPage: number
  setJumpToPage: (page: number) => void
  threadTitle: string
  setThreadTitle: (title: string) => void
  /** Plain-text snippet of the OP for share */
  threadPreview: string
  setThreadPreview: (preview: string) => void
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
  focusPostId: null,
  setFocusPostId: (focusPostId) => set({ focusPostId }),
  currentPage: 1,
  totalPages: 1,
  setCurrentPage: (currentPage) => set({ currentPage }),
  setTotalPages: (totalPages) => set({ totalPages }),
  jumpToPage: 0,
  setJumpToPage: (jumpToPage) => set({ jumpToPage }),
  threadTitle: '',
  setThreadTitle: (threadTitle) => set({ threadTitle }),
  threadPreview: '',
  setThreadPreview: (threadPreview) => set({ threadPreview }),
}))
