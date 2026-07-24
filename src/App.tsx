import { useLayoutEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import NavBar from './components/NavBar'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import ForumViewPage from './pages/ForumViewPage'
import ThreadViewPage from './pages/ThreadViewPage'
import TimelinePage from './pages/TimelinePage'
import FavoritesPage from './pages/FavoritesPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [location.pathname])

  const getActiveTab = () => {
    const p = location.pathname
    if (p === '/' || p.startsWith('/f/') || p.startsWith('/timeline/')) return 'home'
    if (p.startsWith('/favorites')) return 'favorites'
    if (p.startsWith('/history')) return 'history'
    if (p.startsWith('/settings')) return 'settings'
    return 'home'
  }

  const showBottomNav = !location.pathname.startsWith('/t/')

  return (
    <div className="h-dvh flex flex-col">
      <NavBar />
      <main ref={mainRef} className="flex-1 min-h-0 overflow-y-auto scrollbar-none pb-[52px]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/f/:id" element={<ForumViewPage />} />
          <Route path="/t/:id" element={<ThreadViewPage />} />
          <Route path="/timeline/:id" element={<TimelinePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <SearchX size={48} className="mb-4 text-default-300" />
              <p className="text-default-500">页面不存在</p>
            </div>
          } />
        </Routes>
      </main>
      {showBottomNav && <BottomNav activeTab={getActiveTab()} />}
    </div>
  )
}

export default App
