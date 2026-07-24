import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Eye, Reply, Trash2, PencilLine, Search as SearchIcon, ChevronLeft, ChevronRight, Star, List } from 'lucide-react'
import { Button } from '@heroui/react'
import { useForumList, useTimelineList } from '../hooks/useApi'
import { useThreadViewStore } from '../store/threadView'
import { useForumViewStore } from '../store/forumView'
import { useFavoritesStore } from '../store/favorites'
import { useHistoryStore } from '../store/history'

export default function NavBar() {
  const nav = useNavigate()
  const loc = useLocation()
  const [pageOpen, setPageOpen] = useState(false)
  const [pageInput, setPageInput] = useState('')
  const pageBtnRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!pageOpen) return
    const popup = pageBtnRef.current?.closest('.relative')?.querySelector('.absolute')
    if (!popup) return
    const handler = (e: MouseEvent) => {
      if (!pageBtnRef.current?.contains(e.target as Node) && !popup.contains(e.target as Node)) setPageOpen(false)
    }
    setTimeout(() => document.addEventListener('click', handler), 0)
    return () => document.removeEventListener('click', handler)
  }, [pageOpen])
  const isThread = loc.pathname.startsWith('/t/')
  const tid = isThread ? loc.pathname.split('/')[2] : ''
  const poOnly = loc.search.includes('po=1')
  const { currentPage, totalPages, setJumpToPage, threadTitle } = useThreadViewStore()
  const { data: forumGroups } = useForumList()
  const { data: timelines } = useTimelineList()
  const { isFavorite, addFavorite, removeFavorite } = useFavoritesStore()
  const fav = isFavorite(tid)
  const favCount = useFavoritesStore(s => s.items.length)
  const historyCount = useHistoryStore(s => s.items.length)
  const clearHistory = useHistoryStore(s => s.clearHistory)

  const isDetail = isThread || loc.pathname.startsWith('/f/') || loc.pathname.startsWith('/timeline/')

  const forumId = loc.pathname.startsWith('/f/') ? loc.pathname.split('/')[2] : ''
  let forumName = ''
  if (forumGroups) for (const g of forumGroups) { const f = g.forums.find(f => f.id === forumId); if (f) { forumName = f.name; break } }

  const timelineId = loc.pathname.startsWith('/timeline/') ? loc.pathname.split('/')[2] : ''
  let timelineName = ''
  if (timelines) {
    const t = timelines.find(tl => String(tl.id) === timelineId)
    if (t) timelineName = t.display_name || t.name
  }

  const title = (() => {
    if (isThread) return '串详情'
    if (loc.pathname.startsWith('/f/')) return forumName || `版块 ${forumId}`
    if (loc.pathname.startsWith('/timeline/')) return timelineName || '时间线'
    if (loc.pathname.startsWith('/favorites')) return `收藏 (${favCount})`
    if (loc.pathname.startsWith('/history')) return `历史 (${historyCount})`
    if (loc.pathname.startsWith('/settings')) return '设置'
    return ''
  })()

  return (
    <header className="shrink-0 z-40 bg-background/90 backdrop-blur-md border-b border-divider">
      <div className="flex items-center h-12 px-2 gap-1 max-w-3xl mx-auto w-full">
        {isDetail && (
          <Button isIconOnly variant="ghost" size="sm" onPress={() => nav(-1)} aria-label="返回">
            <ArrowLeft size={18} />
          </Button>
        )}
        {loc.pathname === '/' ? (
          <h1 onClick={() => nav('/')} className="text-lg font-bold text-accent cursor-pointer ml-1 shrink-0">X岛</h1>
        ) : (
          <h1 className="text-sm font-medium text-foreground truncate ml-1">{title}</h1>
        )}

        {/* thread toolbar */}
        {isThread && (
          <div className="flex items-center gap-0.5 ml-2">
            <button onClick={() => nav(`${loc.pathname}${poOnly ? '' : '?po=1'}`, { replace: true })}
              className={`flex items-center gap-0.5 px-1.5 py-1 rounded-lg text-[11px] transition-all ${poOnly ? 'bg-accent text-accent-foreground' : 'text-muted hover:bg-default-100'}`}>
              <Eye size={12} />PO
            </button>
            <div className="relative">
              <button ref={pageBtnRef} onClick={() => { setPageOpen(p => !p); setPageInput(String(currentPage)) }}
                className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg text-[11px] text-muted hover:bg-default-100 transition-colors">
                <List size={12} />
                <span className="tabular-nums">{currentPage}/{totalPages}</span>
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
              onPress={() => fav ? removeFavorite(tid) : addFavorite({ id: tid, title: threadTitle, forumName: '', forumId: '', preview: '', img: '', ext: '', replyCount: 0 })}
              aria-label={fav ? '取消收藏' : '收藏'}
              style={{ color: fav ? 'var(--color-warning)' : undefined }}>
              <Star size={14} fill={fav ? 'currentColor' : 'none'} />
            </Button>
            <button onClick={() => useThreadViewStore.getState().setReplyOpen(true)}
              className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg text-[11px] text-accent font-medium hover:bg-accent-50 dark:hover:bg-accent-900/20">
              <Reply size={12} />回复
            </button>
          </div>
        )}

        {/* forum (board) page toolbar */}
        {loc.pathname.startsWith('/f/') && (
          <div className="flex items-center gap-0.5 ml-2">
            <button onClick={() => useForumViewStore.getState().setCreateThreadOpen(true)}
              className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg text-[11px] text-accent font-medium hover:bg-accent-50 dark:hover:bg-accent-900/20">
              <PencilLine size={12} />发新串
            </button>
          </div>
        )}

        <div className="flex-1" />
        {loc.pathname.startsWith('/favorites') && (
          <Button isIconOnly variant="ghost" size="sm" onPress={() => nav(`/favorites${loc.search.includes('search=1') ? '' : '?search=1'}`, { replace: true })} aria-label="搜索">
            <SearchIcon size={18} />
          </Button>
        )}
        {loc.pathname.startsWith('/history') && (
          <Button isIconOnly variant="ghost" size="sm" onPress={() => nav(`/history${loc.search.includes('search=1') ? '' : '?search=1'}`, { replace: true })} aria-label="搜索">
            <SearchIcon size={18} />
          </Button>
        )}
        {loc.pathname.startsWith('/history') && historyCount > 0 && (
          <Button isIconOnly variant="ghost" size="sm" onPress={() => { if (confirm('清空所有历史？')) clearHistory() }} aria-label="清空历史">
            <Trash2 size={18} />
          </Button>
        )}
      </div>
    </header>
  )
}
