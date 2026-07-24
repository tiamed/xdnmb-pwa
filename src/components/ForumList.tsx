import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForumList, useTimelineList } from '../hooks/useApi'
import type { Forum, ForumGroup, Timeline } from '../types/api'

interface ForumListProps {
  onSelect?: () => void
}

export default function ForumList({ onSelect }: ForumListProps) {
  const navigate = useNavigate()
  const { data: forumGroups, isLoading, error } = useForumList()
  const { data: timelines } = useTimelineList()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(),
  )
  const [activeTab, setActiveTab] = useState<'forum' | 'timeline'>('forum')

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const handleForumClick = (forum: Forum) => {
    navigate(`/f/${forum.id}`)
    onSelect?.()
  }

  const handleTimelineClick = (timeline: Timeline) => {
    navigate(`/timeline/${timeline.id}`)
    onSelect?.()
  }

  // 从 forumGroups 中分离时间线（id < 0 的 forum）
  const extractTimelines = (groups: ForumGroup[] | undefined): Timeline[] => {
    if (!groups) return []
    const tls: Timeline[] = []
    groups.forEach((g) => {
      g.forums.forEach((f) => {
        if (Number(f.id) < 0) {
          tls.push({
            id: f.id,
            name: f.name,
            displayName: f.showName,
            msg: f.msg,
          })
        }
      })
    })
    return tls
  }

  const allTimelines = timelines || extractTimelines(forumGroups)

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">加载中...</div>
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        加载失败: {error.message}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 标签切换 */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('forum')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'forum'
              ? 'text-purple-500 border-b-2 border-purple-500'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          版块
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'timeline'
              ? 'text-purple-500 border-b-2 border-purple-500'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          时间线
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'forum' ? (
          <div className="py-2">
            {forumGroups?.map((group) => (
              <div key={group.id}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between"
                >
                  <span>{group.name}</span>
                  <span className="text-gray-400 text-xs">
                    {expandedGroups.has(group.id) ? '▲' : '▼'}
                  </span>
                </button>
                {expandedGroups.has(group.id) && (
                  <div className="bg-gray-50 dark:bg-gray-800/50">
                    {group.forums
                      .filter((f) => Number(f.id) > 0)
                      .map((forum) => (
                        <button
                          key={forum.id}
                          onClick={() => handleForumClick(forum)}
                          className="w-full px-5 py-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                          {forum.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2">
            {allTimelines.map((tl) => (
              <button
                key={tl.id}
                onClick={() => handleTimelineClick(tl)}
                className="w-full px-3 py-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                {tl.displayName || tl.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
