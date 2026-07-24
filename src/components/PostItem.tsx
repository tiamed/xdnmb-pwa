import { useState, useRef, useEffect } from 'react'
import { Reply, ImageOff, X, ZoomIn } from 'lucide-react'
import { Chip } from '@heroui/react'
import { getImageUrl } from '../api/client'
import { useSettingsStore } from '../store/settings'
import { formatTime } from '../hooks/useUtils'
import type { Post, Reference } from '../types/api'

interface Props {
  post: Post | Reference
  isPo?: boolean
  poHash?: string
  onQuoteClick?: (id: string) => void
  showReply?: boolean
  onReply?: (id: string) => void
}

export default function PostItem({ post, isPo = false, poHash, onQuoteClick, showReply = true, onReply }: Props) {
  const { imageMode, showSpoiler } = useSettingsStore()
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [showImg, setShowImg] = useState(imageMode !== 'blur')
  const [viewerOpen, setViewerOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [actionSheetOpen, setActionSheetOpen] = useState(false)
  const touchRef = useRef<{ x: number; y: number; dist: number; zoom: number; px: number; py: number } | null>(null)
  const wheelRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const el = wheelRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      setZoom(z => Math.max(0.5, Math.min(10, z - e.deltaY * 0.005)))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const hasImage = post.img && post.ext
  const isPoMain = isPo || post.user_hash === poHash
  // Reference type has 'status' field; don't render as system-tip
  const isTip = !('status' in post) && (!('fid' in post) || !(post as Post).fid)

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement
    if (t.classList.contains('quote-link')) {
      const pid = t.getAttribute('data-pid')
      if (pid && onQuoteClick) { e.preventDefault(); onQuoteClick(pid) }
    }
    if (t.classList.contains('spoiler')) { t.classList.toggle('revealed') }
  }

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement
    if (t.closest('button, a, img, .quote-link, .spoiler')) return
    setActionSheetOpen(true)
  }

  const renderHTML = () => {
    let html = post.content
    html = html.replace(/&gt;&gt;No\.(\d+)/g, '<span class="quote-link" data-pid="$1">&gt;&gt;No.$1</span>')
    if (!showSpoiler) html = html.replace(/\[h\]([\s\S]*?)\[\/h\]/g, '<span class="spoiler">隐藏内容</span>')
    return { __html: html }
  }

  return (
    <>
      <div className={`px-3 py-2.5 border-b border-divider active:bg-default-50 transition-colors duration-150 cursor-pointer ${isTip ? 'bg-warning-50/50 dark:bg-warning-900/10' : ''} ${isPoMain && !isTip ? 'bg-accent-50/30 dark:bg-accent-900/5' : ''}`}
        onClick={handleCardClick}>
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-1 text-xs mb-1">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {post.title && post.title !== '无标题' && (
              <span className="font-medium text-foreground text-sm truncate max-w-[180px]">{post.title}</span>
            )}
            <span className="text-accent font-mono shrink-0">No.{post.id}</span>
            <span className={`shrink-0 ${((post as Post).admin || (post as Reference).admin) ? 'text-danger font-bold' : 'text-muted'}`}>
              {post.user_hash}
            </span>
            {isPoMain && !isTip && (
              <Chip size="sm" variant="soft" color="accent" className="h-4 text-[10px]">楼主</Chip>
            )}
            {(post as Post).name && (post as Post).name !== '无名氏' && (
              <span className="text-muted">{(post as Post).name}</span>
            )}
            {isTip && (
              <Chip size="sm" variant="soft" color="warning" className="h-4 text-[10px]">提示</Chip>
            )}
          </div>
          <span className="text-muted shrink-0">{formatTime(post.now)}</span>
        </div>

        {/* Image */}
        {hasImage && imageMode !== 'hidden' && (
          <div className="mb-1.5">
            {!showImg ? (
              <button onClick={() => setShowImg(true)} className="flex items-center gap-1 text-xs text-muted hover:text-accent transition-colors">
                <ImageOff size={14} /> 显示图片
              </button>
            ) : imgError ? (
              <div className="flex items-center gap-1 text-xs text-muted"><ImageOff size={14} /> 图片加载失败</div>
            ) : (
              <div className="relative inline-block group">
                <div className="rounded-lg overflow-hidden border border-divider cursor-pointer"
                  onClick={() => setViewerOpen(true)}>
                  <img src={getImageUrl(post.img, post.ext, true)} alt="" loading="lazy"
                    className={`max-w-[180px] max-h-[180px] object-contain ${imgLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                    onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)} />
                </div>
                <div className="absolute bottom-1 right-1 bg-black/50 text-white rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => setViewerOpen(true)}>
                  <ZoomIn size={14} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="post-content text-sm leading-relaxed break-words text-foreground/80 [overflow-wrap:anywhere]"
          onClick={handleContentClick} dangerouslySetInnerHTML={renderHTML()} />

      </div>

      {/* Action Sheet */}
      {showReply && !isTip && actionSheetOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setActionSheetOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-lg animate-[slideUp_0.2s_ease-out] px-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]"
            onClick={e => e.stopPropagation()}>
            <div className="bg-background rounded-2xl overflow-hidden shadow-xl border border-divider/50">
              <button onClick={() => { onReply?.(post.id); setActionSheetOpen(false) }}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 text-sm font-medium text-foreground hover:bg-default-100 active:bg-default-200 transition-colors">
                <Reply size={16} className="text-accent" />
                回复
              </button>
            </div>
            <button onClick={() => setActionSheetOpen(false)}
              className="w-full mt-2 py-3.5 text-sm font-medium text-foreground bg-background rounded-2xl shadow-sm border border-divider/50 hover:bg-default-100 active:bg-default-200 transition-colors">
              取消
            </button>
          </div>
        </div>
      )}

      {/* Image Viewer */}
      {viewerOpen && (
        <div className="fixed inset-0 z-[90] bg-black/80 flex items-center justify-center" onClick={() => setViewerOpen(false)}>
          <button onClick={() => setViewerOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors">
            <X size={20} />
          </button>
          <div className="text-white/60 text-xs absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 rounded-full px-3 py-1 pointer-events-none">
            滚轮缩放 · 拖拽移动 · 双击复原
          </div>
          <div onClick={e => e.stopPropagation()} className="w-screen h-screen overflow-hidden select-none flex items-center justify-center">
            <img ref={wheelRef} src={getImageUrl(post.img, post.ext)} alt=""
              className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
              style={{ transform: `scale(${zoom}) translate(${pos.x / zoom}px, ${pos.y / zoom}px)` }}
              onMouseDown={e => {
                if (e.button !== 0) return
                const sx = e.clientX - pos.x, sy = e.clientY - pos.y
                const mv = (e: MouseEvent) => setPos({ x: e.clientX - sx, y: e.clientY - sy })
                const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up) }
                document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up)
              }}
              onTouchStart={e => {
                if (e.touches.length === 1) {
                  touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0, zoom, px: pos.x, py: pos.y }
                } else if (e.touches.length === 2) {
                  const dx = e.touches[0].clientX - e.touches[1].clientX
                  const dy = e.touches[0].clientY - e.touches[1].clientY
                  touchRef.current = { x: 0, y: 0, dist: Math.hypot(dx, dy), zoom, px: pos.x, py: pos.y }
                }
              }}
              onTouchMove={e => {
                const cur = touchRef.current
                if (!cur) return
                e.preventDefault()
                if (e.touches.length === 1) {
                  const dx = e.touches[0].clientX - cur.x
                  const dy = e.touches[0].clientY - cur.y
                  setPos({ x: cur.px + dx, y: cur.py + dy })
                } else if (e.touches.length === 2) {
                  const dx = e.touches[0].clientX - e.touches[1].clientX
                  const dy = e.touches[0].clientY - e.touches[1].clientY
                  const dist = Math.hypot(dx, dy)
                  const scale = dist / cur.dist
                  setZoom(Math.max(0.5, Math.min(10, cur.zoom * scale)))
                }
              }}
              onTouchEnd={() => { touchRef.current = null }}
              onDoubleClick={() => { if (zoom > 1) { setZoom(1); setPos({ x: 0, y: 0 }) } else { setZoom(2) } }}
            />
          </div>
        </div>
      )}
    </>
  )
}
