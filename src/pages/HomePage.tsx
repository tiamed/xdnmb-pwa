import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForumList } from '../hooks/useApi'
import ForumList from '../components/ForumList'
import { useSettingsStore } from '../store/settings'
import { updateUrls } from '../api/client'

export default function HomePage() {
  const navigate = useNavigate()
  const { data: forumGroups, isLoading } = useForumList()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // 启动时更新 URL
  useEffect(() => {
    updateUrls().catch(() => {})
  }, [])

  // 初始化主题
  useEffect(() => {
    useSettingsStore.getState().applyTheme()

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (useSettingsStore.getState().theme === 'system') {
        useSettingsStore.getState().applyTheme()
      }
    }
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const handleQuickForum = (forumId: string) => {
    navigate(`/f/${forumId}`)
    setSidebarOpen(false)
  }

  const popularForums = [
    { id: '4', name: '综合版1', icon: '🏠' },
    { id: '7', name: '欢乐恶搞', icon: '😂' },
    { id: '11', name: '绘画', icon: '🎨' },
    { id: '15', name: '故事', icon: '📖' },
    { id: '25', name: '技术宅', icon: '💻' },
    { id: '36', name: '动画综合', icon: '🎬' },
  ]

  return (
    <div className="flex h-full">
      {/* 桌面端侧边栏 */}
      <aside className="hidden md:block w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto shrink-0">
        <ForumList />
      </aside>

      {/* 移动端侧边栏抽屉 */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-[#16171d] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="font-bold text-purple-600 dark:text-purple-400">
                X岛
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 text-gray-500"
              >
                ✕
              </button>
            </div>
            <ForumList onSelect={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto">
        {/* 移动端顶部栏 */}
        <div className="md:hidden flex items-center px-3 py-3 border-b border-gray-200 dark:border-gray-700 sticky top-14 z-30 bg-white dark:bg-[#16171d]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-400 -ml-2"
          >
            ☰ 版块
          </button>
        </div>

        <div className="p-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              欢迎来到 X岛
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              匿名版，自由讨论
            </p>
          </div>

          {/* 快捷入口 */}
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              热门版块
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {popularForums.map((forum) => (
                <button
                  key={forum.id}
                  onClick={() => handleQuickForum(forum.id)}
                  className="flex flex-col items-center gap-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-2xl">{forum.icon}</span>
                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate w-full text-center">
                    {forum.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 分类列表 */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              全部分类
            </h2>
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">加载中...</div>
            ) : (
              <div className="space-y-3">
                {forumGroups?.map((group) => (
                  <div
                    key={group.id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                  >
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {group.name}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {group.forums
                        .filter((f) => Number(f.id) > 0)
                        .slice(0, 8)
                        .map((forum) => (
                          <button
                            key={forum.id}
                            onClick={() => handleQuickForum(forum.id)}
                            className="px-2.5 py-1 text-xs bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                          >
                            {forum.name}
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
