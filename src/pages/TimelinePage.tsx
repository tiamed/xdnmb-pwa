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
    const h = () => { if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 200) fetchNextPage() }
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [autoLoadNext, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (error) return <div className="py-20 text-center text-danger text-sm">加载失败</div>

  return (
    <div className="min-h-full page-enter">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-divider px-3 py-2.5">
        <h2 className="text-base font-semibold text-foreground">时间线</h2>
      </div>
      {isLoading ? <ListSkeleton count={6} /> : (
        <div>
          {threads.map(thread => <div key={thread.id} onClick={() => nav(`/t/${thread.id}`)}><ThreadCard thread={thread} /></div>)}
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
