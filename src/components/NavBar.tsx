import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Eye, ArrowUpDown, Reply, Trash2, PencilLine } from 'lucide-react'
import { Button } from '@heroui/react'
import { useForumList, useTimelineList } from '../hooks/useApi'
import { useSettingsStore } from '../store/settings'
import { useThreadViewStore } from '../store/threadView'
import { useForumViewStore } from '../store/forumView'
import { useFavoritesStore } from '../store/favorites'
import { useHistoryStore } from '../store/history'

export default function NavBar() {
  const nav = useNavigate()
  const loc = useLocation()
  const isThread = loc.pathname.startsWith('/t/')
  const poOnly = loc.search.includes('po=1')
  const { replySort, setReplySort } = useSettingsStore()
  const { data: forumGroups } = useForumList()
  const { data: timelines } = useTimelineList()
  const favCount = useFavoritesStore(s => s.items.length)
  const historyCount = useHistoryStore(s => s.items.length)
  const clearHistory = useHistoryStore(s => s.clearHistory)

  const isDetail = isThread || loc.pathname.startsWith('/f/') || loc.pathname.startsWith('/timeline/') || loc.pathname.startsWith('/favorites') || loc.pathname.startsWith('/history') || loc.pathname.startsWith('/settings')

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
            <button onClick={() => setReplySort(replySort === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg text-[11px] text-muted hover:bg-default-100">
              <ArrowUpDown size={12} />{replySort === 'asc' ? '正序' : '倒序'}
            </button>
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
        {loc.pathname.startsWith('/history') && historyCount > 0 && (
          <Button isIconOnly variant="ghost" size="sm" onPress={() => { if (confirm('清空所有历史？')) clearHistory() }} aria-label="清空历史">
            <Trash2 size={18} />
          </Button>
        )}
      </div>
    </header>
  )
}
