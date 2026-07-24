import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Star, X, Search as SearchIcon } from 'lucide-react'
import { Chip } from '@heroui/react'
import { useFavoritesStore } from '../store/favorites'
import { stripHtml } from '../hooks/useUtils'
import type { ForumThread } from '../types/api'

export default function FavoritesPage() {
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const { items } = useFavoritesStore()
  const searchMode = sp.get('search') === '1'
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = items
    .slice()
    .reverse()
    .filter(i => !searchQuery || i.title.toLowerCase().includes(searchQuery.toLowerCase()) || stripHtml(i.preview).toLowerCase().includes(searchQuery.toLowerCase()) || i.id.includes(searchQuery))

  const threads: ForumThread[] = filtered.map(i => ({
    id: i.id, fid: i.forumId, ReplyCount: String(i.lastReplyCount ?? i.replyCount), img: i.img, ext: i.ext,
    now: new Date(i.addedAt).toLocaleString(), user_hash: '', name: '', title: i.title, content: i.preview,
    sage: 0, admin: 0, Hide: 0, Replies: [],
  }))

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
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="搜索收藏…" autoFocus
              className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted focus:outline-none border-none" />
            <button onClick={closeSearch} className="text-muted hover:text-foreground p-1"><X size={16} /></button>
          </div>
        </div>
      )}
      {items.length === 0 ? (
        <div className="py-20 text-center text-muted"><Star size={40} className="mx-auto mb-3 opacity-40" /><p>还没有收藏的串</p><p className="text-xs mt-1">在串列表点击星号添加</p></div>
      ) : threads.length === 0 ? (
        <div className="py-20 text-center text-muted"><p>没有匹配的收藏</p></div>
      ) : (
        <div>{threads.map(t => <div key={t.id} onClick={() => nav(`/t/${t.id}`)} className="px-3 py-2.5 border-b border-divider cursor-pointer hover:bg-default-50 active:bg-default-100 active:scale-[0.99] transition-all duration-150 origin-left">
          <h3 className="font-medium text-foreground truncate text-sm">{t.title}</h3>
          <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted">
            <span className="text-accent font-mono">No.{t.id}</span>
            {items.find(i => i.id === t.id)?.forumName && <Chip size="sm" variant="soft" color="accent" className="h-4 text-[10px]">{items.find(i => i.id === t.id)?.forumName}</Chip>}
          </div>
          <p className="text-sm text-muted mt-1 line-clamp-2 break-all">{stripHtml(t.content)}</p>
        </div>)}</div>
      )}
    </div>
  )
}
