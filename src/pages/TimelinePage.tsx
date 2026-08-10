import { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useInfiniteTimelineThreads } from '../hooks/useApi'
import ThreadCard from '../components/ThreadCard'
import { ListSkeleton } from '../components/Skeleton'
import PullRefreshIndicator from '../components/PullRefreshIndicator'
import { useSettingsStore } from '../store/settings'
import { useListScrollRestore } from '../hooks/useListScrollRestore'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { rememberListItem, useListScrollStore } from '../store/listScroll'

export default function TimelinePage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const tlId = id || ''
  const { autoLoadNext } = useSettingsStore()

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, error, refetch } =
    useInfiniteTimelineThreads(tlId)
  const threads = data?.pages.flat() ?? []
  const itemIds = useMemo(() => threads.map(t => t.id), [threads])
  const scrollKey = `timeline:${tlId}`

  useListScrollRestore(scrollKey, !isLoading && !!tlId && threads.length > 0, {
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    contentKey: threads.length,
    itemIds,
  })

  const { pull, refreshing, threshold } = usePullToRefresh({
    enabled: !!tlId && !isLoading,
    onRefresh: async () => {
      useListScrollStore.getState().clear(scrollKey)
      document.getElementById('main-scroll-container')?.scrollTo({ top: 0 })
      await refetch()
    },
  })

  useEffect(() => {
    if (!autoLoadNext || !hasNextPage || isFetchingNextPage) return
    const el = document.getElementById('main-scroll-container')
    if (!el) return
    const h = () => { if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) fetchNextPage() }
    el.addEventListener('scroll', h, { passive: true })
    return () => el.removeEventListener('scroll', h)
  }, [autoLoadNext, hasNextPage, isFetchingNextPage, fetchNextPage])

  const openThread = (tid: string) => {
    rememberListItem(scrollKey, tid)
    nav(`/t/${tid}`)
  }

  if (error) return <div className="py-20 text-center text-danger text-sm">加载失败</div>

  return (
    <div className="min-h-full page-enter">
      <PullRefreshIndicator pull={pull} refreshing={refreshing} threshold={threshold} />
      {isLoading ? <ListSkeleton count={6} /> : (
        <div>
          {threads.map(thread => (
            <ThreadCard key={thread.id} thread={thread} showStar={false} onOpen={() => openThread(thread.id)} />
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
