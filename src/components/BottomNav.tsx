import { useNavigate } from 'react-router-dom'

interface BottomNavProps {
  activeTab: string
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const navigate = useNavigate()

  const tabs = [
    { id: 'home', label: '首页', icon: '🏠', path: '/' },
    { id: 'favorites', label: '收藏', icon: '⭐', path: '/favorites' },
    { id: 'history', label: '历史', icon: '📜', path: '/history' },
    { id: 'settings', label: '设置', icon: '⚙️', path: '/settings' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#16171d] border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
      <div className="flex items-center h-14 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`flex-1 flex flex-col items-center justify-center text-xs transition-colors ${
              activeTab === tab.id
                ? 'text-purple-500'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="mt-0.5">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
