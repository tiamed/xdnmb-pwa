import { Loader2 } from 'lucide-react'

/** Visual affordance for pull-to-refresh; sits above list content. */
export default function PullRefreshIndicator({
  pull,
  refreshing,
  threshold,
}: {
  pull: number
  refreshing: boolean
  threshold: number
}) {
  const visible = refreshing || pull > 4
  if (!visible) return null

  const progress = Math.min(1, pull / threshold)
  const ready = pull >= threshold || refreshing

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-[height] duration-150 ease-out pointer-events-none"
      style={{ height: refreshing ? 40 : Math.max(0, pull) }}
      aria-hidden={!visible}
    >
      <div
        className={`flex items-center gap-1.5 text-xs ${ready ? 'text-accent' : 'text-muted'}`}
        style={{ opacity: refreshing ? 1 : 0.35 + progress * 0.65 }}
      >
        <Loader2
          size={14}
          className={refreshing || ready ? 'animate-spin' : ''}
          style={!refreshing ? { transform: `rotate(${progress * 270}deg)` } : undefined}
        />
        <span>{refreshing ? '刷新中…' : ready ? '松开刷新' : '下拉刷新'}</span>
      </div>
    </div>
  )
}
