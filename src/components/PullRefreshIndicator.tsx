import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

/** Always-mounted slot; height/opacity/label updated imperatively by usePullToRefresh. */
const PullRefreshIndicator = forwardRef<HTMLDivElement>(function PullRefreshIndicator(_, ref) {
  return (
    <div
      ref={ref}
      className="flex items-center justify-center overflow-hidden pointer-events-none text-muted will-change-[height,opacity]"
      style={{ height: 0, opacity: 0 }}
      aria-hidden
    >
      <div className="flex items-center gap-1.5 text-xs shrink-0">
        <Loader2 data-ptr-icon size={14} className="shrink-0" />
        <span data-ptr-label>下拉刷新</span>
      </div>
    </div>
  )
})

export default PullRefreshIndicator
