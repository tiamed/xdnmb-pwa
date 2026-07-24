import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Sun, Moon, Monitor, Settings, ArrowLeft } from 'lucide-react'
import { useTheme } from 'next-themes'

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const isDetail = location.pathname.startsWith('/t/') || location.pathname.startsWith('/f/') || location.pathname.startsWith('/timeline/') || location.pathname.startsWith('/search')

  const pageTitle = (() => {
    if (location.pathname.startsWith('/t/')) return '串详情'
    if (location.pathname.startsWith('/f/')) return '版块'
    if (location.pathname.startsWith('/timeline/')) return '时间线'
    if (location.pathname.startsWith('/search')) return '搜索'
    if (location.pathname.startsWith('/favorites')) return '收藏'
    if (location.pathname.startsWith('/history')) return '历史'
    if (location.pathname.startsWith('/settings')) return '设置'
    return ''
  })()

  const cycleTheme = () => {
    const modes = ['light', 'dark', 'system'] as const
    const idx = modes.indexOf((theme || 'system') as typeof modes[number])
    setTheme(modes[(idx + 1) % 3])
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const ThemeIcon = !mounted ? Sun : theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-divider">
      <div className="flex items-center h-12 px-2 gap-1 max-w-3xl mx-auto w-full">
        {isDetail && (
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-default-100 text-default-600" aria-label="返回">
            <ArrowLeft size={18} />
          </button>
        )}
        {location.pathname === '/' ? (
          <h1 onClick={() => navigate('/')} className="text-lg font-bold text-primary cursor-pointer ml-1 shrink-0">X岛</h1>
        ) : (
          <h1 className="text-sm font-medium text-default-900 truncate ml-1">{pageTitle}</h1>
        )}
        <div className="flex-1" />
        {searchOpen ? (
          <form onSubmit={handleSearch} className="flex-1 max-w-[200px]">
            <input type="text" autoFocus placeholder="搜索…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-8 px-3 text-sm rounded-lg bg-default-100 text-default-900 focus:outline-none focus:ring-2 focus:ring-primary" />
          </form>
        ) : (
          <button onClick={() => setSearchOpen(true)} className="p-1.5 rounded-lg hover:bg-default-100 text-default-600" aria-label="搜索">
            <Search size={18} />
          </button>
        )}
        <button onClick={cycleTheme} className="p-1.5 rounded-lg hover:bg-default-100 text-default-600" aria-label="主题">
          <ThemeIcon size={18} />
        </button>
        <button onClick={() => navigate('/settings')} className="p-1.5 rounded-lg hover:bg-default-100 text-default-600" aria-label="设置">
          <Settings size={18} />
        </button>
      </div>
    </header>
  )
}
