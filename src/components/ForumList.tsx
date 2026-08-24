import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForumList, useTimelineList } from '../hooks/useApi'
import type { Forum } from '../types/api'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { useSettingsStore } from '../store/settings'

interface ForumListProps {
  onSelect?: () => void
}

export default function ForumList({ onSelect }: ForumListProps) {
  const navigate = useNavigate()
  const loc = useLocation()
  const { data: forumGroups, isLoading } = useForumList()
  const { data: timelines } = useTimelineList()
  const homeTimelineId = useSettingsStore(s => s.homeTimelineId)
  const setHomeTimelineId = useSettingsStore(s => s.setHomeTimelineId)
  const TIMELINE_KEY = '__timelines__'
  const [expanded, setExpanded] = useState<Set<string>>(new Set([TIMELINE_KEY]))

  const activeForumId = loc.pathname.startsWith('/f/') ? loc.pathname.split('/')[2] : ''
  const activeTimelineId = loc.pathname.startsWith('/timeline/')
    ? loc.pathname.split('/')[2]
    : loc.pathname === '/'
      ? homeTimelineId
      : ''

  useEffect(() => {
    if (!activeForumId || !forumGroups) return
    const group = forumGroups.find(g => g.forums.some(f => f.id === activeForumId))
    if (!group) return
    setExpanded(prev => {
      if (prev.has(group.id)) return prev
      const next = new Set(prev)
      next.add(group.id)
      return next
    })
  }, [activeForumId, forumGroups])

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleForum = (f: Forum) => {
    navigate(`/f/${f.id}`)
    onSelect?.()
  }

  const handleTimeline = (id: number | string) => {
    const sid = String(id)
    setHomeTimelineId(sid)
    navigate('/')
    onSelect?.()
  }

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-default-400">加载中...</div>
  }

  const groups = forumGroups || []
  const hasTimelines = (timelines?.length ?? 0) > 0

  const itemClass = (active: boolean) =>
    `w-full text-left px-5 py-1.5 transition-colors rounded-r-lg ${
      active
        ? 'text-accent font-medium bg-accent-50 dark:bg-accent-900/20'
        : 'text-default-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
    }`

  return (
    <div className="py-1 text-sm">
      <button
        type="button"
        onClick={() => {
          navigate('/jump')
          onSelect?.()
        }}
        className={`w-full flex items-center gap-2 px-3 py-2.5 transition-colors ${
          loc.pathname === '/jump'
            ? 'text-accent font-medium bg-accent-50 dark:bg-accent-900/20'
            : 'text-default-700 hover:bg-default-100'
        }`}
      >
        <Search size={16} />
        <span className="font-medium">跳转详情</span>
      </button>

      {hasTimelines && (
        <div>
          <button
            type="button"
            onClick={() => toggle(TIMELINE_KEY)}
            className="w-full flex items-center justify-between px-3 py-2 text-default-700 hover:bg-default-100 transition-colors"
          >
            <span className="font-medium">时间线</span>
            {expanded.has(TIMELINE_KEY) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expanded.has(TIMELINE_KEY) && timelines!.map(tl => (
            <button
              key={tl.id}
              type="button"
              onClick={() => handleTimeline(tl.id)}
              className={itemClass(String(tl.id) === String(activeTimelineId))}
            >
              {tl.display_name || tl.name}
            </button>
          ))}
        </div>
      )}

      <div className="px-3 py-1 text-xs font-semibold text-default-400 uppercase tracking-wider">版块</div>
      {groups.map(group => {
        const forums = group.forums.filter(f => Number(f.id) > 0)
        if (forums.length === 0) return null
        const open = expanded.has(group.id)
        return (
          <div key={group.id}>
            <button
              type="button"
              onClick={() => toggle(group.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-default-700 hover:bg-default-100 transition-colors"
            >
              <span className="font-medium">{group.name}</span>
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {open && forums.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleForum(f)}
                className={itemClass(f.id === activeForumId)}
              >
                {f.name}
              </button>
            ))}
          </div>
        )
      })}
    </div>
  )
}
