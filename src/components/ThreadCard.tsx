import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { getImageUrl } from '../api/client'
import type { ForumThread } from '../types/api'
import { stripHtml, truncateText, formatTime } from '../hooks/useUtils'
import { useSettingsStore } from '../store/settings'
import { useFavoritesStore } from '../store/favorites'

interface ThreadCardProps {
  thread: ForumThread
  forumName?: string
}

export default function ThreadCard({ thread, forumName }: ThreadCardProps) {
  const navigate = useNavigate()
  const { imageMode } = useSettingsStore()
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore()
  const [imgLoaded, setImgLoaded] = useState(false)
  const fav = isFavorite(thread.id)

  const preview = stripHtml(thread.content)
  const hasImage = thread.img && thread.ext

  const handleClick = () => {
    navigate(`/t/${thread.id}`)
  }

  const handleFavClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (fav) {
      removeFavorite(thread.id)
    } else {
      addFavorite({
        id: thread.id,
        title: thread.title || '无标题',
        forumName: forumName || '',
        forumId: thread.fid || '',
        preview: truncateText(preview, 100),
        img: thread.img,
        ext: thread.ext,
        replyCount: Number(thread.ReplyCount || 0),
      })
    }
  }

  return (
    <div
      onClick={handleClick}
      className="p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
    >
      <div className="flex gap-3">
        {/* 图片 */}
        {hasImage && imageMode !== 'hidden' && (
          <div className="flex-shrink-0 w-20 h-20 rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
            {imageMode === 'blur' ? (
              <div
                className="w-full h-full bg-gray-300 dark:bg-gray-700 blur-lg cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  // 点击显示图片
                  const target = e.currentTarget
                  target.style.display = 'none'
                  const img = target.nextElementSibling as HTMLImageElement
                  if (img) img.style.display = 'block'
                }}
              />
            ) : null}
            <img
              src={getImageUrl(thread.img, thread.ext, true)}
              alt=""
              loading="lazy"
              className={`w-full h-full object-cover ${imageMode === 'blur' ? 'hidden' : ''} ${imgLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity`}
              onLoad={() => setImgLoaded(true)}
            />
          </div>
        )}

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {thread.title && thread.title !== '无标题' && (
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                  {thread.title}
                </h3>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                No.{thread.id}
                {thread.user_hash && (
                  <span
                    className={`ml-2 ${thread.admin ? 'text-red-500 font-bold' : ''}`}
                  >
                    ID:{thread.user_hash}
                  </span>
                )}
                {forumName && (
                  <span className="ml-2 text-purple-500">[{forumName}]</span>
                )}
              </p>
            </div>
            <button
              onClick={handleFavClick}
              className={`flex-shrink-0 ${fav ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'}`}
              title={fav ? '取消收藏' : '收藏'}
              aria-label={fav ? '取消收藏' : '收藏'}
            >
              <Star size={18} fill={fav ? 'currentColor' : 'none'} />
            </button>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2 break-all">
            {truncateText(preview, 120)}
          </p>

          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>{formatTime(thread.now)}</span>
            <span>{thread.ReplyCount} 回复</span>
          </div>

          {/* 最新回复预览 */}
          {thread.Replies && thread.Replies.length > 0 && (
            <div className="mt-2 space-y-1">
              {thread.Replies.slice(0, 3).map((reply) => (
                <div
                  key={reply.id}
                  className="text-xs text-gray-500 dark:text-gray-500 pl-2 border-l-2 border-gray-200 dark:border-gray-700"
                >
                  <span className="text-purple-400">No.{reply.id}</span>
                  <span className="mx-1">:</span>
                  <span className="break-all">
                    {truncateText(stripHtml(reply.content), 60)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
