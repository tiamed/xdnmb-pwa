import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useSearch } from '../hooks/useApi'
import ThreadCard from '../components/ThreadCard'
import { useDebounce } from '../hooks/useUtils'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const debouncedQuery = useDebounce(query, 500)

  const { data: results, isLoading, error } = useSearch(debouncedQuery)

  useEffect(() => {
    if (debouncedQuery && debouncedQuery !== initialQuery) {
      navigate(`/search?q=${encodeURIComponent(debouncedQuery)}`, {
        replace: true,
      })
    }
  }, [debouncedQuery])

  return (
    <div className="min-h-full">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入关键词搜索..."
          autoFocus
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {isLoading && (
        <div className="p-8 text-center text-gray-500">搜索中...</div>
      )}

      {error && (
        <div className="p-8 text-center text-red-500">
          搜索失败: {error.message}
        </div>
      )}

      {!isLoading && !error && debouncedQuery && results?.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          没有找到相关结果
        </div>
      )}

      {results && results.length > 0 && (
        <div>
          <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800/30">
            找到 {results.length} 个结果
          </div>
          {results.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      )}

      {!debouncedQuery && !isLoading && (
        <div className="p-8 text-center text-gray-400">输入关键词开始搜索</div>
      )}
    </div>
  )
}
