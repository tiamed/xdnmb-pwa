import { useNavigate } from 'react-router-dom'
import { Star, Trash2 } from 'lucide-react'
import { Chip } from '@heroui/react'
import { useFavoritesStore } from '../store/favorites'
import type { ForumThread } from '../types/api'

export default function FavoritesPage() {
  const nav = useNavigate()
  const { items, clearFavorites } = useFavoritesStore()
  const threads: ForumThread[] = items.map(i => ({
    id: i.id, fid: i.forumId, ReplyCount: String(i.replyCount), img: i.img, ext: i.ext,
    now: new Date(i.addedAt).toLocaleString(), user_hash: '', name: '', title: i.title, content: i.preview,
    sage: 0, admin: 0, Hide: 0, Replies: [],
  }))

  return (
    <div className="min-h-full page-enter">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-divider bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <h2 className="text-base font-semibold text-foreground">收藏 ({items.length})</h2>
        {items.length > 0 && (
          <button onClick={() => { if (confirm('清空所有收藏？')) clearFavorites() }} className="flex items-center gap-1 text-xs text-danger hover:underline">
            <Trash2 size={13} />清空
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="py-20 text-center text-muted"><Star size={40} className="mx-auto mb-3 opacity-40" /><p>还没有收藏的串</p><p className="text-xs mt-1">在串列表点击星号添加</p></div>
      ) : (
        <div>{threads.map(t => <div key={t.id} onClick={() => nav(`/t/${t.id}`)} className="px-3 py-2.5 border-b border-divider cursor-pointer hover:bg-default-50 transition-colors">
          <h3 className="font-medium text-foreground truncate text-sm">{t.title}</h3>
          <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted">
            <span className="text-accent font-mono">No.{t.id}</span>
            {items.find(i => i.id === t.id)?.forumName && <Chip size="sm" variant="soft" color="accent" className="h-4 text-[10px]">{items.find(i => i.id === t.id)?.forumName}</Chip>}
            <span className="ml-auto">{t.ReplyCount} 回复</span>
          </div>
          <p className="text-sm text-muted mt-1 line-clamp-2 break-all">{t.content}</p>
        </div>)}</div>
      )}
    </div>
  )
}
