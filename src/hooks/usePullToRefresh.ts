import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

function getScrollEl() {
  return document.getElementById('main-scroll-container')
}

const DEFAULT_THRESHOLD = 64
const MAX_PULL = 96
const REFRESH_H = 40

export type PullPhase = 'idle' | 'pull' | 'ready' | 'refreshing'

/**
 * Pull-to-refresh on #main-scroll-container.
 * Gesture updates go through rAF + imperative DOM (no React re-render per frame).
 */
export function usePullToRefresh(opts: {
  onRefresh: () => void | Promise<unknown>
  enabled?: boolean
  threshold?: number
  indicatorRef: RefObject<HTMLDivElement | null>
}) {
  const { onRefresh, enabled = true, threshold = DEFAULT_THRESHOLD, indicatorRef } = opts
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)
  const pullPx = useRef(0)
  const phase = useRef<PullPhase>('idle')
  const raf = useRef(0)
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled
  const refreshingRef = useRef(false)
  const thresholdRef = useRef(threshold)
  thresholdRef.current = threshold

  const paint = useCallback((px: number, nextPhase: PullPhase, animate: boolean) => {
    const root = indicatorRef.current
    if (!root) return
    const h = nextPhase === 'refreshing' ? REFRESH_H : Math.max(0, px)
    root.style.transition = animate ? 'height .2s ease-out, opacity .15s ease-out' : 'none'
    root.style.height = `${h}px`
    root.style.opacity = h > 1 || nextPhase === 'refreshing' ? '1' : '0'

    const icon = root.querySelector<HTMLElement>('[data-ptr-icon]')
    const label = root.querySelector<HTMLElement>('[data-ptr-label]')
    if (icon) {
      if (nextPhase === 'refreshing' || nextPhase === 'ready') {
        icon.classList.add('animate-spin')
        icon.style.transform = ''
      } else {
        icon.classList.remove('animate-spin')
        const progress = Math.min(1, px / thresholdRef.current)
        icon.style.transform = `rotate(${progress * 270}deg)`
      }
    }
    if (label) {
      const text =
        nextPhase === 'refreshing' ? '刷新中…'
          : nextPhase === 'ready' ? '松开刷新'
            : '下拉刷新'
      if (label.textContent !== text) label.textContent = text
      label.classList.toggle('text-accent', nextPhase === 'ready' || nextPhase === 'refreshing')
      label.classList.toggle('text-muted', nextPhase === 'idle' || nextPhase === 'pull')
    }
    phase.current = nextPhase
  }, [indicatorRef])

  const schedulePaint = useCallback((px: number, nextPhase: PullPhase) => {
    pullPx.current = px
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      raf.current = 0
      paint(pullPx.current, nextPhase, false)
    })
  }, [paint])

  const runRefresh = useCallback(async () => {
    if (refreshingRef.current) return
    refreshingRef.current = true
    setRefreshing(true)
    paint(REFRESH_H, 'refreshing', true)
    try {
      await onRefreshRef.current()
    } finally {
      refreshingRef.current = false
      setRefreshing(false)
      pullPx.current = 0
      paint(0, 'idle', true)
    }
  }, [paint])

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
        schedulePaint(0, 'idle')
        return
      }
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0) {
        schedulePaint(0, 'idle')
        return
      }
      const resisted = Math.min(MAX_PULL, dy * 0.4)
      const next: PullPhase = resisted >= thresholdRef.current ? 'ready' : 'pull'
      schedulePaint(resisted, next)
      if (resisted > 6) e.preventDefault()
    }

    const onTouchEnd = () => {
      if (!pulling.current) return
      pulling.current = false
      if (raf.current) {
        cancelAnimationFrame(raf.current)
        raf.current = 0
      }
      const px = pullPx.current
      if (px >= thresholdRef.current && enabledRef.current && !refreshingRef.current) {
        void runRefresh()
        return
      }
      pullPx.current = 0
      paint(0, 'idle', true)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [paint, schedulePaint, runRefresh])

  // Reset visual when disabled mid-gesture
  useEffect(() => {
    if (!enabled && !refreshingRef.current) {
      pullPx.current = 0
      paint(0, 'idle', true)
    }
  }, [enabled, paint])

  return { refreshing, threshold }
}
