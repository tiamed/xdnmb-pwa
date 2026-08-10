import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Star, X, Search as SearchIcon, Loader2 } from 'lucide-react'
import { Chip } from '@heroui/react'
import { useFeedUuid, useForumList, useInfiniteFeed } from '../hooks/useApi'
import { resolveForumName, stripHtml } from '../hooks/useUtils'
import { useSettingsStore } from '../store/settings'
import type { FeedItem } from '../types/api'

export default function FavoritesPage() {
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const feedId = useFeedUuid()
  const { data: forumGroups } = useForumList()
  const autoLoadNext = useSettingsStore((s) => s.autoLoadNext)
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
    refetch,
  } = useInfiniteFeed(feedId)
  const searchMode = sp.get('search') === '1'
  const [searchQuery, setSearchQuery] = useState('')
  const q = searchQuery.toLowerCase()

  const items = useMemo(
    () => data?.pages.flat() ?? [],
    [data],
  )

  // 搜索时尽量拉全部分页，避免只搜到已加载页
  useEffect(() => {
    if (!searchMode || !hasNextPage || isFetchingNextPage) return
    void fetchNextPage()
  }, [searchMode, hasNextPage, isFetchingNextPage, fetchNextPage, items.length])

  useEffect(() => {
    if (!autoLoadNext || searchMode || !hasNextPage || isFetchingNextPage) return
    const el = document.getElementById('main-scroll-container')
    if (!el) return
    const h = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) void fetchNextPage()
    }
    el.addEventListener('scroll', h, { passive: true })
    return () => el.removeEventListener('scroll', h)
  }, [autoLoadNext, searchMode, hasNextPage, isFetchingNextPage, fetchNextPage])

  const filtered = items.filter(
    (i) =>
      !q ||
      String(i.title ?? '').toLowerCase().includes(q) ||
      String(i.content ?? '').toLowerCase().includes(q) ||
      String(i.id ?? '').includes(q),
  )

  const closeSearch = () => {
    setSp({})
    setSearchQuery('')
  }

  if (!feedId) {
    return (
      <div className="py-20 text-center text-muted page-enter">
        <Star size={40} className="mx-auto mb-3 opacity-40" />
        <p>还没有订阅 UUID</p>
        <p className="text-xs mt-1">在串上点星号会自动创建，或在设置中填入已有 UUID</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted page-enter">
        <Loader2 size={28} className="mx-auto animate-spin opacity-50" />
        <p className="text-xs mt-3">加载订阅…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-20 text-center text-muted page-enter">
        <p>加载失败</p>
        <button onClick={() => void refetch()} className="mt-3 text-sm text-accent">重试</button>
      </div>
    )
  }

  return (
    <div className="min-h-full page-enter">
      {searchMode && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md px-3 py-2 border-b border-divider">
          <div className="flex items-center gap-2">
            <SearchIcon size={16} className="text-muted shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索订阅…"
              autoFocus
              className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted focus:outline-none border-none"
            />
            <button onClick={closeSearch} className="text-muted hover:text-foreground p-1">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      {items.length === 0 ? (
        <div className="py-20 text-center text-muted">
          <Star size={40} className="mx-auto mb-3 opacity-40" />
          <p>还没有订阅的串</p>
          <p className="text-xs mt-1">在串列表点击星号添加</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-muted">
          <p>没有匹配的订阅</p>
        </div>
      ) : (
        <div>
          {filtered.map((item) => (
            <FeedRow
              key={item.id}
              item={item}
              forumName={resolveForumName(forumGroups, item.fid)}
              onOpen={() => nav(`/t/${item.id}`)}
            />
          ))}
          {hasNextPage && !searchMode && (
            <div className="py-4 text-center">
              {isFetchingNextPage ? (
                <Loader2 size={18} className="mx-auto animate-spin text-muted" />
              ) : (
                <button
                  onClick={() => void fetchNextPage()}
                  className="px-4 py-2 text-sm bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-all active:scale-95"
                >
                  加载更多
                </button>
              )}
            </div>
          )}
          {searchMode && isFetchingNextPage && (
            <div className="py-3 text-center text-xs text-muted">正在加载全部订阅…</div>
          )}
        </div>
      )}
    </div>
  )
}

function FeedRow({
  item,
  forumName,
  onOpen,
}: {
  item: FeedItem
  forumName: string
  onOpen: () => void
}) {
  return (
    <div
      onClick={onOpen}
      className="px-3 py-2.5 border-b border-divider cursor-pointer hover:bg-default-50 active:bg-default-100 active:scale-[0.99] transition-all duration-150 origin-left"
    >
      <h3 className="font-medium text-foreground truncate text-sm">
        {item.title && item.title !== '无标题' ? item.title : `No.${item.id}`}
      </h3>
      <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted">
        <span className="text-accent font-mono">No.{item.id}</span>
        {forumName && (
          <Chip size="sm" variant="soft" color="accent" className="h-4 text-[10px]">
            {forumName}
          </Chip>
        )}
      </div>
      <p className="text-sm text-muted mt-1 line-clamp-2 break-all">{stripHtml(item.content)}</p>
    </div>
  )
}
