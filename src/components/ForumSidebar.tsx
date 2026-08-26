import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useDrag } from '@use-gesture/react'
import { useSpring, animated, to } from '@react-spring/web'
import { useForumViewStore } from '../store/forumView'
import ForumList from './ForumList'

const EDGE_RATIO = 0.85 // open gesture may start within left 85% of viewport
const PANEL_MAX = 288 // w-72
const FLICK_VX = 0.4 // px/ms
const AXIS_LOCK = 1.2 // horizontal must dominate vertical

function panelWidth() {
  if (typeof window === 'undefined') return PANEL_MAX
  return Math.min(PANEL_MAX, window.innerWidth * 0.85)
}

export default function ForumSidebar() {
  const open = useForumViewStore(s => s.sidebarOpen)
  const setSidebarOpen = useForumViewStore(s => s.setSidebarOpen)

  const [width, setWidth] = useState(panelWidth)
  const [contentReady, setContentReady] = useState(open)
  const openRef = useRef(open)
  const widthRef = useRef(width)
  const dragStartX = useRef(0)
  const draggingRef = useRef(false)

  openRef.current = open
  widthRef.current = width

  const [{ x }, api] = useSpring(() => ({
    x: open ? 0 : -panelWidth(),
    config: { tension: 280, friction: 32 },
  }))
  const apiRef = useRef(api)
  apiRef.current = api

  useLayoutEffect(() => {
    const sync = () => {
      const w = panelWidth()
      setWidth(w)
      widthRef.current = w
      if (!draggingRef.current) {
        api.start({ x: openRef.current ? 0 : -w, immediate: true })
      }
    }
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [api])

  useEffect(() => {
    if (open) setContentReady(true)
    if (draggingRef.current) return
    api.start({ x: open ? 0 : -width })
  }, [open, width, api])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, setSidebarOpen])

  const close = useCallback(() => setSidebarOpen(false), [setSidebarOpen])

  const finishDrag = useCallback((nextX: number, vx: number, dirX: number) => {
    const w = widthRef.current
    draggingRef.current = false
    const progress = (nextX + w) / w
    let nextOpen = progress >= 0.45
    if (vx > FLICK_VX) {
      if (dirX > 0) nextOpen = true
      if (dirX < 0) nextOpen = false
    }
    if (nextOpen) setContentReady(true)
    setSidebarOpen(nextOpen)
    api.start({ x: nextOpen ? 0 : -w })
  }, [api, setSidebarOpen])

  /**
   * Open gesture: listen on document in capture phase.
   * A left-edge hit div under pointer-events-none ancestors is unreliable on mobile;
   * document capture always sees the touch regardless of stacking.
   */
  useEffect(() => {
    let tracking = false
    let locked = false
    let startX = 0
    let startY = 0
    let lastX = 0
    let lastT = 0
    let vx = 0

    const onStart = (e: TouchEvent) => {
      if (openRef.current || draggingRef.current) return
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      if (t.clientX > window.innerWidth * EDGE_RATIO) return
      tracking = true
      locked = false
      startX = t.clientX
      startY = t.clientY
      lastX = t.clientX
      lastT = e.timeStamp
      vx = 0
      dragStartX.current = -widthRef.current
    }

    const onMove = (e: TouchEvent) => {
      if (!tracking || e.touches.length !== 1) return
      const t = e.touches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      const dt = e.timeStamp - lastT
      if (dt > 0) {
        vx = Math.abs(t.clientX - lastX) / dt
        lastX = t.clientX
        lastT = e.timeStamp
      }

      if (!locked) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
        if (Math.abs(dx) < Math.abs(dy) * AXIS_LOCK) {
          tracking = false
          return
        }
        locked = true
        draggingRef.current = true
      }

      e.preventDefault()
      const w = widthRef.current
      const nextX = Math.min(0, Math.max(-w, -w + dx))
      apiRef.current.start({ x: nextX, immediate: true })
    }

    const onEnd = (e: TouchEvent) => {
      if (!tracking) return
      const wasLocked = locked
      tracking = false
      if (!wasLocked) {
        draggingRef.current = false
        return
      }
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const w = widthRef.current
      const nextX = Math.min(0, Math.max(-w, -w + dx))
      const dirX = dx >= 0 ? 1 : -1
      finishDrag(nextX, vx, dirX)
    }

    document.addEventListener('touchstart', onStart, { capture: true, passive: true })
    document.addEventListener('touchmove', onMove, { capture: true, passive: false })
    document.addEventListener('touchend', onEnd, { capture: true, passive: true })
    document.addEventListener('touchcancel', onEnd, { capture: true, passive: true })
    return () => {
      document.removeEventListener('touchstart', onStart, true)
      document.removeEventListener('touchmove', onMove, true)
      document.removeEventListener('touchend', onEnd, true)
      document.removeEventListener('touchcancel', onEnd, true)
    }
  }, [finishDrag])

  // Close: drag on panel / backdrop (use-gesture is fine once the panel is interactive)
  const bindClose = useDrag(
    ({ first, last, active, movement: [mx], velocity: [vx], direction: [dirX], canceled }) => {
      if (!openRef.current) return
      const w = widthRef.current

      if (canceled) {
        draggingRef.current = false
        api.start({ x: 0 })
        return
      }

      if (first) {
        draggingRef.current = true
        dragStartX.current = 0
      }

      const nextX = Math.min(0, Math.max(-w, dragStartX.current + mx))

      if (active) {
        api.start({ x: nextX, immediate: true })
        return
      }

      if (last) finishDrag(nextX, vx, dirX)
    },
    {
      axis: 'x',
      filterTaps: true,
      pointer: { touch: true },
      threshold: 8,
      enabled: open,
    },
  )

  const progress = to([x], (xv) => {
    const w = widthRef.current || PANEL_MAX
    return Math.min(1, Math.max(0, (xv + w) / w))
  })

  return createPortal(
    <div className="fixed inset-0 z-[60] pointer-events-none" aria-hidden={!open}>
      <animated.div
        className="absolute inset-0 bg-black/30"
        style={{
          opacity: progress,
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={close}
        {...(open ? bindClose() : {})}
      />

      <animated.aside
        role="dialog"
        aria-modal={open}
        aria-label="切换版块"
        className="absolute left-0 top-0 bottom-0 max-w-[85vw] bg-background shadow-xl flex flex-col touch-pan-y"
        style={{
          width,
          x,
          pointerEvents: open ? 'auto' : 'none',
          touchAction: 'pan-y',
        }}
        {...(open ? bindClose() : {})}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-divider sticky top-0 bg-background z-10 shrink-0 touch-none"
          {...(open ? bindClose() : {})}
        >
          <span className="font-bold text-lg text-accent">X岛</span>
          <button
            type="button"
            onClick={close}
            className="p-1 text-muted hover:text-foreground text-xl leading-none"
            aria-label="关闭"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none overscroll-contain">
          {contentReady && <ForumList onSelect={close} />}
        </div>
      </animated.aside>
    </div>,
    document.body,
  )
}
