import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSettingsStore } from '../store/settings'

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { theme, setTheme } = useSettingsStore()

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const themeIcon = theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🖥️'

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#16171d] border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center h-14 px-3 gap-2">
        {/* 返回按钮（详情页显示） */}
        {(location.pathname.startsWith('/t/') ||
          location.pathname.startsWith('/f/') ||
          location.pathname.startsWith('/timeline/') ||
          location.pathname.startsWith('/search') ||
          location.pathname.startsWith('/favorites') ||
          location.pathname.startsWith('/history') ||
          location.pathname.startsWith('/settings')) && (
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            ←
          </button>
        )}

        {/* Logo / 标题 */}
        {location.pathname === '/' ? (
          <h1
            onClick={() => navigate('/')}
            className="text-lg font-bold text-purple-600 dark:text-purple-400 cursor-pointer"
          >
            X岛
          </h1>
        ) : (
          <h1 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
            {location.pathname.startsWith('/t/') && '串详情'}
            {location.pathname.startsWith('/f/') && '版块'}
            {location.pathname.startsWith('/timeline/') && '时间线'}
            {location.pathname.startsWith('/search') && '搜索'}
            {location.pathname.startsWith('/favorites') && '收藏'}
            {location.pathname.startsWith('/history') && '历史'}
            {location.pathname.startsWith('/settings') && '设置'}
          </h1>
        )}

        <div className="flex-1" />

        {/* 搜索 */}
        {searchOpen ? (
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs">
            <input
              type="text"
              autoFocus
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </form>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            title="搜索"
          >
            🔍
          </button>
        )}

        {/* 主题切换 */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          title={`主题: ${theme}`}
        >
          {themeIcon}
        </button>

        {/* 设置 */}
        <button
          onClick={() => navigate('/settings')}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          title="设置"
        >
          ⚙️
        </button>
      </div>
    </header>
  )
}
