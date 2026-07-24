import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Sun, Moon, Monitor, Settings, ArrowLeft } from 'lucide-react'
import { useSettingsStore } from '../store/settings'
import type { ThemeMode } from '../store/settings'

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { theme, setTheme } = useSettingsStore()

  const cycleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system']
    const idx = modes.indexOf(theme)
    setTheme(modes[(idx + 1) % modes.length])
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  const isDetailPage =
    location.pathname.startsWith('/t/') ||
    location.pathname.startsWith('/f/') ||
    location.pathname.startsWith('/timeline/') ||
    location.pathname.startsWith('/search') ||
    location.pathname.startsWith('/favorites') ||
    location.pathname.startsWith('/history') ||
    location.pathname.startsWith('/settings')

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

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#16171d] border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center h-14 px-3 gap-1">
        {isDetailPage && (
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg -ml-1"
            aria-label="返回"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        {location.pathname === '/' ? (
          <h1
            onClick={() => navigate('/')}
            className="text-lg font-bold text-purple-600 dark:text-purple-400 cursor-pointer ml-1"
          >
            X岛
          </h1>
        ) : (
          <h1 className="text-base font-medium text-gray-900 dark:text-gray-100 truncate ml-1">
            {pageTitle}
          </h1>
        )}

        <div className="flex-1" />

        {searchOpen ? (
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs">
            <input
              type="text"
              autoFocus
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </form>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="搜索"
            aria-label="搜索"
          >
            <Search size={20} />
          </button>
        )}

        <button
          onClick={cycleTheme}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          title={`主题: ${theme}`}
          aria-label="切换主题"
        >
          <ThemeIcon size={20} />
        </button>

        <button
          onClick={() => navigate('/settings')}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg -mr-1"
          title="设置"
          aria-label="设置"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  )
}
