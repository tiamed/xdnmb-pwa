import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useSearch } from '../hooks/useApi'
import ThreadCard from '../components/ThreadCard'
import { ListSkeleton } from '../components/Skeleton'
import { useDebounce } from '../hooks/useUtils'

export default function SearchPage() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const init = sp.get('q') || ''
  const [q, setQ] = useState(init)
  const debounced = useDebounce(q, 500)
  const { data: results, isLoading, error } = useSearch(debounced)

  useEffect(() => { if (debounced && debounced !== init) nav(`/search?q=${encodeURIComponent(debounced)}`, { replace: true }) }, [debounced])

  return (
    <div className="min-h-full page-enter">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-divider px-3 py-2.5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="搜索串…" autoFocus
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-default-100 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent border-none" />
        </div>
      </div>
      {isLoading && <ListSkeleton count={5} />}
      {error && <div className="py-20 text-center text-danger text-sm">搜索失败</div>}
      {!isLoading && !error && debounced && results?.length === 0 && (
        <div className="py-20 text-center text-muted"><Search size={40} className="mx-auto mb-3 opacity-30" /><p className="text-sm">没有找到结果</p></div>
      )}
      {results && results.length > 0 && (
        <div>
          <div className="px-3 py-1.5 text-xs text-muted bg-default-50">找到 {results.length} 个结果</div>
          {results.map(t => <ThreadCard key={t.id} thread={t} />)}
        </div>
      )}
      {!debounced && !isLoading && (
        <div className="py-20 text-center text-muted"><Search size={40} className="mx-auto mb-3 opacity-20" /><p className="text-sm">输入关键词搜索</p></div>
      )}
    </div>
  )
}
