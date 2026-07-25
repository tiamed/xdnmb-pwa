import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Reply, Loader2 } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useInfiniteThread, useReplyThread } from '../hooks/useApi'
import { useQueryClient } from '@tanstack/react-query'
import { getThread } from '../api/client'
import PostItem from '../components/PostItem'
import ReferencePopup from '../components/ReferencePopup'
import { ListSkeleton } from '../components/Skeleton'
import { useThreadViewStore } from '../store/threadView'
import { useFavoritesStore } from '../store/favorites'
import { useHistoryStore } from '../store/history'
import { stripHtml, truncateText } from '../hooks/useUtils'
import type { Post, Thread } from '../types/api'

const PAGE_SIZE = 19
const ITEM_HEIGHT = 85

function getScrollEl() {
  return document.getElementById('main-scroll-container')
}

export default function ThreadViewPage() {
  const { id: rawId } = useParams<{ id: string }>()
  const [sp] = useSearchParams()
  const tid = rawId || ''
  const poOnly = sp.get('po') === '1'
  const replyOpen = useThreadViewStore(s => s.replyOpen)
  const setReplyOpen = useThreadViewStore(s => s.setReplyOpen)
  const replyTo = useThreadViewStore(s => s.replyTo)
  const setReplyTo = useThreadViewStore(s => s.setReplyTo)
  const [replyContent, setReplyContent] = useState('')
  const [toast, setToast] = useState('')
  const { updateReplyCount } = useFavoritesStore()
  const { setCurrentPage, setTotalPages, setJumpToPage, setThreadTitle } = useThreadViewStore()
  const { addHistory } = useHistoryStore()
  const replyMutation = useReplyThread()
  const queryClient = useQueryClient()
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const bottomSentinelRef = useRef<HTMLDivElement>(null)
  const prependAnchorRef = useRef<{ scrollHeight: number; scrollTop: number; addedEstimate: number } | null>(null)

  const {
    data,
    isLoading,
    isFetchingNextPage,
    isFetchingPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    error,
    refetch,
  } = useInfiniteThread(tid)

  const pageParams = (data?.pageParams ?? []) as number[]
  const firstPageParam = pageParams[0] ?? 1
  const showMainPost = firstPageParam === 1

  const thread = data?.pages[0]
  const total = Number(thread?.ReplyCount || 0)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const poHash = thread?.user_hash

  const pageSlices = useMemo(() => {
    if (!data) return [] as { page: number; replies: Post[] }[]
    const params = data.pageParams as number[]
    return data.pages.map((p, i) => {
      const replies = (p.Replies || []).filter(r => !poOnly || r.user_hash === poHash)
      return { page: params[i] ?? i + 1, replies }
    })
  }, [data, poOnly, poHash])

  const displayed = useMemo(
    () => pageSlices.flatMap(s => s.replies),
    [pageSlices],
  )

  const indexToPage = useMemo(() => {
    const map: number[] = []
    for (const slice of pageSlices) {
      for (let i = 0; i < slice.replies.length; i++) map.push(slice.page)
    }
    return map
  }, [pageSlices])
  const indexToPageRef = useRef(indexToPage)
  indexToPageRef.current = indexToPage

  const virtualizer = useVirtualizer({
    count: displayed.length,
    getScrollElement: getScrollEl,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 8,
    onChange: instance => {
      const items = instance.getVirtualItems()
      if (!items.length) return
      const page = indexToPageRef.current[items[0].index]
      if (page != null) setCurrentPage(page)
    },
  })

  useEffect(() => {
    if (data) setTotalPages(totalPages)
  }, [data, totalPages, setTotalPages])

  const hasPrevRef = useRef(hasPreviousPage)
  hasPrevRef.current = hasPreviousPage
  const hasNextRef = useRef(hasNextPage)
  hasNextRef.current = hasNextPage
  const fetchingPrevRef = useRef(isFetchingPreviousPage)
  fetchingPrevRef.current = isFetchingPreviousPage
  const fetchingNextRef = useRef(isFetchingNextPage)
  fetchingNextRef.current = isFetchingNextPage
  const fetchPrevRef = useRef(fetchPreviousPage)
  fetchPrevRef.current = fetchPreviousPage
  const fetchNextRef = useRef(fetchNextPage)
  fetchNextRef.current = fetchNextPage

  const loadPrevious = () => {
    if (!hasPrevRef.current || fetchingPrevRef.current) return false
    const el = getScrollEl()
    if (!el) return false
    prependAnchorRef.current = {
      scrollHeight: el.scrollHeight,
      scrollTop: el.scrollTop,
      addedEstimate: PAGE_SIZE * ITEM_HEIGHT,
    }
    void fetchPrevRef.current()
    return true
  }

  // Preserve scroll when previous pages are prepended (incl. main post appearing)
  const prevFirstPageRef = useRef(firstPageParam)
  useLayoutEffect(() => {
    const anchor = prependAnchorRef.current
    const prepended = firstPageParam < prevFirstPageRef.current
    prevFirstPageRef.current = firstPageParam
    if (!anchor || !prepended) {
      prependAnchorRef.current = null
      return
    }
    const el = getScrollEl()
    if (!el) {
      prependAnchorRef.current = null
      return
    }
    // Prefer measured scrollHeight delta; fall back to estimated prepend height
    let delta = el.scrollHeight - anchor.scrollHeight
    if (delta <= 0 && anchor.addedEstimate > 0) delta = anchor.addedEstimate
    if (delta !== 0) el.scrollTop = anchor.scrollTop + delta
    prependAnchorRef.current = null

    // Page still shorter than viewport → stay at top and keep pulling previous
    if (el.scrollTop <= 48 && hasPrevRef.current && !fetchingPrevRef.current) {
      queueMicrotask(() => { loadPrevious() })
    }
  }, [displayed.length, firstPageParam, showMainPost])

  const jumpTarget = useThreadViewStore(s => s.jumpToPage)
  useEffect(() => {
    if (jumpTarget <= 0) return
    setCurrentPage(jumpTarget)
    setJumpToPage(0)
    prevFirstPageRef.current = jumpTarget
    prependAnchorRef.current = null
    ;(async () => {
      const pageData = await getThread(tid, jumpTarget)
      queryClient.setQueryData(['thread', tid], {
        pages: [pageData],
        pageParams: [jumpTarget],
      })
    })()
    getScrollEl()?.scrollTo({ top: 0 })
  }, [jumpTarget, tid, queryClient, setCurrentPage, setJumpToPage])

  // Bi-directional load. Re-bind when thread data first appears (sentinels exist).
  // Do not depend on firstPageParam — re-observe would auto-cascade on every prepend.
  useEffect(() => {
    if (!thread) return
    const el = getScrollEl()
    const topEl = topSentinelRef.current
    const bottomEl = bottomSentinelRef.current
    if (!el || !topEl || !bottomEl) return

    const onScroll = () => {
      if (el.scrollTop <= 48) loadPrevious()
      if (el.scrollHeight - el.scrollTop - el.clientHeight <= 400) {
        if (hasNextRef.current && !fetchingNextRef.current) void fetchNextRef.current()
      }
    }

    const prevObserver = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadPrevious() },
      { root: el, rootMargin: '120px 0px 0px 0px' },
    )
    prevObserver.observe(topEl)

    const nextObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextRef.current && !fetchingNextRef.current) {
          void fetchNextRef.current()
        }
      },
      { root: el, rootMargin: '0px 0px 400px 0px' },
    )
    nextObserver.observe(bottomEl)

    el.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      prevObserver.disconnect()
      nextObserver.disconnect()
      el.removeEventListener('scroll', onScroll)
    }
  }, [!!thread, tid])

  useEffect(() => {
    if (thread) {
      addHistory({
        id: thread.id,
        title: thread.title || '无标题',
        forumName: '',
        forumId: thread.fid || '',
        preview: truncateText(stripHtml(thread.content), 100),
        img: thread.img,
        ext: thread.ext,
        replyCount: total,
        visitedAt: Date.now(),
      })
      updateReplyCount(thread.id, total)
      setThreadTitle(thread.title || '无标题')
    }
  }, [!!thread])

  const handleQuote = (pid: string) => {
    const setReferencePostId = useThreadViewStore.getState().setReferencePostId
    const el = document.querySelector(`[data-pid="${pid}"]`) as HTMLElement
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('bg-accent-50/30')
      setTimeout(() => el.classList.remove('bg-accent-50/30'), 1500)
    } else {
      setReferencePostId(pid)
    }
  }

  const submitReply = async () => {
    if (!replyContent.trim()) return
    try {
      await replyMutation.mutateAsync({ resto: tid, content: replyContent })
      setReplyContent('')
      setReplyOpen(false)
      setReplyTo(null)
      refetch()
      setToast('回复成功')
      setTimeout(() => setToast(''), 2000)
    } catch {
      setToast('回复失败')
      setTimeout(() => setToast(''), 2000)
    }
  }

  if (isLoading && !thread) return <div className="page-enter"><ListSkeleton count={6} /></div>
  if (error && !thread) return (
    <div className="page-enter flex flex-col items-center justify-center py-20">
      <p className="text-danger text-sm mb-4">加载失败</p>
      <button onClick={() => refetch()} className="px-4 py-2 text-sm bg-accent text-accent-foreground rounded-xl">重试</button>
    </div>
  )
  if (!thread) return null

  const loadingNext = isFetchingNextPage
  const virtualItems = virtualizer.getVirtualItems()
  const mainPost = thread as Thread & Post

  return (
    <div className="min-h-full page-enter pb-4">
      <div ref={topSentinelRef} className="h-px" />

      {hasPreviousPage && (
        <div className="py-3 text-center text-xs text-muted">
          {isFetchingPreviousPage ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />加载上一页…
            </span>
          ) : (
            <button
              type="button"
              className="text-muted hover:text-foreground transition-colors"
              onClick={() => loadPrevious()}
            >
              上拉加载上一页
            </button>
          )}
        </div>
      )}

      {showMainPost && (
        <div data-pid={mainPost.id}>
          <PostItem
            post={mainPost}
            isPo
            onQuoteClick={handleQuote}
            onReply={id => {
              setReplyTo(id)
              setReplyContent(`>>No.${id}\n`)
              setReplyOpen(true)
            }}
          />
        </div>
      )}

      <div className={showMainPost ? 'border-t-2 border-default-200 dark:border-default-700' : undefined}>
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualItems.map(virtualItem => {
            const reply = displayed[virtualItem.index]
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                data-pid={reply.id}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <PostItem
                  post={reply}
                  poHash={poHash}
                  onQuoteClick={handleQuote}
                  onReply={id => {
                    setReplyTo(id)
                    setReplyContent(`>>No.${id}\n`)
                    setReplyOpen(true)
                  }}
                />
              </div>
            )
          })}
        </div>
        <div className="p-4 text-center text-sm text-muted">
          {loadingNext ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 size={14} className="animate-spin" />加载中…
            </span>
          ) : total > 0 ? (
            `— 共 ${total} 条回复 —`
          ) : null}
        </div>
        <div ref={bottomSentinelRef} />
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-xl text-sm font-medium bg-foreground/95 text-background shadow-lg animate-[fadeSlideIn_.2s_ease-out] pointer-events-none">
          {toast}
        </div>
      )}

      {replyOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" onClick={() => setReplyOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative mt-auto bg-background rounded-t-2xl p-4 animate-[slideUp_0.25s_ease-out] max-h-[70vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">
                {replyTo ? `回复 No.${replyTo}` : '回复此串'}
              </span>
              <button
                onClick={() => { setReplyOpen(false); setReplyContent(''); setReplyTo(null) }}
                className="text-muted hover:text-foreground text-xl leading-none"
              >
                &times;
              </button>
            </div>
            {replyTo && (
              <div className="mb-2 text-xs text-muted">
                引用 No.{replyTo}
                <button
                  onClick={() => { setReplyTo(null); setReplyContent('') }}
                  className="ml-2 text-accent hover:underline"
                >
                  取消引用
                </button>
              </div>
            )}
            <textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="输入回复…"
              rows={4}
              autoFocus
              className="w-full px-3 py-2.5 text-sm rounded-xl bg-default-100 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none border-none"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => { setReplyOpen(false); setReplyContent(''); setReplyTo(null) }}
                className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                取消
              </button>
              <button
                onClick={submitReply}
                disabled={replyMutation.isPending || !replyContent.trim()}
                className="px-5 py-2 text-sm bg-accent text-accent-foreground rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 active:scale-95"
              >
                {replyMutation.isPending ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />发送中</>
                ) : (
                  <><Reply size={15} />发送</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ReferencePopup currentTid={tid} />
    </div>
  )
}
