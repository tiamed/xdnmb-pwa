import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useDrag } from '@use-gesture/react'
import { useSpring, animated, to } from '@react-spring/web'
import { useForumViewStore } from '../store/forumView'
import ForumList from './ForumList'

const EDGE_PX = 24
const PANEL_MAX = 288 // w-72
const FLICK_VX = 0.45 // px/ms

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

  // External open/close (NavBar, Esc, list select) — skip while finger is down
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

  const bind = useDrag(
    ({ first, last, active, movement: [mx], velocity: [vx], direction: [dirX], canceled }) => {
      if (canceled) return
      const w = widthRef.current

      if (first) {
        draggingRef.current = true
        dragStartX.current = openRef.current ? 0 : -w
        if (!openRef.current) setContentReady(true)
      }

      const nextX = Math.min(0, Math.max(-w, dragStartX.current + mx))

      if (active) {
        api.start({ x: nextX, immediate: true })
        return
      }

      if (last) {
        draggingRef.current = false
        const progress = (nextX + w) / w // 0 closed → 1 open
        let nextOpen = progress >= 0.5
        if (vx > FLICK_VX) {
          if (dirX > 0) nextOpen = true
          if (dirX < 0) nextOpen = false
        }
        setSidebarOpen(nextOpen)
        api.start({ x: nextOpen ? 0 : -w })
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      pointer: { touch: true },
      // Don't steal vertical list scroll until horizontal intent is clear
      threshold: 8,
    },
  )

  const progress = to([x], (xv) => {
    const w = widthRef.current || PANEL_MAX
    return Math.min(1, Math.max(0, (xv + w) / w))
  })

  return createPortal(
    // Root must be pointer-events-none when closed — fixed inset-0 would otherwise eat all touches
    <div className="fixed inset-0 z-[60] pointer-events-none" aria-hidden={!open}>
      {/* Backdrop — only interactive when open */}
      <animated.div
        className="absolute inset-0 bg-black/30 pointer-events-auto"
        style={{
          opacity: progress,
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={close}
        {...(open ? bind() : {})}
      />

      {/* Left edge hit area to start opening when closed */}
      {!open && (
        <div
          className="absolute left-0 top-0 bottom-0 z-[1] touch-none pointer-events-auto"
          style={{ width: EDGE_PX }}
          aria-hidden
          {...bind()}
        />
      )}

      <animated.aside
        role="dialog"
        aria-modal={open}
        aria-label="切换版块"
        className="absolute left-0 top-0 bottom-0 max-w-[85vw] bg-background shadow-xl flex flex-col touch-pan-y pointer-events-auto"
        style={{
          width,
          x,
          pointerEvents: open ? 'auto' : 'none',
          touchAction: 'pan-y',
        }}
        {...(open ? bind() : {})}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-divider sticky top-0 bg-background z-10 shrink-0 touch-none"
          {...(open ? bind() : {})}
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
