import { useCallback, useEffect, useRef, useState } from 'react'

function getScrollEl() {
  return document.getElementById('main-scroll-container')
}

const DEFAULT_THRESHOLD = 64
const MAX_PULL = 120

/**
 * Pull-to-refresh on #main-scroll-container.
 * Only activates when the container is scrolled to the top.
 */
export function usePullToRefresh(opts: {
  onRefresh: () => void | Promise<unknown>
  enabled?: boolean
  threshold?: number
}) {
  const { onRefresh, enabled = true, threshold = DEFAULT_THRESHOLD } = opts
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled
  const refreshingRef = useRef(false)

  const runRefresh = useCallback(async () => {
    if (refreshingRef.current) return
    refreshingRef.current = true
    setRefreshing(true)
    setPull(threshold)
    try {
      await onRefreshRef.current()
    } finally {
      refreshingRef.current = false
      setRefreshing(false)
      setPull(0)
    }
  }, [threshold])

  useEffect(() => {
    const el = getScrollEl()
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      if (!enabledRef.current || refreshingRef.current) return
      if (el.scrollTop > 1) return
      startY.current = e.touches[0].clientY
      pulling.current = true
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || !enabledRef.current || refreshingRef.current) return
      if (el.scrollTop > 1) {
        pulling.current = false
        setPull(0)
        return
      }
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0) {
        setPull(0)
        return
      }
      // Resist overscroll so it feels elastic
      const resisted = Math.min(MAX_PULL, dy * 0.45)
      setPull(resisted)
      if (resisted > 8) {
        // Prevent native bounce / browser refresh fighting the gesture
        e.preventDefault()
      }
    }

    const onTouchEnd = () => {
      if (!pulling.current) return
      pulling.current = false
      setPull(current => {
        if (current >= threshold && enabledRef.current && !refreshingRef.current) {
          void runRefresh()
          return threshold
        }
        return 0
      })
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [runRefresh, threshold])

  return { pull, refreshing, threshold }
}
