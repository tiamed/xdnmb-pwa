import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTimelineThreads } from '../hooks/useApi'
import { useTimelineList } from '../hooks/useApi'
import ThreadCard from '../components/ThreadCard'
import { useSettingsStore } from '../store/settings'
import { useHistoryStore } from '../store/history'
import { stripHtml, truncateText } from '../hooks/useUtils'
import type { ForumThread } from '../types/api'

export default function TimelinePage() {
  const { id } = useParams<{ id: string }>()
  const timelineId = id || ''
  const [page, setPage] = useState(1)
  const [allThreads, setAllThreads] = useState<ForumThread[]>([])
  const { autoLoadNext } = useSettingsStore()
  const { addHistory } = useHistoryStore()

  const { data: timelines } = useTimelineList()
  const timelineName =
    timelines?.find((t) => t.id === timelineId)?.name ||
    timelines?.find((t) => t.id === timelineId)?.displayName ||
    `时间线 ${timelineId}`

  const {
    data: threads,
    isLoading,
    error,
    refetch,
  } = useTimelineThreads(timelineId, page)

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
  }, [timelineId])

  const loadMore = () => {
    if (!isLoading && threads && threads.length > 0) {
      setPage((p) => p + 1)
    }
  }

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

  return (
    <div className="min-h-full">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 sticky top-14 z-30">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {timelineName}
        </h2>
      </div>

      {isLoading && allThreads.length === 0 ? (
        <div className="p-8 text-center text-gray-500">加载中...</div>
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-red-500 mb-4">加载失败: {error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-sm bg-purple-500 text-white rounded"
          >
            重试
          </button>
        </div>
      ) : (
        <div>
          {allThreads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => {
                addHistory({
                  id: thread.id,
                  title: thread.title || '无标题',
                  forumName: timelineName,
                  forumId: thread.fid || '',
                  preview: truncateText(stripHtml(thread.content), 100),
                  img: thread.img,
                  ext: thread.ext,
                  replyCount: Number(thread.ReplyCount || 0),
                  visitedAt: Date.now(),
                })
              }}
            >
              <ThreadCard thread={thread} forumName={timelineName} />
            </div>
          ))}

          <div className="p-4 text-center">
            {isLoading && page > 1 && (
              <span className="text-sm text-gray-400">加载中...</span>
            )}
            {!autoLoadNext && threads && threads.length > 0 && (
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-purple-500 hover:text-purple-600 disabled:opacity-50"
              >
                加载更多
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
