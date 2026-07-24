import { Routes, Route, useLocation } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import NavBar from './components/NavBar'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import ForumViewPage from './pages/ForumViewPage'
import ThreadViewPage from './pages/ThreadViewPage'
import TimelinePage from './pages/TimelinePage'
import SearchPage from './pages/SearchPage'
import FavoritesPage from './pages/FavoritesPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  const location = useLocation()

  // 底部导航对应的 tab
  const getActiveTab = () => {
    const path = location.pathname
    if (path === '/' || path.startsWith('/f/') || path.startsWith('/timeline/')) return 'home'
    if (path.startsWith('/favorites')) return 'favorites'
    if (path.startsWith('/history')) return 'history'
    if (path.startsWith('/settings')) return 'settings'
    return 'home'
  }

  // 串详情页不显示底部导航
  const showBottomNav = !location.pathname.startsWith('/t/')

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-[#16171d]">
      <NavBar />
      <div className="flex-1 overflow-hidden pb-14">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/f/:id" element={<ForumViewPage />} />
          <Route path="/t/:id" element={<ThreadViewPage />} />
          <Route path="/timeline/:id" element={<TimelinePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {showBottomNav && <BottomNav activeTab={getActiveTab()} />}
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <SearchX size={48} className="mb-4 text-gray-400" />
      <p className="text-gray-500 dark:text-gray-400">页面不存在</p>
    </div>
  )
}

export default App
