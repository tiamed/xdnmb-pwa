import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sun, Moon, Monitor, Settings, ArrowLeft, Eye, ArrowUpDown, Reply } from 'lucide-react'
import { Button } from '@heroui/react'
import { useTheme } from 'next-themes'
import { useSettingsStore } from '../store/settings'
import { useThreadViewStore } from '../store/threadView'

export default function NavBar() {
  const nav = useNavigate()
  const loc = useLocation()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isThread = loc.pathname.startsWith('/t/')
  const poOnly = loc.search.includes('po=1')
  const { replySort, setReplySort } = useSettingsStore()
  useEffect(() => { setMounted(true) }, [])

  const isDetail = isThread || loc.pathname.startsWith('/f/') || loc.pathname.startsWith('/timeline/') || loc.pathname.startsWith('/favorites') || loc.pathname.startsWith('/history') || loc.pathname.startsWith('/settings')

  const title = (() => {
    if (isThread) return '串详情'
    if (loc.pathname.startsWith('/f/')) return '版块'
    if (loc.pathname.startsWith('/timeline/')) return '时间线'
    if (loc.pathname.startsWith('/favorites')) return '收藏'
    if (loc.pathname.startsWith('/history')) return '历史'
    if (loc.pathname.startsWith('/settings')) return '设置'
    return ''
  })()

  const ThemeIcon = !mounted ? Sun : theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

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

        <div className="flex-1" />
        <Button isIconOnly variant="ghost" size="sm" onPress={() => {
          const modes = ['light', 'dark', 'system'] as const
          const idx = modes.indexOf((theme || 'system') as typeof modes[number])
          setTheme(modes[(idx + 1) % 3])
        }} aria-label="主题">
          <ThemeIcon size={18} />
        </Button>
        <Button isIconOnly variant="ghost" size="sm" onPress={() => nav('/settings')} aria-label="设置">
          <Settings size={18} />
        </Button>
      </div>
    </header>
  )
}
