import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForumList, useTimelineList } from '../hooks/useApi'
import type { Forum } from '../types/api'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface ForumListProps {
  onSelect?: () => void
}

export default function ForumList({ onSelect }: ForumListProps) {
  const navigate = useNavigate()
  const { data: forumGroups, isLoading } = useForumList()
  const { data: timelines } = useTimelineList()
  const TIMELINE_KEY = '__timelines__'
  const [expanded, setExpanded] = useState<Set<string>>(new Set([TIMELINE_KEY]))

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleForum = (f: Forum) => {
    navigate(`/f/${f.id}`)
    onSelect?.()
  }

  const handleTimeline = (id: number | string) => {
    navigate(`/timeline/${id}`)
    onSelect?.()
  }

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-default-400">加载中...</div>
  }

  const groups = forumGroups || []
  const hasTimelines = (timelines?.length ?? 0) > 0

  return (
    <div className="py-1 text-sm">
      {/* 时间线 */}
      {hasTimelines && (
        <div>
          <button onClick={() => toggle(TIMELINE_KEY)}
            className="w-full flex items-center justify-between px-3 py-2 text-default-700 hover:bg-default-100 transition-colors">
            <span className="font-medium">时间线</span>
            {expanded.has(TIMELINE_KEY) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expanded.has(TIMELINE_KEY) && timelines!.map(tl => (
            <button key={tl.id} onClick={() => handleTimeline(tl.id)}
              className="w-full text-left px-5 py-1.5 text-default-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors rounded-r-lg">
              {tl.display_name || tl.name}
            </button>
          ))}
        </div>
      )}

      {/* 版块 */}
      <div className="px-3 py-1 text-xs font-semibold text-default-400 uppercase tracking-wider">版块</div>
      {groups.map(group => {
        const forums = group.forums.filter(f => Number(f.id) > 0)
        if (forums.length === 0) return null
        const open = expanded.has(group.id)
        return (
          <div key={group.id}>
            <button onClick={() => toggle(group.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-default-700 hover:bg-default-100 transition-colors">
              <span className="font-medium">{group.name}</span>
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {open && forums.map(f => (
              <button key={f.id} onClick={() => handleForum(f)}
                className="w-full text-left px-5 py-1.5 text-default-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors rounded-r-lg">
                {f.name}
              </button>
            ))}
          </div>
        )
      })}
    </div>
  )
}
