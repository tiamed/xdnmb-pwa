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
  save: (key: string, pos: ListScrollPos) => void
  get: (key: string) => ListScrollPos | undefined
  clear: (key: string) => void
}

export const useListScrollStore = create<ListScrollState>((set, get) => ({
  byKey: {},

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
