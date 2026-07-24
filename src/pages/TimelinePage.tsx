import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTimelineThreads } from '../hooks/useApi'
import ThreadCard from '../components/ThreadCard'
import { useSettingsStore } from '../store/settings'
import type { ForumThread } from '../types/api'

export default function TimelinePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const timelineId = id || ''
  const [page, setPage] = useState(1)
  const [all, setAll] = useState<ForumThread[]>([])
  const { autoLoadNext } = useSettingsStore()
  const { data: threads, isLoading, error } = useTimelineThreads(timelineId, page)

  useEffect(() => {
    if (threads && page === 1) setAll(threads)
    else if (threads && page > 1) setAll(p => [...p, ...threads])
  }, [threads, page])
  useEffect(() => { setPage(1); setAll([]) }, [timelineId])

  const loadMore = () => { if (!isLoading && threads?.length) setPage(p => p + 1) }
  useEffect(() => {
    if (!autoLoadNext) return
    const h = () => { if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 200) loadMore() }
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [autoLoadNext, isLoading, threads])

  if (error) return <div className="py-20 text-center text-danger text-sm">加载失败</div>

  return (
    <div className="min-h-full page-enter">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-divider px-3 py-2.5">
        <h2 className="text-base font-semibold text-default-900">时间线</h2>
      </div>
      {isLoading && all.length === 0 ? <div className="py-8 text-center text-sm text-default-400">加载中...</div> : (
        <div>
          {all.map(thread => <div key={thread.id} onClick={() => navigate(`/t/${thread.id}`)}><ThreadCard thread={thread} /></div>)}
          <div className="p-4 text-center text-sm text-default-400">
            {isLoading && page > 1 ? '加载中…' : threads?.length === 0 && all.length > 0 ? '— 没有更多了 —' : null}
          </div>
        </div>
      )}
    </div>
  )
}
