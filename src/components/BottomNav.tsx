import { useNavigate } from 'react-router-dom'
import { Home, Star, Clock, Settings } from 'lucide-react'

const tabs = [
  { id: 'home', label: '首页', Icon: Home, path: '/' },
  { id: 'favorites', label: '收藏', Icon: Star, path: '/favorites' },
  { id: 'history', label: '历史', Icon: Clock, path: '/history' },
  { id: 'settings', label: '设置', Icon: Settings, path: '/settings' },
]

export default function BottomNav({ activeTab }: { activeTab: string }) {
  const navigate = useNavigate()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-lg border-t border-divider safe-bottom" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center h-12 max-w-lg mx-auto">
        {tabs.map(({ id, label, Icon, path }) => {
          const active = activeTab === id
          return (
            <button key={id} onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors ${
                active ? 'text-primary' : 'text-default-400 hover:text-default-600'
              }`}>
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
