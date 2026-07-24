import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForumThreads } from '../hooks/useApi'
import { useForumList } from '../hooks/useApi'
import ThreadCard from '../components/ThreadCard'
import { useSettingsStore } from '../store/settings'
import { useHistoryStore } from '../store/history'
import { stripHtml, truncateText } from '../hooks/useUtils'
import type { ForumThread } from '../types/api'

export default function ForumViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: forumGroups } = useForumList()
  const [page, setPage] = useState(1)
  const { autoLoadNext } = useSettingsStore()
  const { addHistory } = useHistoryStore()

  const forumId = id || '4'

  // 查找版块名称
  let forumName = ''
  if (forumGroups) {
    for (const group of forumGroups) {
      const found = group.forums.find((f) => f.id === forumId)
      if (found) {
        forumName = found.name
        break
      }
    }
  }

  const {
    data: threads,
    isLoading,
    error,
    refetch,
  } = useForumThreads(forumId, page)

  // 简单的分页：把所有页的串合并
  const [allThreads, setAllThreads] = useState<ForumThread[]>([])

  useEffect(() => {
    if (threads && page === 1) {
      setAllThreads(threads)
    } else if (threads && page > 1) {
      setAllThreads((prev) => [...prev, ...threads])
    }
  }, [threads, page])

  useEffect(() => {
    setPage(1)
    setAllThreads([])
  }, [forumId])

  const loadMore = () => {
    if (!isLoading && threads && threads.length > 0) {
      setPage((p) => p + 1)
    }
  }

  // 滚动到底部加载更多
  useEffect(() => {
    if (!autoLoadNext) return

    const handleScroll = () => {
      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      const docHeight = document.documentElement.scrollHeight

      if (scrollTop + windowHeight >= docHeight - 200) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [autoLoadNext, isLoading, threads])

  const handleThreadClick = (thread: ForumThread) => {
    addHistory({
      id: thread.id,
      title: thread.title || '无标题',
      forumName,
      forumId,
      preview: truncateText(stripHtml(thread.content), 100),
      img: thread.img,
      ext: thread.ext,
      replyCount: Number(thread.ReplyCount || 0),
      visitedAt: Date.now(),
    })
    navigate(`/t/${thread.id}`)
  }

  return (
    <div className="min-h-full">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 sticky top-14 z-30">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {forumName || `版块 ${forumId}`}
        </h2>
      </div>

      {isLoading && allThreads.length === 0 ? (
        <div className="p-8 text-center text-gray-500">加载中...</div>
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-red-500 mb-4">加载失败: {error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            重试
          </button>
        </div>
      ) : (
        <div>
          {allThreads.map((thread) => (
            <div key={thread.id} onClick={() => handleThreadClick(thread)}>
              <ThreadCard thread={thread} forumName={forumName} />
            </div>
          ))}

          <div className="p-4 text-center">
            {isLoading && page > 1 ? (
              <span className="text-sm text-gray-400">加载中...</span>
            ) : threads && threads.length === 0 ? (
              <span className="text-sm text-gray-400">没有更多了</span>
            ) : !autoLoadNext ? (
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-purple-500 hover:text-purple-600 disabled:opacity-50"
              >
                加载更多 (第{page}页)
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
