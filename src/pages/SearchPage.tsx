import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useSearch } from '../hooks/useApi'
import ThreadCard from '../components/ThreadCard'
import { useDebounce } from '../hooks/useUtils'

export default function SearchPage() {
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const init = sp.get('q') || ''
  const [q, setQ] = useState(init)
  const debounced = useDebounce(q, 500)
  const { data: results, isLoading, error } = useSearch(debounced)

  useEffect(() => { if (debounced && debounced !== init) navigate(`/search?q=${encodeURIComponent(debounced)}`, { replace: true }) }, [debounced])

  return (
    <div className="min-h-full page-enter">
      <div className="p-3 border-b border-divider sticky top-0 z-20 bg-background/80 backdrop-blur-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
          <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="搜索串…" autoFocus
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-default-100 text-default-900 focus:outline-none focus:ring-2 focus:ring-primary placeholder-default-400" />
        </div>
      </div>

      {isLoading && <div className="py-2">{Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-3 py-2.5 border-b border-divider">
          <div className="flex gap-2.5">
            <div className="w-[68px] h-[68px] rounded-lg bg-default-200 shimmer shrink-0" />
            <div className="flex-1 space-y-2"><div className="h-4 w-3/5 rounded bg-default-200 shimmer" /><div className="h-3 w-2/5 rounded bg-default-200 shimmer" /><div className="h-3 w-full rounded bg-default-200 shimmer" /></div>
          </div>
        </div>
      ))}</div>}

      {error && <div className="py-20 text-center text-danger text-sm">搜索失败</div>}

      {!isLoading && !error && debounced && results?.length === 0 && (
        <div className="py-20 text-center text-default-400"><Search size={40} className="mx-auto mb-3 opacity-30" /><p className="text-sm">没有找到结果</p></div>
      )}

      {results && results.length > 0 && (
        <div>{results.map(t => <ThreadCard key={t.id} thread={t} />)}</div>
      )}

      {!debounced && !isLoading && (
        <div className="py-20 text-center text-default-400"><Search size={40} className="mx-auto mb-3 opacity-20" /><p className="text-sm">输入关键词搜索</p></div>
      )}
    </div>
  )
}
