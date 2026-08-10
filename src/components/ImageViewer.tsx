import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface Props {
  src: string
  onClose: () => void
}

/** Full-screen image preview: pan / zoom / tap-to-close work on image and mask. */
export default function ImageViewer({ src, onClose }: Props) {
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const touchRef = useRef<{ x: number; y: number; dist: number; zoom: number; px: number; py: number } | null>(null)
  const dragMoved = useRef(false)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-[90] bg-black/80 flex items-center justify-center select-none touch-none"
      onClick={() => { if (!dragMoved.current) onClose() }}
      onWheel={e => {
        e.preventDefault()
        setZoom(z => Math.max(0.5, Math.min(10, z - e.deltaY * 0.005)))
      }}
      onMouseDown={e => {
        if (e.button !== 0) return
        dragMoved.current = false
        const sx = e.clientX - pos.x
        const sy = e.clientY - pos.y
        const mv = (ev: MouseEvent) => {
          dragMoved.current = true
          setPos({ x: ev.clientX - sx, y: ev.clientY - sy })
        }
        const up = () => {
          document.removeEventListener('mousemove', mv)
          document.removeEventListener('mouseup', up)
        }
        document.addEventListener('mousemove', mv)
        document.addEventListener('mouseup', up)
      }}
      onTouchStart={e => {
        dragMoved.current = false
        if (e.touches.length === 1) {
          touchRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            dist: 0,
            zoom,
            px: pos.x,
            py: pos.y,
          }
        } else if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX
          const dy = e.touches[0].clientY - e.touches[1].clientY
          touchRef.current = {
            x: 0,
            y: 0,
            dist: Math.hypot(dx, dy),
            zoom,
            px: pos.x,
            py: pos.y,
          }
        }
      }}
      onTouchMove={e => {
        const cur = touchRef.current
        if (!cur) return
        if (e.touches.length === 1) {
          const dx = e.touches[0].clientX - cur.x
          const dy = e.touches[0].clientY - cur.y
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved.current = true
          setPos({ x: cur.px + dx, y: cur.py + dy })
        } else if (e.touches.length === 2) {
          dragMoved.current = true
          const dx = e.touches[0].clientX - e.touches[1].clientX
          const dy = e.touches[0].clientY - e.touches[1].clientY
          const dist = Math.hypot(dx, dy)
          if (cur.dist > 0) {
            setZoom(Math.max(0.5, Math.min(10, cur.zoom * (dist / cur.dist))))
          }
        }
      }}
      onTouchEnd={() => { touchRef.current = null }}
    >
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onClose() }}
        className="absolute top-4 right-4 z-10 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors"
        aria-label="关闭"
      >
        <X size={20} />
      </button>
      <img
        src={src}
        alt=""
        draggable={false}
        className="max-w-full max-h-full object-contain pointer-events-none"
        style={{ transform: `scale(${zoom}) translate(${pos.x / zoom}px, ${pos.y / zoom}px)` }}
      />
    </div>,
    document.body,
  )
}
