import { useState } from 'react'
import { getImageUrl } from '../api/client'
import { useSettingsStore } from '../store/settings'
import { formatTime } from '../hooks/useUtils'
import type { Post, Reference } from '../types/api'

interface PostItemProps {
  post: Post | Reference
  isPo?: boolean
  poHash?: string
  onQuoteClick?: (postId: string) => void
  showReply?: boolean
  onReply?: (postId: string) => void
}

export default function PostItem({
  post,
  isPo = false,
  poHash,
  onQuoteClick,
  showReply = true,
  onReply,
}: PostItemProps) {
  const { imageMode, fontSize, showSpoiler } = useSettingsStore()
  const [imgLoaded, setImgLoaded] = useState(false)
  const [showImg, setShowImg] = useState(imageMode !== 'blur')

  const hasImage = post.img && post.ext
  const isPoMain = isPo || post.user_hash === poHash
  const isTip = !('fid' in post) || !(post as Post).fid

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement

    // 引用点击
    if (target.classList.contains('quote-link')) {
      const postId = target.getAttribute('data-post-id')
      if (postId && onQuoteClick) {
        e.preventDefault()
        onQuoteClick(postId)
      }
      return
    }

    // 隐藏内容点击
    if (target.classList.contains('spoiler')) {
      target.classList.toggle('revealed')
      return
    }
  }

  // 渲染内容（处理引用和隐藏标签）
  const renderContent = () => {
    let html = post.content
    // 引用链接
    html = html.replace(
      /&gt;&gt;No\.(\d+)/g,
      '<span class="quote-link text-green-600 dark:text-green-400 cursor-pointer hover:underline">&gt;&gt;No.$1</span>',
    )
    // [h] 隐藏标签
    if (!showSpoiler) {
      html = html.replace(
        /\[h\]([\s\S]*?)\[\/h\]/g,
        '<span class="spoiler bg-gray-800 text-gray-800 dark:bg-black dark:text-black cursor-pointer select-none rounded px-1 text-xs">隐藏内容</span>',
      )
    }
    return { __html: html }
  }

  return (
    <div
      className={`p-3 border-b border-gray-200 dark:border-gray-700 ${
        isTip ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
      } ${isPoMain ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''}`}
    >
      {/* 头部信息 */}
      <div className="flex items-center justify-between flex-wrap gap-1 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {post.title && post.title !== '无标题' && (
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              {post.title}
            </span>
          )}
          {(post as Post).name && (post as Post).name !== '无名氏' && (
            <span className="text-gray-600 dark:text-gray-400">
              {(post as Post).name}
            </span>
          )}
          <span className="text-purple-500 font-mono">No.{post.id}</span>
          <span
            className={`${
              (post as Post).admin || (post as Reference).admin
                ? 'text-red-500 font-bold'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            ID:{post.user_hash}
          </span>
          {isPoMain && !isTip && (
            <span className="text-purple-500 bg-purple-100 dark:bg-purple-900/30 px-1 rounded text-xs">
              PO
            </span>
          )}
          {isTip && (
            <span className="text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded text-xs">
              提示
            </span>
          )}
        </div>
        <span className="text-gray-400">{formatTime(post.now)}</span>
      </div>

      {/* 图片 */}
      {hasImage && imageMode !== 'hidden' && (
        <div className="mt-2">
          {!showImg ? (
            <button
              onClick={() => setShowImg(true)}
              className="text-xs text-gray-500 dark:text-gray-400 underline"
            >
              点击显示图片
            </button>
          ) : (
            <div className="inline-block max-w-full">
              <img
                src={getImageUrl(post.img, post.ext, true)}
                alt=""
                loading="lazy"
                onClick={() => window.open(getImageUrl(post.img, post.ext), '_blank')}
                className={`max-w-[200px] max-h-[200px] object-contain cursor-pointer rounded hover:opacity-90 ${
                  imgLoaded ? 'opacity-100' : 'opacity-0'
                } transition-opacity`}
                onLoad={() => setImgLoaded(true)}
              />
            </div>
          )}
        </div>
      )}

      {/* 内容 */}
      <div
        className="mt-2 text-sm leading-relaxed break-all text-gray-700 dark:text-gray-300 [word-break:break-word]"
        style={{ fontSize: `${fontSize}px` }}
        onClick={handleContentClick}
        dangerouslySetInnerHTML={renderContent()}
      />

      {/* 操作 */}
      {showReply && !isTip && (
        <div className="mt-2 text-xs">
          <button
            onClick={() => onReply?.(post.id)}
            className="text-purple-500 hover:text-purple-600 dark:text-purple-400"
          >
            回复
          </button>
        </div>
      )}
    </div>
  )
}
