import { useNavigate } from 'react-router-dom'
import { Home, Star, Clock, Settings } from 'lucide-react'

interface BottomNavProps {
  activeTab: string
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const navigate = useNavigate()

  const tabs = [
    { id: 'home', label: '首页', Icon: Home, path: '/' },
    { id: 'favorites', label: '收藏', Icon: Star, path: '/favorites' },
    { id: 'history', label: '历史', Icon: Clock, path: '/history' },
    { id: 'settings', label: '设置', Icon: Settings, path: '/settings' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#16171d] border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
      <div className="flex items-center h-14 max-w-lg mx-auto">
        {tabs.map(({ id, label, Icon, path }) => (
          <button
            key={id}
            onClick={() => navigate(path)}
            className={`flex-1 flex flex-col items-center justify-center text-xs transition-colors ${
              activeTab === id
                ? 'text-purple-500'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Icon size={20} strokeWidth={1.5} />
            <span className="mt-0.5">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
