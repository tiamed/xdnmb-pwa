import { useState, useRef, useEffect, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Reply, Trash2, PencilLine, Search as SearchIcon, ChevronLeft, ChevronRight, Star, BookOpen, Menu, Share2 } from 'lucide-react'
import { Button } from '@heroui/react'
import { useFeedCount, useForumList, useIsInFeed, useTimelineList, useToggleFeed } from '../hooks/useApi'
import { useThreadViewStore } from '../store/threadView'
import { useForumViewStore } from '../store/forumView'
import { useHistoryStore } from '../store/history'
import { useSettingsStore } from '../store/settings'
import { useListScrollStore } from '../store/listScroll'

export default function NavBar() {
  const nav = useNavigate()
  const loc = useLocation()
  const [pageOpen, setPageOpen] = useState(false)
  const [pageInput, setPageInput] = useState('')
  const pageBtnRef = useRef<HTMLButtonElement>(null)
  const lastHeaderTapRef = useRef(0)
  useEffect(() => {
    if (!pageOpen) return
    const popup = pageBtnRef.current?.closest('.relative')?.querySelector('.absolute')
    if (!popup) return
    const handler = (e: Event) => {
      if (!pageBtnRef.current?.contains(e.target as Node) && !popup.contains(e.target as Node)) setPageOpen(false)
    }
    setTimeout(() => document.addEventListener('click', handler), 0)
    return () => document.removeEventListener('click', handler)
  }, [pageOpen])
  const isThread = loc.pathname.startsWith('/t/')
  const tid = isThread ? loc.pathname.split('/')[2] : ''
  const poOnly = loc.search.includes('po=1')
  const { currentPage, totalPages, setJumpToPage, threadTitle, threadPreview } = useThreadViewStore()
  const { data: forumGroups } = useForumList()
  const { data: timelines } = useTimelineList()
  const fav = useIsInFeed(tid)
  const { toggle: toggleFeed } = useToggleFeed()
  const favCount = useFeedCount()
  const historyCount = useHistoryStore(s => s.items.length)
  const clearHistory = useHistoryStore(s => s.clearHistory)
  const homeTimelineId = useSettingsStore(s => s.homeTimelineId)
  const setSidebarOpen = useForumViewStore(s => s.setSidebarOpen)

  const isForum = loc.pathname.startsWith('/f/')
  const isTimeline = loc.pathname.startsWith('/timeline/')
  const isHome = loc.pathname === '/'
  const isJump = loc.pathname === '/jump'
  const isFeed = isHome || isForum || isTimeline

  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx
    if (typeof idx === 'number' && idx > 0) {
      nav(-1)
      return
    }
    nav('/', { replace: true })
  }

  const shareThread = async () => {
    if (!tid) return
    const url = `https://www.nmbxd.com/t/${tid}`
    const snippet = threadPreview.trim()
    const text = snippet ? `${snippet}\n${url}` : url
    try {
      if (navigator.share) {
        const title = threadTitle.trim()
        await navigator.share({
          ...(title && title !== '无标题' ? { title } : {}),
          text,
        })
        return
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
    }
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* ignore */
    }
  }

  const forumId = isForum ? loc.pathname.split('/')[2] : ''
  let forumName = ''
  if (forumGroups) for (const g of forumGroups) { const f = g.forums.find(f => f.id === forumId); if (f) { forumName = f.name; break } }

  const timelineId = isTimeline
    ? loc.pathname.split('/')[2]
    : isHome
      ? homeTimelineId
      : ''
  let timelineName = ''
  if (timelines && timelineId) {
    const t = timelines.find(tl => String(tl.id) === String(timelineId))
    if (t) timelineName = t.display_name || t.name
  }

  const scrollFeedToTop = () => {
    if (!isFeed) return
    document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' })
    const key = isForum ? `forum:${forumId}` : timelineId ? `timeline:${timelineId}` : ''
    if (key) useListScrollStore.getState().clear(key)
  }

  const onHeaderDoubleActivate = (e: ReactMouseEvent | ReactPointerEvent) => {
    if (!isFeed) return
    const t = e.target as HTMLElement
    if (t.closest('button, a, input')) return
    scrollFeedToTop()
  }

  /** Mobile double-tap (dblclick is unreliable on many touch browsers). */
  const onHeaderPointerUp = (e: ReactPointerEvent) => {
    if (!isFeed || e.pointerType === 'mouse') return
    const t = e.target as HTMLElement
    if (t.closest('button, a, input')) return
    const now = Date.now()
    if (now - lastHeaderTapRef.current < 320) {
      lastHeaderTapRef.current = 0
      scrollFeedToTop()
    } else {
      lastHeaderTapRef.current = now
    }
  }

  const title = (() => {
    if (isThread) {
      if (threadTitle && threadTitle !== '无标题') return threadTitle
      return tid ? `No.${tid}` : '串详情'
    }
    if (isForum) return forumName || `版块 ${forumId}`
    if (isHome || isTimeline) return timelineName || '时间线'
    if (isJump) return '跳转详情'
    if (loc.pathname.startsWith('/favorites')) return `收藏 (${favCount})`
    if (loc.pathname.startsWith('/history')) return `历史 (${historyCount})`
    if (loc.pathname.startsWith('/settings')) return '设置'
    return ''
  })()

  return (
    <header
      className="shrink-0 z-40 bg-background/90 backdrop-blur-md"
      onDoubleClick={onHeaderDoubleActivate}
      onPointerUp={onHeaderPointerUp}
    >
      <div className="flex items-center h-12 px-2 gap-1 max-w-3xl mx-auto w-full">
        {(isFeed || isJump) && (
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            className="shrink-0"
            onPress={() => setSidebarOpen(true)}
            aria-label="切换版块"
          >
            <Menu size={18} />
          </Button>
        )}
        {isThread && (
          <Button isIconOnly variant="ghost" size="sm" className="shrink-0" onPress={goBack} aria-label="返回">
            <ArrowLeft size={18} />
          </Button>
        )}
        <h1 className="text-sm font-medium text-foreground truncate ml-1 min-w-0">{title}</h1>

        <div className="flex-1 min-w-0" />

        {isThread && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={() => nav(`${loc.pathname}${poOnly ? '' : '?po=1'}`, { replace: true })}
              className={`flex items-center gap-0.5 px-1.5 py-1 rounded-lg text-[11px] transition-all ${poOnly ? 'bg-accent text-accent-foreground' : 'text-muted hover:bg-default-100'}`}>
              PO
            </button>
            <div className="relative">
              <button ref={pageBtnRef} onClick={() => { setPageOpen(p => !p); setPageInput(String(currentPage)) }}
                className="flex items-center justify-center p-1.5 rounded-lg text-muted hover:bg-default-100 transition-colors"
                aria-label="切换页面">
                <BookOpen size={14} />
              </button>
              {pageOpen && (
                <div className="absolute top-full right-0 mt-1 z-50 bg-background border border-divider rounded-xl shadow-lg p-3 min-w-[160px]"
                  onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1 mb-2">
                    <Button isIconOnly variant="ghost" size="sm" isDisabled={currentPage <= 1}
                      onPress={() => setJumpToPage(Math.max(1, currentPage - 1))} aria-label="上一页">
                      <ChevronLeft size={14} />
                    </Button>
                    <input type="number" min={1} max={totalPages} value={pageInput}
                      onChange={e => setPageInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { const p = Math.max(1, Math.min(totalPages, Number(pageInput) || 1)); setJumpToPage(p); setPageOpen(false) } }}
                      className="w-16 text-center text-sm bg-default-100 rounded-lg px-2 py-1 text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none mx-1" />
                    <Button isIconOnly variant="ghost" size="sm" isDisabled={currentPage >= totalPages}
                      onPress={() => setJumpToPage(Math.min(totalPages, currentPage + 1))} aria-label="下一页">
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="flex-1 text-xs" onPress={() => { setJumpToPage(1); setPageOpen(false) }}>首页</Button>
                    <Button size="sm" variant="ghost" className="flex-1 text-xs" onPress={() => { setJumpToPage(totalPages); setPageOpen(false) }}>末页</Button>
                  </div>
                </div>
              )}
            </div>
            <Button isIconOnly variant="ghost" size="sm"
              onPress={() => { void toggleFeed(tid, fav) }}
              aria-label={fav ? '取消订阅' : '订阅'}
              style={{ color: fav ? 'var(--color-warning)' : undefined }}>
              <Star size={14} fill={fav ? 'currentColor' : 'none'} />
            </Button>
            <Button isIconOnly variant="ghost" size="sm"
              onPress={() => useThreadViewStore.getState().setReplyOpen(true)}
              aria-label="回复">
              <Reply size={14} />
            </Button>
            <Button isIconOnly variant="ghost" size="sm"
              onPress={() => { void shareThread() }}
              aria-label="分享">
              <Share2 size={14} />
            </Button>
          </div>
        )}

        {isForum && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={() => useForumViewStore.getState().setCreateThreadOpen(true)}
              className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg text-[11px] text-accent font-medium hover:bg-accent-50 dark:hover:bg-accent-900/20">
              <PencilLine size={12} />发新串
            </button>
          </div>
        )}
        {loc.pathname.startsWith('/favorites') && (
          <Button isIconOnly variant="ghost" size="sm" className="shrink-0" onPress={() => nav(`/favorites${loc.search.includes('search=1') ? '' : '?search=1'}`, { replace: true })} aria-label="搜索">
            <SearchIcon size={18} />
          </Button>
        )}
        {loc.pathname.startsWith('/history') && (
          <Button isIconOnly variant="ghost" size="sm" className="shrink-0" onPress={() => nav(`/history${loc.search.includes('search=1') ? '' : '?search=1'}`, { replace: true })} aria-label="搜索">
            <SearchIcon size={18} />
          </Button>
        )}
        {loc.pathname.startsWith('/history') && historyCount > 0 && (
          <Button isIconOnly variant="ghost" size="sm" className="shrink-0" onPress={() => { if (confirm('清空所有历史？')) clearHistory() }} aria-label="清空历史">
            <Trash2 size={18} />
          </Button>
        )}
      </div>
    </header>
  )
}
