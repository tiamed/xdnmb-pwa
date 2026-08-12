import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { RefreshCw, AlertTriangle, Send, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@heroui/react'
import { useInfiniteForumThreads, useForumList, usePostThread } from '../hooks/useApi'
import ThreadCard from '../components/ThreadCard'
import { ListSkeleton } from '../components/Skeleton'
import EmoticonPicker from '../components/EmoticonPicker'
import { useSettingsStore } from '../store/settings'
import { useForumViewStore } from '../store/forumView'
import { useHistoryStore } from '../store/history'
import { getActiveUserHash } from '../store/settings'
import { stripHtml, truncateText } from '../hooks/useUtils'
import { insertAtCursor } from '../data/emoticons'

export default function ForumViewPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const { data: forumGroups } = useForumList()
  const { autoLoadNext } = useSettingsStore()
  const { addHistory } = useHistoryStore()
  const createThreadOpen = useForumViewStore(s => s.createThreadOpen)
  const setCreateThreadOpen = useForumViewStore(s => s.setCreateThreadOpen)
  const postThread = usePostThread()

  const forumId = id || '4'
  let forumName = ''
  if (forumGroups) for (const g of forumGroups) { const f = g.forums.find(f2 => f2.id === forumId); if (f) { forumName = f.name; break } }

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage, error, refetch } = useInfiniteForumThreads(forumId)
  const threads = data?.pages.flat() ?? []

  useEffect(() => {
    if (!autoLoadNext || !hasNextPage || isFetchingNextPage) return
    const el = document.getElementById('main-scroll-container')
    if (!el) return
    const h = () => { if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) fetchNextPage() }
    el.addEventListener('scroll', h, { passive: true })
    return () => el.removeEventListener('scroll', h)
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
            <ThreadCard key={thread.id} thread={thread} forumName={forumName} onOpen={() => {
              addHistory({ id: thread.id, title: thread.title || '无标题', forumName, forumId, preview: truncateText(stripHtml(thread.content), 100), img: thread.img, ext: thread.ext, replyCount: Number(thread.ReplyCount || 0), visitedAt: Date.now() })
              nav(`/t/${thread.id}`)
            }} />
          ))}
          <div className="p-4 text-center text-sm text-muted">
            {isFetchingNextPage ? '加载中…' : !hasNextPage && threads.length > 0 ? '— 没有更多了 —' : !autoLoadNext && hasNextPage ? (
              <button onClick={() => fetchNextPage()} className="px-4 py-2 text-sm bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-all active:scale-95">加载更多</button>
            ) : null}
          </div>
        </div>
      )}

      {createThreadOpen && (
        <CreateThreadPopup
          forumName={forumName}
          onClose={() => setCreateThreadOpen(false)}
          onSubmit={async (fields) => {
            await postThread.mutateAsync({ fid: forumId, ...fields, image: fields.image ?? undefined })
          }}
          isPending={postThread.isPending}
        />
      )}
    </div>
  )
}

interface CreateThreadFields {
  title: string
  name: string
  email: string
  content: string
  image: File | null
  watermark: boolean
}

function CreateThreadPopup({
  forumName,
  onClose,
  onSubmit,
  isPending,
}: {
  forumName: string
  onClose: () => void
  onSubmit: (fields: CreateThreadFields) => Promise<void>
  isPending: boolean
}) {
  const [title, setTitle] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [watermark, setWatermark] = useState(false)
  const [toast, setToast] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const hasUserHash = !!getActiveUserHash()

  useEffect(() => {
    if (!image) { setImagePreview(''); return }
    const url = URL.createObjectURL(image)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const reset = () => { setTitle(''); setName(''); setEmail(''); setContent(''); setImage(null); setWatermark(false) }

  const submit = async () => {
    if (!content.trim()) return
    try {
      await onSubmit({ title: title.trim(), name: name.trim(), email: email.trim(), content: content.trim(), image, watermark })
      reset(); onClose(); showToast('发串成功')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '发串失败')
    }
  }

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setImage(f)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative mt-auto bg-background rounded-t-2xl p-4 animate-[slideUp_0.25s_ease-out] max-h-[80vh] overflow-y-auto overflow-x-hidden overscroll-contain"
        onClick={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">发新串{forumName ? ` · ${forumName}` : ''}</span>
          <button onClick={onClose} className="text-muted hover:text-foreground" aria-label="关闭"><X size={18} /></button>
        </div>

        {!hasUserHash && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-warning-50 dark:bg-warning-900/20 text-xs text-warning-700 dark:text-warning-300">
            尚未设置 userhash，发串可能失败。请前往「设置 → Cookie」添加。
          </div>
        )}

        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="标题（可选）"
          className="w-full px-3 py-2.5 text-sm rounded-xl bg-default-100 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent border-none mb-2" />
        <div className="flex gap-2 mb-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="名称（可选）"
            className="flex-1 px-3 py-2.5 text-sm rounded-xl bg-default-100 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent border-none" />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱（可选）"
            className="flex-1 px-3 py-2.5 text-sm rounded-xl bg-default-100 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent border-none" />
        </div>
        <textarea
          ref={contentRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="输入正文…"
          rows={5}
          autoFocus
          className="w-full px-3 py-2.5 text-sm rounded-xl bg-default-100 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none border-none"
        />

        {imagePreview && (
          <div className="mt-2 relative">
            <img src={imagePreview} alt="预览" className="max-h-32 rounded-lg border border-divider" />
            <button onClick={() => setImage(null)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1" aria-label="移除图片"><X size={12} /></button>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <EmoticonPicker
              onPick={(em) => {
                const el = contentRef.current
                const start = el?.selectionStart ?? content.length
                const end = el?.selectionEnd ?? start
                const { value, caret } = insertAtCursor(content, em, start, end)
                setContent(value)
                requestAnimationFrame(() => {
                  el?.focus()
                  el?.setSelectionRange(caret, caret)
                })
              }}
            />
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg bg-default-100 text-foreground hover:bg-default-200 cursor-pointer transition-colors">
              <ImageIcon size={15} />
              <span>图片</span>
              <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
            </label>
            <label className="flex items-center gap-1.5 text-sm text-muted cursor-pointer">
              <input type="checkbox" checked={watermark} onChange={e => setWatermark(e.target.checked)} className="accent-accent" />
              <span>水印</span>
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors">取消</button>
            <button onClick={submit} disabled={isPending || !content.trim()}
              className="px-5 py-2 text-sm bg-accent text-accent-foreground rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 active:scale-95">
              {isPending ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />发送中</> : <><Send size={15} />发送</>}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-xl text-sm font-medium bg-foreground/95 text-background shadow-lg animate-[fadeSlideIn_.2s_ease-out] pointer-events-none">
          {toast}
        </div>
      )}
    </div>,
    document.body,
  )
}