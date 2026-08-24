import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Reply, Loader2 } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useInfiniteThread, useReplyThread, useForumList } from '../hooks/useApi'
import { useQueryClient } from '@tanstack/react-query'
import { getThread } from '../api/client'
import PostItem from '../components/PostItem'
import ReferencePopup from '../components/ReferencePopup'
import { ListSkeleton } from '../components/Skeleton'
import PullRefreshIndicator from '../components/PullRefreshIndicator'
import EmoticonPicker from '../components/EmoticonPicker'
import { useThreadViewStore } from '../store/threadView'
import { useThreadProgressStore } from '../store/threadProgress'
import { useHistoryStore } from '../store/history'
import { resolveForumName, stripHtml, truncateText } from '../hooks/useUtils'
import { insertAtCursor } from '../data/emoticons'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import type { Post, Thread } from '../types/api'

const PAGE_SIZE = 19
const ITEM_HEIGHT = 85
/** Unlock previous-page loading only after user scrolls this far from top */
const PREV_UNLOCK_SCROLL_TOP = 120

function getScrollEl() {
  return document.getElementById('main-scroll-container')
}

type ListRow =
  | { kind: 'op'; key: string; post: Post }
  | { kind: 'reply'; key: string; post: Post }

export default function ThreadViewPage() {
  const { id: rawId } = useParams<{ id: string }>()
  const [sp] = useSearchParams()
  const tid = rawId || ''
  const poOnly = sp.get('po') === '1'
  const replyOpen = useThreadViewStore(s => s.replyOpen)
  const setReplyOpen = useThreadViewStore(s => s.setReplyOpen)
  const replyTo = useThreadViewStore(s => s.replyTo)
  const setReplyTo = useThreadViewStore(s => s.setReplyTo)
  const setCurrentPage = useThreadViewStore(s => s.setCurrentPage)
  const setTotalPages = useThreadViewStore(s => s.setTotalPages)
  const setJumpToPage = useThreadViewStore(s => s.setJumpToPage)
  const setThreadTitle = useThreadViewStore(s => s.setThreadTitle)
  const setThreadPreview = useThreadViewStore(s => s.setThreadPreview)
  const jumpTarget = useThreadViewStore(s => s.jumpToPage)
  const focusPostId = useThreadViewStore(s => s.focusPostId)
  const setFocusPostId = useThreadViewStore(s => s.setFocusPostId)
  const [replyContent, setReplyContent] = useState('')
  const [toast, setToast] = useState('')
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null)
  const { addHistory } = useHistoryStore()
  const replyMutation = useReplyThread()
  const queryClient = useQueryClient()
  const { data: forumGroups } = useForumList()
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const bottomSentinelRef = useRef<HTMLDivElement>(null)
  // After loading a previous page, stay locked until user scrolls away from top
  const prevLoadLockedRef = useRef(false)
  // Anchor a reply by id + its offset within the scroll container
  const scrollAnchorRef = useRef<{ id: string; offset: number } | null>(null)
  // Reading progress restore (page + post anchor)
  const pendingRestoreRef = useRef<{ page: number; postId: string | null; offset: number } | null>(null)
  const restoreDoneRef = useRef(false)
  const restoreKickoffTidRef = useRef('')
  const ptrRef = useRef<HTMLDivElement>(null)

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

  // Pull-to-refresh only on the first page so it doesn't fight "load previous"
  usePullToRefresh({
    enabled: !!tid && !isLoading && !hasPreviousPage && !isFetchingPreviousPage,
    indicatorRef: ptrRef,
    onRefresh: () => refetch(),
  })

  const pageParams = (data?.pageParams ?? []) as number[]
  const firstPageParam = pageParams[0] ?? 1
  const showMainPost = firstPageParam === 1

  const thread = data?.pages[0]
  const total = Number(thread?.ReplyCount || 0)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const poHash = thread?.user_hash
  const forumName = resolveForumName(forumGroups, thread?.fid)

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

  // Only OP + replies in the virtual list (no stable "loader" row at index 0 —
  // that kept the scroll anchor at the top and caused infinite previous loads).
  const rows = useMemo<ListRow[]>(() => {
    const list: ListRow[] = []
    if (showMainPost && thread) {
      list.push({ kind: 'op', key: `op-${thread.id}`, post: thread as Post })
    }
    for (const reply of displayed) {
      list.push({ kind: 'reply', key: reply.id, post: reply })
    }
    return list
  }, [showMainPost, thread, displayed])

  const rowsRef = useRef(rows)
  rowsRef.current = rows

  const indexToPage = useMemo(() => {
    const map: number[] = []
    if (showMainPost) map.push(1)
    for (const slice of pageSlices) {
      for (let i = 0; i < slice.replies.length; i++) map.push(slice.page)
    }
    return map
  }, [pageSlices, showMainPost])
  const indexToPageRef = useRef(indexToPage)
  indexToPageRef.current = indexToPage

  const getItemKey = useCallback((index: number) => rowsRef.current[index]?.key ?? index, [])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: getScrollEl,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 8,
    getItemKey,
    // Keeps position stable when measured sizes above the viewport change
    anchorTo: 'end',
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
  const virtualizerRef = useRef(virtualizer)
  virtualizerRef.current = virtualizer

  const captureScrollAnchor = () => {
    const el = getScrollEl()
    if (!el) return
    const items = virtualizerRef.current.getVirtualItems()
    const item = items.find(v => rowsRef.current[v.index]?.kind === 'reply') ?? items[0]
    if (!item) return
    const row = rowsRef.current[item.index]
    if (!row) return
    const node = document.querySelector(`[data-pid="${row.post.id}"]`)
    if (!node) return
    scrollAnchorRef.current = {
      id: row.post.id,
      offset: node.getBoundingClientRect().top - el.getBoundingClientRect().top,
    }
  }

  const loadPrevious = () => {
    if (prevLoadLockedRef.current) return false
    if (!hasPrevRef.current || fetchingPrevRef.current) return false
    captureScrollAnchor()
    prevLoadLockedRef.current = true
    void fetchPrevRef.current()
    return true
  }

  // Keep the same reply under the viewport after previous pages prepend.
  const prevFirstPageRef = useRef(firstPageParam)
  useLayoutEffect(() => {
    const prepended = firstPageParam < prevFirstPageRef.current
    prevFirstPageRef.current = firstPageParam
    const anchor = scrollAnchorRef.current
    if (!prepended || !anchor) return
    scrollAnchorRef.current = null

    const el = getScrollEl()
    if (!el) return

    const idx = rowsRef.current.findIndex(r => r.post.id === anchor.id)
    if (idx < 0) return

    // Use virtualizer measurements (works even if the node isn't mounted yet)
    virtualizerRef.current.getTotalSize()
    const measurement = virtualizerRef.current.measurementsCache[idx]
    if (!measurement) return
    el.scrollTop = Math.max(0, measurement.start - anchor.offset)
  }, [displayed.length, firstPageParam, rows.length, showMainPost])

  useEffect(() => {
    if (jumpTarget <= 0) return
    setCurrentPage(jumpTarget)
    setJumpToPage(0)
    prevFirstPageRef.current = jumpTarget
    // Don't auto-pull previous just because jump lands at scrollTop 0
    prevLoadLockedRef.current = true
    scrollAnchorRef.current = null
    ;(async () => {
      const pageData = await getThread(tid, jumpTarget)
      queryClient.setQueryData(['thread', tid], {
        pages: [pageData],
        pageParams: [jumpTarget],
      })
    })()
    getScrollEl()?.scrollTo({ top: 0 })
  }, [jumpTarget, tid, queryClient, setCurrentPage, setJumpToPage])

  // Kick off restore of last read page when entering a thread
  useEffect(() => {
    if (!tid || restoreKickoffTidRef.current === tid) return
    restoreKickoffTidRef.current = tid
    restoreDoneRef.current = false

    const scrollTop = () => getScrollEl()?.scrollTo({ top: 0 })

    // Explicit focus (e.g. jump to OP from reference) wins over resume
    if (useThreadViewStore.getState().focusPostId) {
      pendingRestoreRef.current = null
      restoreDoneRef.current = true
      scrollTop()
      return
    }

    const saved = useThreadProgressStore.getState().get(tid)
    if (!saved) {
      pendingRestoreRef.current = null
      restoreDoneRef.current = true
      scrollTop()
      return
    }

    const page = Math.max(1, saved.page || 1)
    if (page <= 1 && !saved.postId && !(saved.offset > 0)) {
      pendingRestoreRef.current = null
      restoreDoneRef.current = true
      scrollTop()
      return
    }

    pendingRestoreRef.current = {
      page,
      postId: saved.postId,
      offset: saved.offset || 0,
    }

    if (page > 1) setJumpToPage(page)
  }, [tid, setJumpToPage])

  // Apply saved scroll anchor once the target page is in the list
  useLayoutEffect(() => {
    if (restoreDoneRef.current) return
    const pending = pendingRestoreRef.current
    if (!pending || !thread) return
    if (focusPostId) {
      pendingRestoreRef.current = null
      restoreDoneRef.current = true
      return
    }

    const params = (data?.pageParams ?? []) as number[]
    if (pending.page > 1 && !params.includes(pending.page)) return

    const el = getScrollEl()
    if (!el) return

    prevLoadLockedRef.current = true

    if (pending.postId) {
      const idx = rowsRef.current.findIndex(r => r.post.id === pending.postId)
      if (idx < 0) {
        el.scrollTop = 0
        pendingRestoreRef.current = null
        restoreDoneRef.current = true
        return
      }

      virtualizerRef.current.scrollToIndex(idx, { align: 'start' })
      virtualizerRef.current.getTotalSize()
      const measurement = virtualizerRef.current.measurementsCache[idx]
      if (measurement) {
        el.scrollTop = Math.max(0, measurement.start - pending.offset)
      } else {
        // Estimates only — nudge by offset from align:start
        el.scrollTop = Math.max(0, el.scrollTop - pending.offset)
      }
    } else if (pending.offset > 0) {
      el.scrollTop = pending.offset
    }

    pendingRestoreRef.current = null
    restoreDoneRef.current = true
  }, [thread, data?.pageParams, rows.length, focusPostId, displayed.length])

  // Persist reading page + position while scrolling / on leave
  useEffect(() => {
    if (!tid) return
    const el = getScrollEl()
    if (!el) return

    const saveProgress = () => {
      if (!restoreDoneRef.current && pendingRestoreRef.current) return
      const items = virtualizerRef.current.getVirtualItems()
      if (!items.length) return
      const item = items[0]
      const row = rowsRef.current[item.index]
      if (!row) return
      const page = indexToPageRef.current[item.index] ?? useThreadViewStore.getState().currentPage
      const node = document.querySelector(`[data-pid="${row.post.id}"]`)
      const offset = node
        ? node.getBoundingClientRect().top - el.getBoundingClientRect().top
        : 0
      useThreadProgressStore.getState().save(tid, {
        page,
        postId: row.post.id,
        offset,
      })
    }

    let timer = 0
    const onScroll = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(saveProgress, 150)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.clearTimeout(timer)
      saveProgress()
      el.removeEventListener('scroll', onScroll)
    }
  }, [tid, !!thread])

  // Bottom: infinite next. Top: previous only after user has scrolled away then back.
  useEffect(() => {
    if (!thread) return
    const el = getScrollEl()
    const topEl = topSentinelRef.current
    const bottomEl = bottomSentinelRef.current
    if (!el || !topEl || !bottomEl) return

    const onScroll = () => {
      if (el.scrollTop > PREV_UNLOCK_SCROLL_TOP) {
        prevLoadLockedRef.current = false
      }
      if (el.scrollHeight - el.scrollTop - el.clientHeight <= 400) {
        if (hasNextRef.current && !fetchingNextRef.current) void fetchNextRef.current()
      }
    }

    const prevObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadPrevious()
      },
      { root: el, rootMargin: '0px' },
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
        forumName: resolveForumName(forumGroups, thread.fid),
        forumId: thread.fid || '',
        preview: truncateText(stripHtml(thread.content), 100),
        img: thread.img,
        ext: thread.ext,
        replyCount: total,
        visitedAt: Date.now(),
      })
      setThreadTitle(thread.title || '无标题')
      setThreadPreview(truncateText(stripHtml(thread.content), 40))
    }
  }, [!!thread, forumGroups])

  // 显示原串：滚动并高亮目标帖；若未加载则尽量跳到首页（楼主）
  useEffect(() => {
    if (!focusPostId || !thread) return

    const highlight = (el: HTMLElement) => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('bg-accent-50/30')
      setTimeout(() => el.classList.remove('bg-accent-50/30'), 1500)
      setFocusPostId(null)
    }

    const el = document.querySelector(`[data-pid="${focusPostId}"]`) as HTMLElement | null
    if (el) {
      highlight(el)
      return
    }

    // OP not in view because we're not on page 1
    if (focusPostId === tid && firstPageParam !== 1) {
      setJumpToPage(1)
      return
    }

    let attempts = 0
    const timer = window.setInterval(() => {
      const node = document.querySelector(`[data-pid="${focusPostId}"]`) as HTMLElement | null
      if (node) {
        window.clearInterval(timer)
        highlight(node)
        return
      }
      if (++attempts >= 25) {
        window.clearInterval(timer)
        setFocusPostId(null)
      }
    }, 120)
    return () => window.clearInterval(timer)
  }, [focusPostId, thread, displayed.length, tid, firstPageParam, setFocusPostId, setJumpToPage])

  const handleQuote = (pid: string) => {
    useThreadViewStore.getState().setReferencePostId(pid)
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
      <PullRefreshIndicator ref={ptrRef} />
      <div ref={topSentinelRef} className="h-px" />

      {hasPreviousPage && (
        <div className="py-2 text-center text-xs text-muted">
          {isFetchingPreviousPage ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />加载上一页…
            </span>
          ) : (
            <button
              type="button"
              className="text-muted hover:text-foreground transition-colors"
              onClick={() => {
                // Manual click always allowed (bypass lock from a prior auto-load)
                prevLoadLockedRef.current = false
                loadPrevious()
              }}
            >
              加载上一页
            </button>
          )}
        </div>
      )}

      <div>
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualItems.map(virtualItem => {
            const row = rows[virtualItem.index]
            if (!row) return null
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                data-pid={row.post.id}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: virtualItem.start,
                  left: 0,
                  width: '100%',
                }}
              >
                {row.kind === 'op' ? (
                  <>
                    <PostItem
                      post={mainPost}
                      isPo
                      forumName={forumName}
                      onQuoteClick={handleQuote}
                      onReply={id => {
                        setReplyTo(id)
                        setReplyContent(`>>No.${id}\n`)
                        setReplyOpen(true)
                      }}
                    />
                    <div className="border-t border-divider" />
                  </>
                ) : (
                  <PostItem
                    post={row.post}
                    poHash={poHash}
                    onQuoteClick={handleQuote}
                    onReply={id => {
                      setReplyTo(id)
                      setReplyContent(`>>No.${id}\n`)
                      setReplyOpen(true)
                    }}
                  />
                )}
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
              ref={replyTextareaRef}
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="输入回复…"
              rows={4}
              autoFocus
              className="w-full px-3 py-2.5 text-sm rounded-xl bg-default-100 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none border-none"
            />
            <div className="flex items-center justify-between gap-2 mt-3">
              <EmoticonPicker
                onPick={(em) => {
                  const el = replyTextareaRef.current
                  const start = el?.selectionStart ?? replyContent.length
                  const end = el?.selectionEnd ?? start
                  const { value, caret } = insertAtCursor(replyContent, em, start, end)
                  setReplyContent(value)
                  requestAnimationFrame(() => {
                    el?.focus()
                    el?.setSelectionRange(caret, caret)
                  })
                }}
              />
              <div className="flex gap-2">
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
        </div>
      )}

      <ReferencePopup currentTid={tid} />
    </div>
  )
}
