import { useState, useEffect, useRef } from 'react'
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
import type { Post } from '../types/api'

const PAGE_SIZE = 19
const ITEM_HEIGHT = 85

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
  const listRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isFetchingNextPage, isFetchingPreviousPage, fetchNextPage, fetchPreviousPage, hasNextPage, hasPreviousPage, error, refetch } = useInfiniteThread(tid)

  const thread = data?.pages[0]
  const total = Number(thread?.ReplyCount || 0)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const poHash = thread?.user_hash
  const allReplies = data?.pages.flatMap(p => p.Replies || []) ?? []
  const displayed = allReplies.filter(r => !poOnly || r.user_hash === poHash)

  const virtualizer = useVirtualizer({
    count: displayed.length,
    getScrollElement: () => document.getElementById('main-scroll-container'),
    estimateSize: () => ITEM_HEIGHT,
    overscan: 8,
  })

  useEffect(() => {
    if (data) {
      setCurrentPage(data.pages.length)
      setTotalPages(totalPages)
    }
  }, [data?.pages.length, totalPages])

  const jumpTarget = useThreadViewStore(s => s.jumpToPage)
  useEffect(() => {
    if (jumpTarget <= 0) return
    setCurrentPage(jumpTarget)
    setJumpToPage(0)
    ;(async () => {
      const pageData = await getThread(tid, jumpTarget)
      queryClient.setQueryData(['thread', tid], {
        pages: [pageData],
        pageParams: [jumpTarget],
      })
    })()
    const el = document.getElementById('main-scroll-container')
    el?.scrollTo({ top: 0 })
  }, [jumpTarget])

  useEffect(() => {
    const el = document.getElementById('main-scroll-container')
    if (!el) return
    const handler = () => {
      if (el.scrollTop < 200 && hasPreviousPage && !isFetchingPreviousPage) {
        fetchPreviousPage()
      }
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 400 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [hasNextPage, hasPreviousPage, isFetchingNextPage, isFetchingPreviousPage, fetchNextPage, fetchPreviousPage])

  useEffect(() => {
    if (thread) {
      addHistory({ id: thread.id, title: thread.title || '无标题', forumName: '', forumId: thread.fid || '', preview: truncateText(stripHtml(thread.content), 100), img: thread.img, ext: thread.ext, replyCount: total, visitedAt: Date.now() })
      updateReplyCount(thread.id, total)
      setThreadTitle(thread.title || '无标题')
    }
  }, [!!thread])

  const handleQuote = (pid: string) => {
    const setReferencePostId = useThreadViewStore.getState().setReferencePostId
    const el = document.querySelector(`[data-pid="${pid}"]`) as HTMLElement
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('bg-accent-50/30'); setTimeout(() => el.classList.remove('bg-accent-50/30'), 1500) }
    else { setReferencePostId(pid) }
  }

  const submitReply = async () => {
    if (!replyContent.trim()) return
    try {
      await replyMutation.mutateAsync({ resto: tid, content: replyContent })
      setReplyContent(''); setReplyOpen(false); setReplyTo(null); refetch()
      setToast('回复成功'); setTimeout(() => setToast(''), 2000)
    } catch { setToast('回复失败'); setTimeout(() => setToast(''), 2000) }
  }

  if (isLoading && !thread) return <div className="page-enter"><ListSkeleton count={6} /></div>
  if (error && !thread) return (
    <div className="page-enter flex flex-col items-center justify-center py-20">
      <p className="text-danger text-sm mb-4">加载失败</p>
      <button onClick={() => refetch()} className="px-4 py-2 text-sm bg-accent text-accent-foreground rounded-xl">重试</button>
    </div>
  )
  if (!thread) return null

  const loading = isFetchingPreviousPage || isFetchingNextPage
  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div className="min-h-full page-enter pb-4">
      <div data-pid={thread.id}>
        <PostItem post={thread as Post} isPo onQuoteClick={handleQuote}
          onReply={id => { setReplyTo(id); setReplyContent(`>>No.${id}\n`); setReplyOpen(true) }} />
      </div>
      <div className="border-t-2 border-default-200 dark:border-default-700" ref={listRef}>
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualItems.map(virtualItem => {
            const reply = displayed[virtualItem.index]
            return (
              <div key={reply.id} data-pid={reply.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}>
                <PostItem post={reply} poHash={poHash} onQuoteClick={handleQuote}
                  onReply={id => { setReplyTo(id); setReplyContent(`>>No.${id}\n`); setReplyOpen(true) }} />
              </div>
            )
          })}
        </div>
        <div className="p-4 text-center text-sm text-muted">
          {loading ? (
            <span className="inline-flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" />加载中…</span>
          ) : total > 0 ? (
            `— 共 ${total} 条回复 —`
          ) : null}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-xl text-sm font-medium bg-foreground/95 text-background shadow-lg animate-[fadeSlideIn_.2s_ease-out] pointer-events-none">
          {toast}
        </div>
      )}

      {replyOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" onClick={() => setReplyOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative mt-auto bg-background rounded-t-2xl p-4 animate-[slideUp_0.25s_ease-out] max-h-[70vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">{replyTo ? `回复 No.${replyTo}` : '回复此串'}</span>
              <button onClick={() => { setReplyOpen(false); setReplyContent(''); setReplyTo(null) }} className="text-muted hover:text-foreground text-xl leading-none">&times;</button>
            </div>
            {replyTo && (
              <div className="mb-2 text-xs text-muted">
                引用 No.{replyTo}
                <button onClick={() => { setReplyTo(null); setReplyContent('') }} className="ml-2 text-accent hover:underline">取消引用</button>
              </div>
            )}
            <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="输入回复…" rows={4} autoFocus
              className="w-full px-3 py-2.5 text-sm rounded-xl bg-default-100 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none border-none" />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => { setReplyOpen(false); setReplyContent(''); setReplyTo(null) }}
                className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors">取消</button>
              <button onClick={submitReply} disabled={replyMutation.isPending || !replyContent.trim()}
                className="px-5 py-2 text-sm bg-accent text-accent-foreground rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 active:scale-95">
                {replyMutation.isPending ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />发送中</> : <><Reply size={15} />发送</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <ReferencePopup currentTid={tid} />
    </div>
  )
}
