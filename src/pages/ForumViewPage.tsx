import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { useForumThreads, useForumList } from '../hooks/useApi'
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
  const [allThreads, setAllThreads] = useState<ForumThread[]>([])
  const { autoLoadNext } = useSettingsStore()
  const { addHistory } = useHistoryStore()

  const forumId = id || '4'
  let forumName = ''
  if (forumGroups) for (const g of forumGroups) { const f = g.forums.find(f2 => f2.id === forumId); if (f) { forumName = f.name; break } }

  const { data: threads, isLoading, error, refetch } = useForumThreads(forumId, page)

  useEffect(() => {
    if (threads && page === 1) setAllThreads(threads)
    else if (threads && page > 1) setAllThreads(p => [...p, ...threads])
  }, [threads, page])

  useEffect(() => { setPage(1); setAllThreads([]) }, [forumId])

  const loadMore = () => { if (!isLoading && threads?.length) setPage(p => p + 1) }

  useEffect(() => {
    if (!autoLoadNext) return
    const h = () => { if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 200) loadMore() }
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [autoLoadNext, isLoading, threads])

  if (error) return (
    <div className="page-enter flex flex-col items-center justify-center py-20">
      <AlertTriangle size={36} className="text-danger mb-3" />
      <p className="text-danger text-sm mb-4">加载失败</p>
      <button onClick={() => { setPage(1); setAllThreads([]); refetch() }}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-xl hover:bg-primary-600 transition-colors">
        <RefreshCw size={14} /> 重试
      </button>
    </div>
  )

  return (
    <div className="min-h-full page-enter">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-divider px-3 py-2.5">
        <h2 className="text-base font-semibold text-default-900">{forumName || `版块 ${forumId}`}</h2>
      </div>

      {isLoading && allThreads.length === 0 ? (
        <div className="py-2">{Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-3 py-2.5 border-b border-divider">
            <div className="flex gap-2.5">
              <div className="w-[68px] h-[68px] rounded-lg bg-default-200 shimmer shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/5 rounded bg-default-200 shimmer" />
                <div className="h-3 w-2/5 rounded bg-default-200 shimmer" />
                <div className="h-3 w-full rounded bg-default-200 shimmer" />
                <div className="h-3 w-4/5 rounded bg-default-200 shimmer" />
              </div>
            </div>
          </div>
        ))}</div>
      ) : (
        <div>
          {allThreads.map(thread => (
            <div key={thread.id} onClick={() => {
              addHistory({ id: thread.id, title: thread.title || '无标题', forumName, forumId, preview: truncateText(stripHtml(thread.content), 100), img: thread.img, ext: thread.ext, replyCount: Number(thread.ReplyCount || 0), visitedAt: Date.now() })
              navigate(`/t/${thread.id}`)
            }}>
              <ThreadCard thread={thread} forumName={forumName} />
            </div>
          ))}
          <div className="p-4 text-center">
            {isLoading && page > 1 ? <span className="text-sm text-default-400">加载中…</span>
              : threads && threads.length === 0 && allThreads.length > 0 ? <span className="text-sm text-default-400">— 没有更多了 —</span>
              : !autoLoadNext && threads?.length ? <button onClick={loadMore} className="text-sm text-primary hover:text-primary-600 transition-colors">加载更多</button> : null}
          </div>
        </div>
      )}
    </div>
  )
}
