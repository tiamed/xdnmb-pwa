import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInfiniteTimelineThreads } from '../hooks/useApi'
import ThreadCard from '../components/ThreadCard'
import { ListSkeleton } from '../components/Skeleton'
import { useSettingsStore } from '../store/settings'

export default function TimelinePage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const tlId = id || ''
  const { autoLoadNext } = useSettingsStore()

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, error } = useInfiniteTimelineThreads(tlId)
  const threads = data?.pages.flat() ?? []

  useEffect(() => {
    if (!autoLoadNext || !hasNextPage || isFetchingNextPage) return
    const el = document.getElementById('main-scroll-container')
    if (!el) return
    const h = () => { if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) fetchNextPage() }
    el.addEventListener('scroll', h, { passive: true })
    return () => el.removeEventListener('scroll', h)
  }, [autoLoadNext, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (error) return <div className="py-20 text-center text-danger text-sm">加载失败</div>

  return (
    <div className="min-h-full page-enter">
      {isLoading ? <ListSkeleton count={6} /> : (
        <div>
          {threads.map(thread => <ThreadCard key={thread.id} thread={thread} onOpen={() => nav(`/t/${thread.id}`)} />)}
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
