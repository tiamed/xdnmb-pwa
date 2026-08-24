import { useLayoutEffect, useEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { useSettingsStore } from './store/settings'
import NavBar from './components/NavBar'
import BottomNav from './components/BottomNav'
import ForumSidebar from './components/ForumSidebar'
import HomePage from './pages/HomePage'
import ForumViewPage from './pages/ForumViewPage'
import ThreadViewPage from './pages/ThreadViewPage'
import TimelinePage from './pages/TimelinePage'
import FavoritesPage from './pages/FavoritesPage'
import HistoryPage from './pages/HistoryPage'
import JumpThreadPage from './pages/JumpThreadPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => { useSettingsStore.getState().applyTheme() }, [])

  useLayoutEffect(() => {
    // These routes restore their own scroll position
    if (location.pathname.startsWith('/t/')) return
    if (
      location.pathname === '/'
      || location.pathname.startsWith('/timeline/')
      || location.pathname.startsWith('/f/')
    ) return
    mainRef.current?.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    const el = document.documentElement
    const update = () => {
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.setAttribute('content', el.classList.contains('dark') ? '#16171d' : '#f5f5f5')
    }
    const mo = new MutationObserver(update)
    mo.observe(el, { attributes: true, attributeFilter: ['class'] })
    update()
    return () => mo.disconnect()
  }, [])

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
    <div className="h-dvh flex flex-col overflow-hidden">
      <NavBar />
      <ForumSidebar />
      <main ref={mainRef} id="main-scroll-container" className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-none"
        style={{ paddingBottom: 'calc(52px + env(safe-area-inset-bottom, 0px))' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/f/:id" element={<ForumViewPage />} />
          <Route path="/t/:id" element={<ThreadViewPage />} />
          <Route path="/timeline/:id" element={<TimelinePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/jump" element={<JumpThreadPage />} />
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
