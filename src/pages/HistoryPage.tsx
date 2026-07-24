import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { Chip } from '@heroui/react'
import { useHistoryStore } from '../store/history'

export default function HistoryPage() {
  const nav = useNavigate()
  const { items } = useHistoryStore()

  return (
    <div className="min-h-full page-enter">
      {items.length === 0 ? (
        <div className="py-20 text-center text-muted"><Clock size={40} className="mx-auto mb-3 opacity-40" /><p>还没有浏览记录</p></div>
      ) : (
        <div>{items.map(item => (
          <div key={item.id} onClick={() => nav(`/t/${item.id}`)} className="px-3 py-2.5 border-b border-divider cursor-pointer hover:bg-default-50 active:bg-default-100 active:scale-[0.99] transition-all duration-150 origin-left">
            <h3 className="font-medium text-foreground truncate text-sm">{item.title}</h3>
            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted">
              <span className="text-accent font-mono">No.{item.id}</span>
              {item.forumName && <Chip size="sm" variant="soft" color="accent" className="h-4 text-[10px]">{item.forumName}</Chip>}
              <span className="ml-auto">{new Date(item.visitedAt).toLocaleString()}</span>
            </div>
            <p className="text-sm text-muted mt-1 line-clamp-2 break-all">{item.preview}</p>
          </div>
        ))}</div>
      )}
    </div>
  )
}
