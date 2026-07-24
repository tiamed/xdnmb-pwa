import { useNavigate } from 'react-router-dom'
import { useHistoryStore } from '../store/history'
import ThreadCard from '../components/ThreadCard'
import type { ForumThread } from '../types/api'

export default function HistoryPage() {
  const navigate = useNavigate()
  const { items, clearHistory } = useHistoryStore()

  const handleClick = (id: string) => {
    navigate(`/t/${id}`)
  }

  const threads: ForumThread[] = items.map((item) => ({
    id: item.id,
    fid: item.forumId,
    ReplyCount: String(item.replyCount),
    img: item.img,
    ext: item.ext,
    now: new Date(item.visitedAt).toLocaleString(),
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
          浏览历史 ({items.length})
        </h2>
        {items.length > 0 && (
          <button
            onClick={() => {
              if (confirm('确定清空所有历史？')) {
                clearHistory()
              }
            }}
            className="text-sm text-red-500 hover:text-red-600"
          >
            清空
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="p-12 text-center text-gray-400">
          <p className="text-4xl mb-2">📜</p>
          <p>还没有浏览记录</p>
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
