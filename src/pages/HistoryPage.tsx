import { useNavigate } from 'react-router-dom'
import { Clock, Trash2 } from 'lucide-react'
import { Chip, Button } from '@heroui/react'
import { useHistoryStore } from '../store/history'

export default function HistoryPage() {
  const nav = useNavigate()
  const { items, clearHistory } = useHistoryStore()

  return (
    <div className="min-h-full page-enter">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-divider bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <h2 className="text-base font-semibold text-foreground">浏览历史 ({items.length})</h2>
        {items.length > 0 && <Button variant="danger" size="sm" onPress={() => { if (confirm('清空所有历史？')) clearHistory() }}><Trash2 size={13} />清空</Button>}
      </div>
      {items.length === 0 ? (
        <div className="py-20 text-center text-muted"><Clock size={40} className="mx-auto mb-3 opacity-40" /><p>还没有浏览记录</p></div>
      ) : (
        <div>{items.map(item => (
          <div key={item.id} onClick={() => nav(`/t/${item.id}`)} className="px-3 py-2.5 border-b border-divider cursor-pointer hover:bg-default-50 transition-colors">
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
