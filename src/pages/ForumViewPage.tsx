import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { Button } from '@heroui/react'
import { useInfiniteForumThreads, useForumList } from '../hooks/useApi'
import ThreadCard from '../components/ThreadCard'
import { ListSkeleton } from '../components/Skeleton'
import { useSettingsStore } from '../store/settings'
import { useHistoryStore } from '../store/history'
import { stripHtml, truncateText } from '../hooks/useUtils'

export default function ForumViewPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: forumGroups } = useForumList()
  const { autoLoadNext } = useSettingsStore()
  const { addHistory } = useHistoryStore()

  const forumId = id || '4'
  let forumName = ''
  if (forumGroups) for (const g of forumGroups) { const f = g.forums.find(f2 => f2.id === forumId); if (f) { forumName = f.name; break } }

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, error, refetch } = useInfiniteForumThreads(forumId)
  const threads = data?.pages.flat() ?? []

  // infinite scroll
  useEffect(() => {
    if (!autoLoadNext || !hasNextPage || isFetchingNextPage) return
    const h = () => { if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 200) fetchNextPage() }
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [autoLoadNext, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (error) return (
    <div className="page-enter flex flex-col items-center justify-center py-20">
      <AlertTriangle size={36} className="text-danger mb-3" />
      <p className="text-danger text-sm mb-4">加载失败</p>
      <Button variant="secondary" onPress={() => refetch()}><RefreshCw size={14} /> 重试</Button>
    </div>
  )

  return (
    <div className="min-h-full page-enter">
      {isLoading ? <ListSkeleton count={8} /> : (
        <div>
          {threads.map(thread => (
            <div key={thread.id} onClick={() => {
              addHistory({ id: thread.id, title: thread.title || '无标题', forumName, forumId, preview: truncateText(stripHtml(thread.content), 100), img: thread.img, ext: thread.ext, replyCount: Number(thread.ReplyCount || 0), visitedAt: Date.now() })
              nav(`/t/${thread.id}`)
            }}>
              <ThreadCard thread={thread} forumName={forumName} />
            </div>
          ))}
          <div className="p-4 text-center text-sm text-muted">
            {isFetchingNextPage ? '加载中…' : !hasNextPage && threads.length > 0 ? '— 没有更多了 —' : !autoLoadNext && hasNextPage ? (
              <button onClick={() => fetchNextPage()} className="px-4 py-2 text-sm bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-all active:scale-95">加载更多</button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
