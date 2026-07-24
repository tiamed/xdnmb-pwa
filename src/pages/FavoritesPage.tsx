import { useNavigate } from 'react-router-dom'
import { Star, Trash2 } from 'lucide-react'
import { useFavoritesStore } from '../store/favorites'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import ThreadCard from '../components/ThreadCard'
import type { ForumThread } from '../types/api'

export default function FavoritesPage() {
  const navigate = useNavigate()
  const { items, clearFavorites } = useFavoritesStore()

  const handleClick = (id: string) => {
    navigate(`/t/${id}`)
  }

  // 转换为 ForumThread 格式用于 ThreadCard
  const threads: ForumThread[] = items.map((item) => ({
    id: item.id,
    fid: item.forumId,
    ReplyCount: String(item.replyCount),
    img: item.img,
    ext: item.ext,
    now: new Date(item.addedAt).toLocaleString(),
    user_hash: '',
    name: '',
    title: item.title,
    content: item.preview,
    sage: 0,
    admin: 0,
    Hide: 0,
    Replies: [],
  }))

  return (
    <div className="min-h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          收藏 ({items.length})
        </h2>
        {items.length > 0 && (
          <button
            onClick={() => {
              if (confirm('确定清空所有收藏？')) {
                clearFavorites()
              }
            }}
            className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            <Trash2 size={14} />
            清空
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-12 text-center text-gray-400">
          <Star size={48} className="mx-auto mb-3 opacity-50" />
          <p>还没有收藏的串</p>
          <p className="text-sm mt-1">点击串卡片上的星号添加收藏</p>
        </div>
      ) : (
        <div>
          {threads.map((thread) => (
            <div key={thread.id} onClick={() => handleClick(thread.id)}>
              <ThreadCard
                thread={thread}
                forumName={items.find((i) => i.id === thread.id)?.forumName}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
