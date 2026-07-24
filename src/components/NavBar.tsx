import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Sun, Moon, Monitor, Settings, ArrowLeft } from 'lucide-react'
import { Button } from '@heroui/react'
import { useTheme } from 'next-themes'

export default function NavBar() {
  const nav = useNavigate()
  const loc = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState('')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const isDetail = loc.pathname.startsWith('/t/') || loc.pathname.startsWith('/f/') || loc.pathname.startsWith('/timeline/') || loc.pathname.startsWith('/search')

  const title = (() => {
    if (loc.pathname.startsWith('/t/')) return '串详情'
    if (loc.pathname.startsWith('/f/')) return '版块'
    if (loc.pathname.startsWith('/timeline/')) return '时间线'
    if (loc.pathname.startsWith('/search')) return '搜索'
    if (loc.pathname.startsWith('/favorites')) return '收藏'
    if (loc.pathname.startsWith('/history')) return '历史'
    if (loc.pathname.startsWith('/settings')) return '设置'
    return ''
  })()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) { nav(`/search?q=${encodeURIComponent(q.trim())}`); setSearchOpen(false); setQ('') }
  }

  const ThemeIcon = !mounted ? Sun : theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-divider">
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
        <div className="flex-1" />
        {searchOpen ? (
          <form onSubmit={handleSearch} className="flex-1 max-w-[200px]">
            <input type="text" autoFocus placeholder="搜索…" value={q} onChange={e => setQ(e.target.value)}
              className="w-full h-8 px-3 text-sm rounded-lg bg-default-100 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent border-none" />
          </form>
        ) : (
          <Button isIconOnly variant="ghost" size="sm" onPress={() => setSearchOpen(true)} aria-label="搜索">
            <Search size={18} />
          </Button>
        )}
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
