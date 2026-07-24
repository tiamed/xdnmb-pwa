import { Skeleton } from '@heroui/react'

export function PostSkeleton() {
  return (
    <div className="px-3 py-2.5 border-b border-divider">
      <div className="flex items-center gap-2 mb-1">
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
      </div>
      <Skeleton className="h-3 w-full rounded mt-1" />
      <Skeleton className="h-3 w-4/5 rounded mt-1" />
      <Skeleton className="h-3 w-3/5 rounded mt-1" />
    </div>
  )
}

export function ThreadCardSkeleton() {
  return (
    <div className="px-3 py-2.5 border-b border-divider">
      <div className="flex gap-2.5">
        <Skeleton className="w-[68px] h-[68px] rounded-lg shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/5 rounded" />
          <Skeleton className="h-3 w-2/5 rounded" />
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-4/5 rounded" />
        </div>
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 6 }: { count?: number }) {
  return <>{Array.from({ length: count }).map((_, i) => <ThreadCardSkeleton key={i} />)}</>
}
