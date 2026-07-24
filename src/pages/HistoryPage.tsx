import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Clock, X, Search as SearchIcon, Trash2 } from 'lucide-react'
import { Chip } from '@heroui/react'
import { useHistoryStore } from '../store/history'
import { stripHtml } from '../hooks/useUtils'

export default function HistoryPage() {
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const { items, removeHistory } = useHistoryStore()
  const searchMode = sp.get('search') === '1'
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = items.filter(i => !searchQuery || i.title.toLowerCase().includes(searchQuery.toLowerCase()) || stripHtml(i.preview).toLowerCase().includes(searchQuery.toLowerCase()) || i.id.includes(searchQuery) || i.forumName.toLowerCase().includes(searchQuery.toLowerCase()))

  const closeSearch = () => {
    setSp({})
    setSearchQuery('')
  }

  return (
    <div className="min-h-full page-enter">
      {searchMode && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md px-3 py-2 border-b border-divider">
          <div className="flex items-center gap-2">
            <SearchIcon size={16} className="text-muted shrink-0" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索历史…" autoFocus
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
          <div key={item.id} onClick={() => nav(`/t/${item.id}`)} className="px-3 py-2.5 border-b border-divider cursor-pointer hover:bg-default-50 active:bg-default-100 active:scale-[0.99] transition-all duration-150 origin-left flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate text-sm">{item.title}</h3>
              <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted">
                <span className="text-accent font-mono">No.{item.id}</span>
                {item.forumName && <Chip size="sm" variant="soft" color="accent" className="h-4 text-[10px]">{item.forumName}</Chip>}
                <span className="ml-auto">{new Date(item.visitedAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-muted mt-1 line-clamp-2 break-all">{item.preview}</p>
            </div>
            <button onClick={e => { e.stopPropagation(); if (confirm('删除这条历史？')) removeHistory(item.id) }}
              className="shrink-0 mt-1 p-1.5 text-muted hover:text-danger hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" aria-label="删除">
              <Trash2 size={15} />
            </button>
          </div>
        ))}</div>
      )}
    </div>
  )
}