import { create } from 'zustand'

export interface ListScrollPos {
  /** Clicked / anchored list item id */
  itemId: string | null
  /** Distance from scroll container top to the item top when saved */
  offset: number
  /** Fallback absolute scrollTop */
  scrollTop: number
}

interface ListScrollState {
  byKey: Record<string, ListScrollPos>
  /** Keys that should open at top on next restore (e.g. sidebar switch) */
  pendingReset: Record<string, true>
  save: (key: string, pos: ListScrollPos) => void
  get: (key: string) => ListScrollPos | undefined
  clear: (key: string) => void
  markReset: (key: string) => void
  consumeReset: (key: string) => boolean
}

export const useListScrollStore = create<ListScrollState>((set, get) => ({
  byKey: {},
  pendingReset: {},

  save: (key, pos) => {
    if (!key) return
    set(state => ({
      byKey: {
        ...state.byKey,
        [key]: {
          itemId: pos.itemId,
          offset: pos.offset,
          scrollTop: Math.max(0, pos.scrollTop),
        },
      },
    }))
  },

  get: (key) => get().byKey[key],

  clear: (key) => {
    set(state => {
      if (!(key in state.byKey)) return state
      const byKey = { ...state.byKey }
      delete byKey[key]
      return { byKey }
    })
  },

  markReset: (key) => {
    if (!key) return
    set(state => ({ pendingReset: { ...state.pendingReset, [key]: true } }))
  },

  consumeReset: (key) => {
    if (!key || !get().pendingReset[key]) return false
    set(state => {
      if (!(key in state.pendingReset)) return state
      const pendingReset = { ...state.pendingReset }
      delete pendingReset[key]
      return { pendingReset }
    })
    return true
  },
}))

function getScrollEl() {
  return document.getElementById('main-scroll-container')
}

/** Remember the list item the user opened (id + viewport offset). */
export function rememberListItem(key: string, itemId: string) {
  if (!key || !itemId) return
  const el = getScrollEl()
  const node = document.querySelector(`[data-tid="${CSS.escape(itemId)}"]`) as HTMLElement | null
  const offset =
    el && node
      ? node.getBoundingClientRect().top - el.getBoundingClientRect().top
      : 0
  useListScrollStore.getState().save(key, {
    itemId,
    offset,
    scrollTop: el?.scrollTop ?? 0,
  })
}

/** Persist current scroll for a list key before switching away. */
export function saveCurrentListScroll(key: string) {
  if (!key) return
  const el = getScrollEl()
  if (!el) return
  const prev = useListScrollStore.getState().get(key)
  useListScrollStore.getState().save(key, {
    itemId: prev?.itemId ?? null,
    offset: prev?.offset ?? 0,
    scrollTop: el.scrollTop,
  })
}

/**
 * Next open of this list should land at page-1 top (sidebar switch).
 * Does not scroll immediately — caller may scroll when staying on the same key.
 */
export function requestListTop(key: string) {
  if (!key) return
  const store = useListScrollStore.getState()
  store.clear(key)
  store.markReset(key)
}

/** Resolve scroll key for the current forum/timeline route. */
export function listScrollKeyFromPath(pathname: string, homeTimelineId = ''): string | null {
  if (pathname.startsWith('/f/')) {
    const id = pathname.split('/')[2]
    return id ? `forum:${id}` : null
  }
  if (pathname.startsWith('/timeline/')) {
    const id = pathname.split('/')[2]
    return id ? `timeline:${id}` : null
  }
  if (pathname === '/' && homeTimelineId) return `timeline:${homeTimelineId}`
  return null
}
