import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Star, ArrowUpDown, Eye } from 'lucide-react'
import { useThread, useReplyThread } from '../hooks/useApi'
import PostItem from '../components/PostItem'
import { useSettingsStore } from '../store/settings'
import { useFavoritesStore } from '../store/favorites'
import { useHistoryStore } from '../store/history'
import { stripHtml, truncateText } from '../hooks/useUtils'
import type { Post } from '../types/api'

export default function ThreadViewPage() {
  const { id } = useParams<{ id: string }>()
  const threadId = id || ''

  const [page, setPage] = useState(1)
  const [poOnly, setPoOnly] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)

  const { replySort, autoLoadNext } = useSettingsStore()
  const { addFavorite, removeFavorite, isFavorite, updateReplyCount } =
    useFavoritesStore()
  const { addHistory } = useHistoryStore()
  const replyMutation = useReplyThread()

  const {
    data: thread,
    isLoading,
    error,
    refetch,
  } = useThread(threadId, page)

  // 合并多页回复
  const [allReplies, setAllReplies] = useState<Post[]>([])

  useEffect(() => {
    if (!thread) return
    if (page === 1) {
      setAllReplies(thread.Replies || [])
    } else {
      setAllReplies((prev) => [...prev, ...(thread.Replies || [])])
    }
  }, [thread, page])

  useEffect(() => {
    setPage(1)
    setAllReplies([])
  }, [threadId])

  // 添加到历史
  useEffect(() => {
    if (thread && page === 1) {
      addHistory({
        id: thread.id,
        title: thread.title || '无标题',
        forumName: '',
        forumId: thread.fid || '',
        preview: truncateText(stripHtml(thread.content), 100),
        img: thread.img,
        ext: thread.ext,
        replyCount: Number(thread.ReplyCount || 0),
        visitedAt: Date.now(),
      })
      updateReplyCount(thread.id, Number(thread.ReplyCount || 0))
    }
  }, [thread])

  const poHash = thread?.user_hash
  const totalReplies = Number(thread?.ReplyCount || 0)
  const isFav = isFavorite(threadId)

  const loadMore = () => {
    if (!isLoading && allReplies.length < totalReplies) {
      setPage((p) => p + 1)
    }
  }

  // 无限滚动
  useEffect(() => {
    if (!autoLoadNext) return

    const handleScroll = () => {
      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      const docHeight = document.documentElement.scrollHeight

      if (scrollTop + windowHeight >= docHeight - 300) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [autoLoadNext, isLoading, allReplies.length, totalReplies])

  const handleQuoteClick = (postId: string) => {
    // 滚动到指定回复
    const el = document.querySelector(
      `[data-post-id="${postId}"]`,
    ) as HTMLElement
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('bg-yellow-100', 'dark:bg-yellow-900/30')
      setTimeout(() => {
        el.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/30')
      }, 2000)
    }
  }

  const handleReplyClick = (postId: string) => {
    setReplyTo(postId)
    setReplyContent(`>>No.${postId}\n`)
    setReplyOpen(true)
  }

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return
    try {
      await replyMutation.mutateAsync({
        resto: threadId,
        content: replyContent,
      })
      setReplyContent('')
      setReplyOpen(false)
      setReplyTo(null)
      refetch()
    } catch (e) {
      alert('回复失败: ' + (e as Error).message)
    }
  }

  const toggleFavorite = () => {
    if (!thread) return
    if (isFav) {
      removeFavorite(thread.id)
    } else {
      addFavorite({
        id: thread.id,
        title: thread.title || '无标题',
        forumName: '',
        forumId: thread.fid || '',
        preview: truncateText(stripHtml(thread.content), 100),
        img: thread.img,
        ext: thread.ext,
        replyCount: Number(thread.ReplyCount || 0),
      })
    }
  }

  // 倒序
  const displayedReplies = replySort === 'desc'
    ? [...allReplies].reverse()
    : allReplies

  // 只看PO
  const filteredReplies = poOnly
    ? displayedReplies.filter((r) => r.user_hash === poHash)
    : displayedReplies

  if (isLoading && !thread) {
    return <div className="p-8 text-center text-gray-500">加载中...</div>
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">加载失败: {error.message}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-sm bg-purple-500 text-white rounded"
        >
          重试
        </button>
      </div>
    )
  }

  if (!thread) return null

  return (
    <div className="min-h-full pb-20">
      {/* 工具栏 */}
      <div className="sticky top-14 z-30 bg-white dark:bg-[#16171d] border-b border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPoOnly(!poOnly)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs ${
              poOnly
                ? 'bg-purple-500 text-white'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <Eye size={14} />
            只看PO
          </button>
          <button
            onClick={() =>
              useSettingsStore
                .getState()
                .setReplySort(replySort === 'asc' ? 'desc' : 'asc')
            }
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowUpDown size={14} />
            {replySort === 'asc' ? '正序' : '倒序'}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs">
            {filteredReplies.length}/{totalReplies}
          </span>
          <button
            onClick={toggleFavorite}
            className={`flex items-center gap-1 text-xs ${
              isFav ? 'text-yellow-500' : 'text-gray-400'
            }`}
          >
            <Star size={16} fill={isFav ? 'currentColor' : 'none'} />
            收藏
          </button>
        </div>
      </div>

      {/* 主帖 */}
      <div data-post-id={thread.id}>
        <PostItem
          post={thread as Post}
          isPo={true}
          onQuoteClick={handleQuoteClick}
          onReply={handleReplyClick}
        />
      </div>

      {/* 回复列表 */}
      <div className="border-t-2 border-gray-200 dark:border-gray-700">
        {filteredReplies.map((reply) => (
          <div key={reply.id} data-post-id={reply.id}>
            <PostItem
              post={reply}
              poHash={poHash}
              onQuoteClick={handleQuoteClick}
              onReply={handleReplyClick}
            />
          </div>
        ))}

        {isLoading && page > 1 && (
          <div className="p-4 text-center text-sm text-gray-400">
            加载中...
          </div>
        )}

        {!autoLoadNext && filteredReplies.length < totalReplies && (
          <div className="p-4 text-center">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="px-4 py-2 text-sm text-purple-500 hover:text-purple-600 disabled:opacity-50"
            >
              加载更多 (第{page}页)
            </button>
          </div>
        )}

        {filteredReplies.length >= totalReplies && totalReplies > 0 && (
          <div className="p-4 text-center text-sm text-gray-400">
            共 {totalReplies} 条回复
          </div>
        )}
      </div>

      {/* 底部回复按钮 */}
      <div className="fixed bottom-14 left-0 right-0 bg-white dark:bg-[#16171d] border-t border-gray-200 dark:border-gray-700 p-2 z-30">
        {replyOpen ? (
          <div className="space-y-2">
            {replyTo && (
              <div className="text-xs text-gray-500">
                回复 No.{replyTo}
                <button
                  onClick={() => {
                    setReplyTo(null)
                    setReplyContent('')
                  }}
                  className="ml-2 text-purple-500"
                >
                  取消
                </button>
              </div>
            )}
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="输入回复内容..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReplyOpen(false)}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400"
              >
                取消
              </button>
              <button
                onClick={handleSubmitReply}
                disabled={replyMutation.isPending || !replyContent.trim()}
                className="px-4 py-1.5 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
              >
                {replyMutation.isPending ? '发送中...' : '发送'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setReplyOpen(true)}
            className="w-full py-2.5 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
          >
            写回复
          </button>
        )}
      </div>
    </div>
  )
}
