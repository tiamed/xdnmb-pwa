import { useNavigate } from 'react-router-dom'
import { Clock, Trash2 } from 'lucide-react'
import { useHistoryStore } from '../store/history'

export default function HistoryPage() {
  const navigate = useNavigate()
  const { items, clearHistory } = useHistoryStore()

  return (
    <div className="min-h-full page-enter">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-divider bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <h2 className="text-base font-semibold text-default-900">浏览历史 ({items.length})</h2>
        {items.length > 0 && (
          <button onClick={() => { if (confirm('清空所有历史？')) clearHistory() }} className="flex items-center gap-1 text-xs text-danger">
            <Trash2 size={13} />清空
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="py-20 text-center text-default-400">
          <Clock size={40} className="mx-auto mb-3 opacity-40" /><p>还没有浏览记录</p>
        </div>
      ) : (
        <div>
          {items.map(item => (
            <div key={item.id} onClick={() => navigate(`/t/${item.id}`)}
              className="px-3 py-2.5 border-b border-divider cursor-pointer hover:bg-default-50 transition-colors">
              <div className="flex gap-2.5">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-default-900 truncate text-sm">{item.title}</h3>
                  <div className="flex items-center gap-1 mt-0.5 text-[11px] text-default-400">
                    <span className="text-primary font-mono">No.{item.id}</span>
                    {item.forumName && <span className="bg-primary-50 dark:bg-primary-900/20 text-primary px-1.5 rounded text-[10px]">{item.forumName}</span>}
                    <span className="ml-auto">{new Date(item.visitedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-default-500 mt-1 line-clamp-2 break-all">{item.preview}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
