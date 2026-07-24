import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForumList } from '../hooks/useApi'
import ForumList from '../components/ForumList'
import { useSettingsStore } from '../store/settings'
import { updateUrls } from '../api/client'
import { Home, Palette, BookOpen, Code, Film, Laugh, Menu } from 'lucide-react'
import { Skeleton } from '@heroui/react'

const quickForums = [
  { id: '4', name: '综合版1', Icon: Home },
  { id: '7', name: '欢乐恶搞', Icon: Laugh },
  { id: '11', name: '绘画', Icon: Palette },
  { id: '15', name: '故事', Icon: BookOpen },
  { id: '25', name: '技术宅', Icon: Code },
  { id: '36', name: '动画综合', Icon: Film },
]

export default function HomePage() {
  const nav = useNavigate()
  const { data: forumGroups, isLoading } = useForumList()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { updateUrls().catch(() => {}) }, [])
  useEffect(() => {
    useSettingsStore.getState().applyTheme()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const h = () => { if (useSettingsStore.getState().theme === 'system') useSettingsStore.getState().applyTheme() }
    mq.addEventListener('change', h); return () => mq.removeEventListener('change', h)
  }, [])

  const go = (id: string) => { nav(`/f/${id}`); setSidebarOpen(false) }

  return (
    <div className="flex h-full">
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-background shadow-xl overflow-y-auto animate-[fadeSlideIn_.2s_ease-out]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-divider">
              <span className="font-bold text-lg text-accent">X岛</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1 text-muted hover:text-foreground text-xl leading-none">&times;</button>
            </div>
            <ForumList onSelect={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <aside className="hidden md:block w-64 border-r border-divider overflow-y-auto shrink-0 scrollbar-none"><ForumList /></aside>

      <main className="flex-1 overflow-y-auto page-enter scrollbar-none">
        <div className="md:hidden flex items-center px-4 py-2.5 border-b border-divider bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
            <Menu size={18} /> 版块
          </button>
        </div>

        <div className="p-4 max-w-2xl mx-auto">
          <div className="mb-6 pt-1">
            <h1 className="text-2xl font-bold text-foreground">X岛</h1>
            <p className="text-sm text-muted mt-0.5">匿名版，自由讨论</p>
          </div>

          <div className="mb-6">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">热门版块</h2>
            <div className="grid grid-cols-3 gap-2">
              {quickForums.map(({ id, name, Icon }) => (
                <button key={id} onClick={() => go(id)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-default-100 hover:bg-default-200 dark:bg-default-50 dark:hover:bg-default-100 transition-all active:scale-95 border border-transparent hover:border-accent/20">
                  <Icon size={22} className="text-accent" />
                  <span className="text-xs text-default-600 font-medium truncate w-full text-center">{name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">全部分类</h2>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            ) : (
              <div className="space-y-2.5">
                {forumGroups?.map(group => (
                  <div key={group.id} className="rounded-xl bg-default-50 dark:bg-default-50/30 p-3.5">
                    <h3 className="text-sm font-semibold text-default-700 mb-2">{group.name}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {group.forums.filter(f => Number(f.id) > 0).slice(0, 10).map(f => (
                        <button key={f.id} onClick={() => go(f.id)}
                          className="px-2.5 py-1 text-xs bg-background dark:bg-default-100 text-default-600 rounded-lg hover:bg-accent-50 dark:hover:bg-accent-900/20 hover:text-accent-600 transition-all border border-divider hover:border-accent/30 active:scale-95">
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
