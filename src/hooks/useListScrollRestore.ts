import { useEffect, useLayoutEffect, useRef } from 'react'
import { useListScrollStore } from '../store/listScroll'

function getScrollEl() {
  return document.getElementById('main-scroll-container')
}

function applyItemScroll(el: HTMLElement, itemId: string, offset: number): boolean {
  const node = document.querySelector(`[data-tid="${CSS.escape(itemId)}"]`) as HTMLElement | null
  if (!node) return false
  const top = node.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop
  el.scrollTop = Math.max(0, top - offset)
  return true
}

/**
 * Save / restore main-scroll-container position for list pages (timeline, etc.).
 * Prefers restoring by anchored item id (set via rememberListItem on click).
 */
export function useListScrollRestore(
  key: string,
  ready: boolean,
  opts?: {
    hasNextPage?: boolean
    isFetchingNextPage?: boolean
    fetchNextPage?: () => unknown
    /** Changes when list content grows (e.g. threads.length) */
    contentKey?: string | number
    /** Known item ids currently in the loaded list */
    itemIds?: string[]
  },
) {
  const restoreDoneRef = useRef(false)
  const activeKeyRef = useRef(key)
  const { hasNextPage, isFetchingNextPage, fetchNextPage, contentKey, itemIds } = opts ?? {}

  useEffect(() => {
    if (activeKeyRef.current === key) return
    const el = getScrollEl()
    if (el && activeKeyRef.current && restoreDoneRef.current) {
      const prev = useListScrollStore.getState().get(activeKeyRef.current)
      useListScrollStore.getState().save(activeKeyRef.current, {
        itemId: prev?.itemId ?? null,
        offset: prev?.offset ?? 0,
        scrollTop: el.scrollTop,
      })
    }
    activeKeyRef.current = key
    restoreDoneRef.current = false
  }, [key])

  useLayoutEffect(() => {
    if (!key || !ready || restoreDoneRef.current) return
    const el = getScrollEl()
    if (!el) return

    // Sidebar (etc.) asked to open this list at the top
    if (useListScrollStore.getState().consumeReset(key)) {
      el.scrollTop = 0
      restoreDoneRef.current = true
      return
    }

    const saved = useListScrollStore.getState().get(key)
    if (!saved || (!saved.itemId && saved.scrollTop <= 0)) {
      restoreDoneRef.current = true
      return
    }

    if (saved.itemId) {
      if (applyItemScroll(el, saved.itemId, saved.offset)) {
        restoreDoneRef.current = true
        return
      }

      const loaded = itemIds?.includes(saved.itemId)
      // Item not in DOM yet — keep loading pages if it might be further down
      if (!loaded && hasNextPage && !isFetchingNextPage && fetchNextPage) {
        void fetchNextPage()
        return
      }

      if (loaded) {
        // In data but not painted — wait for next layout
        return
      }

      if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
        void fetchNextPage()
        return
      }

      if (!hasNextPage && !isFetchingNextPage) {
        // Give up on id; fall back to scrollTop
        el.scrollTop = saved.scrollTop
        restoreDoneRef.current = true
      }
      return
    }

    el.scrollTop = saved.scrollTop
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight)
    if (saved.scrollTop <= maxScroll + 2 || !hasNextPage) {
      restoreDoneRef.current = true
      return
    }
    if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
      void fetchNextPage()
      return
    }
    if (!hasNextPage && !isFetchingNextPage) restoreDoneRef.current = true
  }, [key, ready, contentKey, hasNextPage, isFetchingNextPage, fetchNextPage, itemIds])

  useEffect(() => {
    if (!key) return
    const el = getScrollEl()
    if (!el) return

    const saveScrollTop = () => {
      if (!restoreDoneRef.current) return
      const prev = useListScrollStore.getState().get(key)
      useListScrollStore.getState().save(key, {
        itemId: prev?.itemId ?? null,
        offset: prev?.offset ?? 0,
        scrollTop: el.scrollTop,
      })
    }

    let timer = 0
    const onScroll = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(saveScrollTop, 100)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.clearTimeout(timer)
      saveScrollTop()
      el.removeEventListener('scroll', onScroll)
    }
  }, [key])
}
