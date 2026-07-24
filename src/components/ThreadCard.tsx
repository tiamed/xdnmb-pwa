import { useState, useRef, useEffect } from 'react'
import { Star, MessageSquare, ChevronRight, X } from 'lucide-react'
import { Chip } from '@heroui/react'
import { getImageUrl } from '../api/client'
import type { ForumThread } from '../types/api'
import { stripHtml, truncateText, formatTime } from '../hooks/useUtils'
import { useSettingsStore } from '../store/settings'
import { useFavoritesStore } from '../store/favorites'
interface Props { thread: ForumThread; forumName?: string; onOpen?: () => void }

export default function ThreadCard({ thread, forumName, onOpen }: Props) {
  const { imageMode } = useSettingsStore()
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore()
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const touchRef = useRef<{ x: number; y: number; dist: number; zoom: number; px: number; py: number } | null>(null)
  const wheelRef = useRef<HTMLImageElement>(null)
  const dragMoved = useRef(false)
  useEffect(() => {
    const el = wheelRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      setZoom(z => Math.max(0.5, Math.min(10, z - e.deltaY * 0.005)))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [viewerOpen])
  const fav = isFavorite(thread.id)
  const preview = stripHtml(thread.content)
  const hasImage = thread.img && thread.ext
  const rc = Number(thread.ReplyCount || 0)

  return (
    <>
      <div onClick={onOpen}
        className="px-3 py-2.5 border-b border-divider cursor-pointer hover:bg-default-50 active:bg-default-100 active:scale-[0.99] transition-all duration-150 origin-left">
        <div className="flex gap-2.5">
          {hasImage && imageMode !== 'hidden' && (
            <div onClick={e => { e.stopPropagation(); setViewerOpen(true) }}
              className="shrink-0 w-[68px] h-[68px] rounded-lg overflow-hidden bg-default-100 border border-divider cursor-pointer hover:opacity-80 transition-opacity">
              {imgError ? (
                <div className="w-full h-full flex items-center justify-center text-default-300 text-[10px]">无图</div>
              ) : (
                <img src={getImageUrl(thread.img, thread.ext, true)} alt="" loading="lazy"
                  className={`w-full h-full object-cover ${imgLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                  onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)} />
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0 flex-1">
                {thread.title && thread.title !== '无标题' && (
                  <h3 className="font-medium text-foreground truncate text-sm">{thread.title}</h3>
                )}
                <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted">
                  <span className="text-accent font-mono">No.{thread.id}</span>
                  {thread.user_hash && <span className={thread.admin ? 'text-danger font-bold' : ''}>{thread.user_hash}</span>}
                  {forumName && <Chip size="sm" variant="soft" color="accent" className="h-4 text-[10px]">{forumName}</Chip>}
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); fav ? removeFavorite(thread.id) : addFavorite({
                id: thread.id, title: thread.title || '无标题', forumName: forumName || '', forumId: thread.fid || '',
                preview: truncateText(preview, 100), img: thread.img, ext: thread.ext, replyCount: rc
              }) }}
                className={`shrink-0 p-1 rounded-lg transition-colors ${fav ? 'text-warning bg-warning-50 dark:bg-warning-900/20' : 'text-default-300 hover:text-warning-400'}`}>
                <Star size={15} fill={fav ? 'currentColor' : 'none'} />
              </button>
            </div>
            <p className="text-sm text-muted mt-1 line-clamp-2 leading-relaxed break-all">{truncateText(preview, 120)}</p>
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex items-center gap-2.5 text-[11px] text-muted">
                <span>{formatTime(thread.now)}</span>
                <span className="flex items-center gap-0.5"><MessageSquare size={11} />{rc}</span>
              </div>
              <ChevronRight size={13} className="text-default-300" />
            </div>
            {thread.Replies?.length > 0 && (
              <div className="mt-1.5 pl-2 border-l-2 border-default-200 dark:border-default-700 space-y-1">
                {thread.Replies.slice(0, 3).map(r => (
                  <div key={r.id} className="text-[11px] text-muted leading-relaxed break-all">
                    <span className="text-accent-400">No.{r.id}</span><span className="mx-0.5">:</span>
                    {truncateText(stripHtml(r.content), 50)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {viewerOpen && (
        <div className="fixed inset-0 z-[90] bg-black/80 flex items-center justify-center" onClick={() => setViewerOpen(false)}>
          <button onClick={() => setViewerOpen(false)} className="absolute top-4 right-4 z-10 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors">
            <X size={20} />
          </button>
          <div onClick={e => e.stopPropagation()} className="w-screen h-screen overflow-hidden select-none flex items-center justify-center">
            <img ref={wheelRef} src={getImageUrl(thread.img, thread.ext)} alt=""
              className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
              style={{ transform: `scale(${zoom}) translate(${pos.x / zoom}px, ${pos.y / zoom}px)` }}
              onMouseDown={e => {
                if (e.button !== 0) return
                dragMoved.current = false
                const sx = e.clientX - pos.x, sy = e.clientY - pos.y
                const mv = (e: MouseEvent) => { dragMoved.current = true; setPos({ x: e.clientX - sx, y: e.clientY - sy }) }
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
              onClick={() => { if (!dragMoved.current) setViewerOpen(false) }} />
          </div>
        </div>
      )}
    </>
  )
}
