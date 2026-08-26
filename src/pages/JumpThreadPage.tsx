import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, X } from 'lucide-react'

/** Extract thread id: `/t/{id}` anywhere (any domain), else bare id / `No.{id}`. */
export function parseThreadId(input: string): string | null {
  const s = input.trim()
  if (!s) return null
  // Host-agnostic: only require a `/t/{digits}` path segment
  const fromPath = s.match(/\/t\/(\d+)/i)
  if (fromPath) return fromPath[1]
  const fromNo = s.match(/^(?:No\.?\s*)?(\d+)$/i)
  if (fromNo) return fromNo[1]
  return null
}

export default function JumpThreadPage() {
  const nav = useNavigate()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const go = () => {
    const id = parseThreadId(value)
    if (!id) {
      setError('请输入有效串号或链接')
      return
    }
    nav(`/t/${id}`)
  }

  const clear = () => {
    setValue('')
    setError('')
  }

  return (
    <div className="min-h-full page-enter select-none">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md px-3 py-2 border-b border-divider">
        <div className="flex items-center gap-2">
          <SearchIcon size={16} className="text-muted shrink-0" />
          <input
            autoFocus
            value={value}
            onChange={e => { setValue(e.target.value); setError('') }}
            onKeyDown={e => { if (e.key === 'Enter') go() }}
            placeholder="串号或链接…"
            className="flex-1 text-sm bg-transparent text-foreground placeholder:text-muted focus:outline-none border-none select-text"
          />
          {value ? (
            <button type="button" onClick={clear} className="text-muted hover:text-foreground p-1" aria-label="清除">
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>
      {error && (
        <p className="px-3 py-2 text-danger text-xs">{error}</p>
      )}
    </div>
  )
}
