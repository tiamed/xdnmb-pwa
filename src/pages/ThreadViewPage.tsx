import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Star, ArrowUpDown, Eye, Reply } from 'lucide-react'
import { useThread, useReplyThread } from '../hooks/useApi'
import PostItem from '../components/PostItem'
import { useSettingsStore } from '../store/settings'
import { useFavoritesStore } from '../store/favorites'
import { useHistoryStore } from '../store/history'
import { stripHtml, truncateText } from '../hooks/useUtils'
import type { Post } from '../types/api'

export default function ThreadViewPage() {
  const { id: rawId } = useParams<{ id: string }>()
  const threadId = rawId || ''
  const [page, setPage] = useState(1)
  const [poOnly, setPoOnly] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [allReplies, setAllReplies] = useState<Post[]>([])
  const { replySort, autoLoadNext } = useSettingsStore()
  const { addFavorite, removeFavorite, isFavorite, updateReplyCount } = useFavoritesStore()
  const { addHistory } = useHistoryStore()
  const replyMutation = useReplyThread()

  const { data: thread, isLoading, error, refetch } = useThread(threadId, page)

  useEffect(() => {
    if (!thread) return
    if (page === 1) setAllReplies(thread.Replies || [])
    else setAllReplies(p => [...p, ...(thread.Replies || [])])
  }, [thread, page])
  useEffect(() => { setPage(1); setAllReplies([]) }, [threadId])

  useEffect(() => {
    if (thread && page === 1) {
      addHistory({ id: thread.id, title: thread.title || '无标题', forumName: '', forumId: thread.fid || '', preview: truncateText(stripHtml(thread.content), 100), img: thread.img, ext: thread.ext, replyCount: Number(thread.ReplyCount || 0), visitedAt: Date.now() })
      updateReplyCount(thread.id, Number(thread.ReplyCount || 0))
    }
  }, [thread])

  const poHash = thread?.user_hash
  const total = Number(thread?.ReplyCount || 0)
  const isFav = isFavorite(threadId)
  const loadMore = () => { if (!isLoading && allReplies.length < total) setPage(p => p + 1) }

  useEffect(() => {
    if (!autoLoadNext) return
    const h = () => { if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 300) loadMore() }
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [autoLoadNext, isLoading, allReplies.length, total])

  const handleQuote = (pid: string) => {
    const el = document.querySelector(`[data-pid="${pid}"]`) as HTMLElement
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('bg-primary-50/30'); setTimeout(() => el.classList.remove('bg-primary-50/30'), 1500) }
  }

  const handleReply = (pid: string) => { setReplyTo(pid); setReplyContent(`>>No.${pid}\n`); setReplyOpen(true) }

  const submitReply = async () => {
    if (!replyContent.trim()) return
    try {
      await replyMutation.mutateAsync({ resto: threadId, content: replyContent })
      setReplyContent(''); setReplyOpen(false); setReplyTo(null); refetch()
    } catch { alert('回复失败') }
  }

  const displayed = (replySort === 'desc' ? [...allReplies].reverse() : allReplies).filter(r => !poOnly || r.user_hash === poHash)

  if (isLoading && !thread) return (
    <div className="page-enter p-3 space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex gap-2"><div className="h-3 w-16 rounded bg-default-200 shimmer" /><div className="h-3 w-12 rounded bg-default-200 shimmer" /></div>
          <div className="h-3 w-full rounded bg-default-200 shimmer" /><div className="h-3 w-4/5 rounded bg-default-200 shimmer" />
        </div>
      ))}
    </div>
  )

  if (error) return (
    <div className="page-enter flex flex-col items-center justify-center py-20"><p className="text-danger text-sm mb-4">加载失败</p>
      <button onClick={() => refetch()} className="px-4 py-2 text-sm bg-primary text-white rounded-xl">重试</button></div>
  )
  if (!thread) return null

  return (
    <div className="min-h-full page-enter pb-20">
      <div className="sticky top-12 z-30 bg-background/90 backdrop-blur-md border-b border-divider px-3 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <button onClick={() => setPoOnly(!poOnly)} className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all ${poOnly ? 'bg-primary text-white' : 'text-default-500 hover:bg-default-100'}`}><Eye size={14} />只看PO</button>
          <button onClick={() => useSettingsStore.getState().setReplySort(replySort === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-default-500 hover:bg-default-100"><ArrowUpDown size={14} />{replySort === 'asc' ? '正序' : '倒序'}</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-default-400">{displayed.length}/{total}</span>
          <button onClick={() => { if (!thread) return; isFav ? removeFavorite(thread.id) : addFavorite({ id: thread.id, title: thread.title || '无标题', forumName: '', forumId: thread.fid || '', preview: truncateText(stripHtml(thread.content), 100), img: thread.img, ext: thread.ext, replyCount: Number(thread.ReplyCount || 0) }) }}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg ${isFav ? 'text-warning bg-warning-50 dark:bg-warning-900/20' : 'text-default-400 hover:bg-default-100'}`}>
            <Star size={14} fill={isFav ? 'currentColor' : 'none'} />收藏</button>
        </div>
      </div>

      <div data-pid={thread.id}><PostItem post={thread as Post} isPo onQuoteClick={handleQuote} onReply={handleReply} /></div>
      <div className="border-t-2 border-default-200 dark:border-default-700">
        {displayed.map(r => <div key={r.id} data-pid={r.id}><PostItem post={r} poHash={poHash} onQuoteClick={handleQuote} onReply={handleReply} /></div>)}
        <div className="p-4 text-center">
          {isLoading && page > 1 ? <span className="text-sm text-default-400">加载中…</span>
            : !autoLoadNext && displayed.length < total ? <button onClick={loadMore} className="text-sm text-primary">加载更多</button>
            : total > 0 ? <span className="text-sm text-default-400">— 共 {total} 条回复 —</span> : null}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-divider p-2 z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {replyOpen ? (
          <div className="space-y-2">
            {replyTo && <div className="flex items-center justify-between text-xs text-default-500"><span>回复 No.{replyTo}<button onClick={() => { setReplyTo(null); setReplyContent('') }} className="ml-2 text-primary">取消</button></span></div>}
            <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="输入回复…" rows={2}
              className="w-full px-3 py-2 text-sm rounded-xl bg-default-100 text-default-900 focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setReplyOpen(false); setReplyContent('') }} className="px-3 py-1.5 text-sm text-default-500">取消</button>
              <button onClick={submitReply} disabled={replyMutation.isPending || !replyContent.trim()}
                className="px-4 py-1.5 text-sm bg-primary text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 flex items-center gap-1.5">
                {replyMutation.isPending ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />发送中</> : <><Reply size={14} />发送</>}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setReplyOpen(true)} className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-600 active:bg-primary-700 transition-colors flex items-center justify-center gap-2"><Reply size={16} />写回复</button>
        )}
      </div>
    </div>
  )
}
