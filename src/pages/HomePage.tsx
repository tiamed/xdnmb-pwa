import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInfiniteTimelineThreads, useTimelineList } from '../hooks/useApi'
import ThreadCard from '../components/ThreadCard'
import { ListSkeleton } from '../components/Skeleton'
import PullRefreshIndicator from '../components/PullRefreshIndicator'
import { useSettingsStore } from '../store/settings'
import { useListScrollRestore } from '../hooks/useListScrollRestore'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { rememberListItem, useListScrollStore } from '../store/listScroll'
import { updateUrls } from '../api/client'

export default function HomePage() {
  const nav = useNavigate()
  const ptrRef = useRef<HTMLDivElement>(null)
  const { data: timelines } = useTimelineList()
  const homeTimelineId = useSettingsStore(s => s.homeTimelineId)
  const setHomeTimelineId = useSettingsStore(s => s.setHomeTimelineId)
  const { autoLoadNext } = useSettingsStore()

  useEffect(() => { updateUrls().catch(() => {}) }, [])
  useEffect(() => {
    useSettingsStore.getState().applyTheme()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const h = () => {
      if (useSettingsStore.getState().theme === 'system') useSettingsStore.getState().applyTheme()
    }
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  const tlId = useMemo(() => {
    if (!timelines?.length) return homeTimelineId || ''
    if (homeTimelineId && timelines.some(t => String(t.id) === homeTimelineId)) return homeTimelineId
    return String(timelines[0].id)
  }, [timelines, homeTimelineId])

  useEffect(() => {
    if (tlId && tlId !== homeTimelineId) setHomeTimelineId(tlId)
  }, [tlId, homeTimelineId, setHomeTimelineId])

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

  usePullToRefresh({
    enabled: !!tlId && !isLoading,
    indicatorRef: ptrRef,
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
    const h = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) fetchNextPage()
    }
    el.addEventListener('scroll', h, { passive: true })
    return () => el.removeEventListener('scroll', h)
  }, [autoLoadNext, hasNextPage, isFetchingNextPage, fetchNextPage])

  const openThread = (id: string) => {
    rememberListItem(scrollKey, id)
    nav(`/t/${id}`)
  }

  if (error) return <div className="py-20 text-center text-danger text-sm">加载失败</div>
  if (!tlId && timelines && timelines.length === 0) {
    return <div className="py-20 text-center text-muted text-sm">暂无时间线</div>
  }

  return (
    <div className="min-h-full page-enter select-none">
      <PullRefreshIndicator ref={ptrRef} />
      {isLoading || !tlId ? (
        <ListSkeleton count={6} />
      ) : (
        <div>
          {threads.map(thread => (
            <ThreadCard key={thread.id} thread={thread} showStar={false} onOpen={() => openThread(thread.id)} />
          ))}
          <div className="p-4 text-center text-sm text-muted">
            {isFetchingNextPage ? '加载中…' : !hasNextPage && threads.length > 0 ? '— 没有更多了 —' : !autoLoadNext && hasNextPage ? (
              <button
                onClick={() => fetchNextPage()}
                className="px-4 py-2 text-sm bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-all active:scale-95"
              >
                加载更多
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
