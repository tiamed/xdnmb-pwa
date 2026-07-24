import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { Button } from '@heroui/react'
import { useForumThreads, useForumList } from '../hooks/useApi'
import ThreadCard from '../components/ThreadCard'
import { ListSkeleton } from '../components/Skeleton'
import { useSettingsStore } from '../store/settings'
import { useHistoryStore } from '../store/history'
import { stripHtml, truncateText } from '../hooks/useUtils'
import type { ForumThread } from '../types/api'

export default function ForumViewPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: forumGroups } = useForumList()
  const [page, setPage] = useState(1)
  const [all, setAll] = useState<ForumThread[]>([])
  const { autoLoadNext } = useSettingsStore()
  const { addHistory } = useHistoryStore()

  const forumId = id || '4'
  let forumName = ''
  if (forumGroups) for (const g of forumGroups) { const f = g.forums.find(f2 => f2.id === forumId); if (f) { forumName = f.name; break } }

  const { data: threads, isLoading, error, refetch } = useForumThreads(forumId, page)

  useEffect(() => {
    if (threads && page === 1) setAll(threads)
    else if (threads && page > 1) setAll(p => [...p, ...threads])
  }, [threads, page])

  useEffect(() => { setPage(1); setAll([]) }, [forumId])

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
      <Button variant="secondary" onPress={() => { setPage(1); setAll([]); refetch() }}><RefreshCw size={14} /> 重试</Button>
    </div>
  )

  return (
    <div className="min-h-full page-enter">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-divider px-3 py-2.5">
        <h2 className="text-base font-semibold text-foreground">{forumName || `版块 ${forumId}`}</h2>
      </div>

      {isLoading && all.length === 0 ? <ListSkeleton count={8} /> : (
        <div>
          {all.map(thread => (
            <div key={thread.id} onClick={() => {
              addHistory({ id: thread.id, title: thread.title || '无标题', forumName, forumId, preview: truncateText(stripHtml(thread.content), 100), img: thread.img, ext: thread.ext, replyCount: Number(thread.ReplyCount || 0), visitedAt: Date.now() })
              nav(`/t/${thread.id}`)
            }}>
              <ThreadCard thread={thread} forumName={forumName} />
            </div>
          ))}
          <div className="p-4 text-center text-sm text-muted">
            {isLoading && page > 1 ? '加载中…' : threads?.length === 0 && all.length > 0 ? '— 没有更多了 —' : null}
          </div>
        </div>
      )}
    </div>
  )
}
