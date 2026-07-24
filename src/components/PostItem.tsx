import { useState } from 'react'
import { Reply, ImageOff, X } from 'lucide-react'
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
  const { imageMode, fontSize, showSpoiler } = useSettingsStore()
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [showImg, setShowImg] = useState(imageMode !== 'blur')
  const [viewerOpen, setViewerOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const hasImage = post.img && post.ext
  const isPoMain = isPo || post.user_hash === poHash
  const isTip = !('fid' in post) || !(post as Post).fid

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('quote-link')) {
      const pid = target.getAttribute('data-pid')
      if (pid && onQuoteClick) { e.preventDefault(); onQuoteClick(pid) }
    }
    if (target.classList.contains('spoiler')) {
      target.classList.toggle('revealed')
    }
  }

  const renderHTML = () => {
    let html = post.content
    html = html.replace(/&gt;&gt;No\.(\d+)/g, '<span class="quote-link" data-pid="$1">&gt;&gt;No.$1</span>')
    if (!showSpoiler) {
      html = html.replace(/\[h\]([\s\S]*?)\[\/h\]/g, '<span class="spoiler">隐藏内容</span>')
    }
    return { __html: html }
  }

  const handleImgMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    const startX = e.clientX - pos.x
    const startY = e.clientY - pos.y
    const onMove = (e: MouseEvent) => { setPos({ x: e.clientX - startX, y: e.clientY - startY }) }
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <>
      <div className={`px-3 py-2.5 border-b border-divider ${isTip ? 'bg-warning-50/30 dark:bg-warning-900/10' : ''} ${isPoMain && !isTip ? 'bg-primary-50/20 dark:bg-primary-900/5' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-1 text-xs mb-1">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {post.title && post.title !== '无标题' && (
              <span className="font-medium text-default-900 text-sm truncate max-w-[180px]">{post.title}</span>
            )}
            <span className="text-primary font-mono shrink-0">No.{post.id}</span>
            <span className={`shrink-0 ${((post as Post).admin || (post as Reference).admin) ? 'text-danger font-bold' : 'text-default-400'}`}>
              {post.user_hash}
            </span>
            {isPoMain && !isTip && <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary px-1.5 py-0.5 rounded font-medium">楼主</span>}
            {(post as Post).name && (post as Post).name !== '无名氏' && <span className="text-default-400">{(post as Post).name}</span>}
            {isTip && <span className="text-xs bg-warning-100 dark:bg-warning-900/30 text-warning-600 px-1.5 py-0.5 rounded">提示</span>}
          </div>
          <span className="text-default-400 shrink-0">{formatTime(post.now)}</span>
        </div>

        {/* Image */}
        {hasImage && imageMode !== 'hidden' && (
          <div className="mb-1.5">
            {!showImg ? (
              <button onClick={() => setShowImg(true)} className="flex items-center gap-1 text-xs text-default-400 hover:text-primary transition-colors">
                <ImageOff size={14} /> 显示图片
              </button>
            ) : imgError ? (
              <div className="flex items-center gap-1 text-xs text-default-400"><ImageOff size={14} /> 图片加载失败</div>
            ) : (
              <div className="inline-block rounded-lg overflow-hidden border border-divider cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setViewerOpen(true)}>
                <img src={getImageUrl(post.img, post.ext, true)} alt="" loading="lazy"
                  className={`max-w-[180px] max-h-[180px] object-contain ${imgLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity`}
                  onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)} />
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="text-sm leading-relaxed break-words text-default-700 [overflow-wrap:anywhere]" style={{ fontSize: `${fontSize}px` }}
          onClick={handleContentClick} dangerouslySetInnerHTML={renderHTML()} />

        {/* Actions */}
        {showReply && !isTip && (
          <button onClick={() => onReply?.(post.id)}
            className="mt-1.5 flex items-center gap-1 text-xs text-default-400 hover:text-primary transition-colors">
            <Reply size={12} /> 回复
          </button>
        )}
      </div>

      {/* Image Viewer */}
      {viewerOpen && (
        <div className="fixed inset-0 z-[90] bg-black/80 flex items-center justify-center" onClick={() => setViewerOpen(false)}>
          <button onClick={() => setViewerOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-black/40 rounded-full text-white hover:bg-black/60">
            <X size={20} />
          </button>
          <div className="text-white/60 text-xs absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 rounded-full px-3 py-1">
            滚轮缩放 · 拖拽移动 · 点击关闭
          </div>
          <div onClick={e => e.stopPropagation()} className="max-w-[90vw] max-h-[85vh] overflow-hidden">
            <img
              src={getImageUrl(post.img, post.ext)}
              alt=""
              className="max-w-[90vw] max-h-[85vh] object-contain cursor-grab active:cursor-grabbing select-none"
              style={{ transform: `scale(${zoom}) translate(${pos.x / zoom}px, ${pos.y / zoom}px)` }}
              onWheel={e => { e.preventDefault(); setZoom(z => Math.max(0.5, Math.min(5, z - e.deltaY * 0.005))) }}
              onMouseDown={handleImgMouseDown}
              onDoubleClick={() => { setZoom(1); setPos({ x: 0, y: 0 }) }}
            />
          </div>
        </div>
      )}
    </>
  )
}
