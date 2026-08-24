import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

/** Extract thread id from a raw id, `No.123`, or official `/t/123` URL. */
export function parseThreadId(input: string): string | null {
  const s = input.trim()
  if (!s) return null
  const fromPath = s.match(/\/t\/(\d+)/)
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
      setError('请输入串号或官方链接')
      return
    }
    nav(`/t/${id}`)
  }

  return (
    <div className="min-h-full page-enter px-4 py-6 max-w-lg mx-auto">
      <p className="text-sm text-muted mb-3">输入串号或官方链接</p>
      <input
        autoFocus
        value={value}
        onChange={e => { setValue(e.target.value); setError('') }}
        onKeyDown={e => { if (e.key === 'Enter') go() }}
        placeholder="52752005 或 https://www.nmbxd.com/t/52752005"
        className="w-full px-3 py-2.5 text-sm rounded-xl bg-default-100 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent border-none"
      />
      {error && <p className="text-danger text-xs mt-2">{error}</p>}
      <button
        type="button"
        onClick={go}
        className="mt-4 w-full px-5 py-2.5 text-sm bg-accent text-accent-foreground rounded-xl hover:opacity-90 transition-all active:scale-95"
      >
        跳转
      </button>
    </div>
  )
}
