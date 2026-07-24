import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Clock, X, Search as SearchIcon, Trash2 } from 'lucide-react'
import { Chip } from '@heroui/react'
import { useHistoryStore } from '../store/history'


export default function HistoryPage() {
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const { items, removeHistory } = useHistoryStore()
  const searchMode = sp.get('search') === '1'
  const [searchQuery, setSearchQuery] = useState('')
  const [actionTarget, setActionTarget] = useState<string | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const q = searchQuery.toLowerCase()
  const filtered = items.filter(i => !q || String(i.title ?? '').toLowerCase().includes(q) || String(i.preview ?? '').toLowerCase().includes(q) || String(i.id ?? '').includes(q) || String(i.forumName ?? '').toLowerCase().includes(q))

  const closeSearch = () => {
    setSp({})
    setSearchQuery('')
  }

  const startLongPress = (id: string) => {
    longPressTimer.current = setTimeout(() => setActionTarget(id), 500)
  }
  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  return (
    <div className="min-h-full page-enter">
      {searchMode && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md px-3 py-2 border-b border-divider">
          <div className="flex items-center gap-2">
            <SearchIcon size={16} className="text-muted shrink-0" />
            <input value={searchQuery} onChange={e => { const v = e.target.value; setSearchQuery(v) }} placeholder="搜索历史…" autoFocus
              className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted focus:outline-none border-none" />
            <button onClick={closeSearch} className="text-muted hover:text-foreground p-1"><X size={16} /></button>
          </div>
        </div>
      )}
      {items.length === 0 ? (
        <div className="py-20 text-center text-muted"><Clock size={40} className="mx-auto mb-3 opacity-40" /><p>还没有浏览记录</p></div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-muted"><p>没有匹配的历史</p></div>
      ) : (
        <div>{filtered.map(item => (
          <div key={item.id} onClick={() => nav(`/t/${item.id}`)}
            onTouchStart={() => startLongPress(item.id)}
            onTouchEnd={cancelLongPress}
            onTouchMove={cancelLongPress}
            onMouseDown={() => startLongPress(item.id)}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onContextMenu={e => { e.preventDefault(); setActionTarget(item.id) }}
            className="px-3 py-2.5 border-b border-divider cursor-pointer hover:bg-default-50 active:bg-default-100 active:scale-[0.99] transition-all duration-150 origin-left">
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

      {/* Long press action sheet */}
      {actionTarget && (
        <div className="fixed inset-0 z-50" onClick={() => setActionTarget(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-lg animate-[slideUp_0.2s_ease-out] px-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]"
            onClick={e => e.stopPropagation()}>
            <div className="bg-background rounded-2xl overflow-hidden shadow-xl border border-divider/50">
              <button onClick={() => { if (confirm('删除这条历史？')) removeHistory(actionTarget); setActionTarget(null) }}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 text-sm font-medium text-danger hover:bg-default-100 active:bg-default-200 transition-colors">
                <Trash2 size={16} />
                删除
              </button>
            </div>
            <button onClick={() => setActionTarget(null)}
              className="w-full mt-2 py-3.5 text-sm font-medium text-foreground bg-background rounded-2xl shadow-sm border border-divider/50 hover:bg-default-100 active:bg-default-200 transition-colors">
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}