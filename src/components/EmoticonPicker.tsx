import { useEffect, useRef, useState } from 'react'
import { Smile } from 'lucide-react'
import { EMOTICONS } from '../data/emoticons'

interface Props {
  /** Insert emoticon into the controlled text value */
  onPick: (value: string) => void
}

/** Toggleable AA / emoticon panel for compose modals. */
export default function EmoticonPicker({ onPick }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    // Defer so the opening click doesn't immediately close
    const t = window.setTimeout(() => document.addEventListener('click', onDoc), 0)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('click', onDoc)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg transition-colors ${
          open
            ? 'bg-accent text-accent-foreground'
            : 'bg-default-100 text-foreground hover:bg-default-200'
        }`}
        aria-label="颜文字"
        aria-expanded={open}
      >
        <Smile size={15} />
        <span>颜文字</span>
      </button>

      {open && (
        <div
          className="absolute left-0 bottom-full mb-2 z-20 w-[min(100vw-2rem,22rem)] max-h-52 overflow-y-auto rounded-xl border border-divider bg-background shadow-lg p-2 scrollbar-none"
          onClick={e => e.stopPropagation()}
        >
          <div className="grid grid-cols-3 gap-1">
            {EMOTICONS.map(em => (
              <button
                key={`${em.label}-${em.value}`}
                type="button"
                title={em.value}
                onClick={() => {
                  onPick(em.value)
                  setOpen(false)
                }}
                className="px-1.5 py-1.5 text-[11px] leading-tight text-foreground rounded-lg hover:bg-accent-50 dark:hover:bg-accent-900/20 hover:text-accent truncate text-left transition-colors"
              >
                {em.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
