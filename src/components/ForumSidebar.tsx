import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useForumViewStore } from '../store/forumView'
import ForumList from './ForumList'

export default function ForumSidebar() {
  const open = useForumViewStore(s => s.sidebarOpen)
  const setSidebarOpen = useForumViewStore(s => s.setSidebarOpen)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, setSidebarOpen])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="切换版块">
      <div
        className="absolute inset-0 bg-black/30 animate-[fadeIn_.2s_ease-out]"
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-background shadow-xl overflow-y-auto scrollbar-none animate-[slideInLeft_.25s_ease-out]"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-divider sticky top-0 bg-background z-10">
          <span className="font-bold text-lg text-accent">X岛</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-muted hover:text-foreground text-xl leading-none"
            aria-label="关闭"
          >
            &times;
          </button>
        </div>
        <ForumList onSelect={() => setSidebarOpen(false)} />
      </aside>
    </div>,
    document.body,
  )
}
