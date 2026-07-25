import { useMemo } from 'react'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getForumList,
  getTimelineList,
  getForumThreads,
  getTimelineThreads,
  getThread,
  getThreadPo,
  getReference,
  getFeed,
  addFeed as apiAddFeed,
  delFeed as apiDelFeed,
  search as apiSearch,
  postThread as apiPostThread,
  replyThread as apiReplyThread,
} from '../api/client'
import { ensureFeedUuid, useSettingsStore } from '../store/settings'

// 版块列表
export function useForumList() {
  return useQuery({
    queryKey: ['forumList'],
    queryFn: getForumList,
    staleTime: 1000 * 60 * 60,
  })
}

// 时间线列表
export function useTimelineList() {
  return useQuery({
    queryKey: ['timelineList'],
    queryFn: getTimelineList,
    staleTime: 1000 * 60 * 60,
  })
}

// 版块串列表 - infinite
export function useInfiniteForumThreads(forumId: string) {
  return useInfiniteQuery({
    queryKey: ['forumThreads', forumId],
    queryFn: ({ pageParam }) => getForumThreads(forumId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _all, lastPageParam) =>
      lastPage.length > 0 ? lastPageParam + 1 : undefined,
    enabled: !!forumId,
    staleTime: 1000 * 30,
  })
}

// 时间线串列表 - infinite
export function useInfiniteTimelineThreads(timelineId: string) {
  return useInfiniteQuery({
    queryKey: ['timelineThreads', timelineId],
    queryFn: ({ pageParam }) => getTimelineThreads(timelineId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _all, lastPageParam) =>
      lastPage.length > 0 ? lastPageParam + 1 : undefined,
    enabled: !!timelineId,
    staleTime: 1000 * 30,
  })
}

const THREAD_PAGE_SIZE = 19

// 串详情 - infinite replies (bi-directional)
export function useInfiniteThread(threadId: string) {
  return useInfiniteQuery({
    queryKey: ['thread', threadId],
    queryFn: ({ pageParam }) => getThread(threadId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _all, lastPageParam) => {
      const total = Number(lastPage?.ReplyCount || 0)
      const totalPages = Math.max(1, Math.ceil(total / THREAD_PAGE_SIZE))
      return lastPageParam < totalPages ? lastPageParam + 1 : undefined
    },
    getPreviousPageParam: (_firstPage, _all, firstPageParam) => {
      return firstPageParam > 1 ? firstPageParam - 1 : undefined
    },
    maxPages: 10,
    enabled: !!threadId,
    staleTime: 1000 * 15,
  })
}

// 只看 PO
export function useThreadPo(threadId: string, page = 1) {
  return useQuery({
    queryKey: ['threadPo', threadId, page],
    queryFn: () => getThreadPo(threadId, page),
    staleTime: 1000 * 15,
    enabled: !!threadId,
  })
}

// 引用
export function useReference(postId: string) {
  return useQuery({
    queryKey: ['reference', postId],
    queryFn: () => getReference(postId),
    staleTime: Infinity,
    enabled: !!postId,
  })
}

export function useFeedUuid() {
  return useSettingsStore((s) => s.feedUuid.trim())
}

async function fetchAllFeedIds(feedId: string): Promise<string[]> {
  const ids: string[] = []
  for (let page = 1; page <= 500; page++) {
    const items = await getFeed(feedId, page)
    if (!items.length) break
    for (const item of items) ids.push(item.id)
  }
  return ids
}

/** 全部订阅 tid（用于星标状态 / 数量，不落本地收藏） */
export function useFeedIds(feedId: string) {
  return useQuery({
    queryKey: ['feedIds', feedId],
    queryFn: () => fetchAllFeedIds(feedId),
    enabled: !!feedId,
    staleTime: 1000 * 30,
  })
}

export function useIsInFeed(threadId: string) {
  const feedId = useFeedUuid()
  const { data: ids } = useFeedIds(feedId)
  return useMemo(
    () => !!threadId && !!ids?.includes(threadId),
    [ids, threadId],
  )
}

export function useFeedCount() {
  const feedId = useFeedUuid()
  const { data: ids } = useFeedIds(feedId)
  return ids?.length ?? 0
}

// 订阅列表 - infinite
export function useInfiniteFeed(feedId: string) {
  return useInfiniteQuery({
    queryKey: ['feed', feedId],
    queryFn: ({ pageParam }) => getFeed(feedId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _all, lastPageParam) =>
      lastPage.length > 0 ? lastPageParam + 1 : undefined,
    enabled: !!feedId,
    staleTime: 1000 * 30,
  })
}

function invalidateFeed(qc: ReturnType<typeof useQueryClient>, feedId: string) {
  void qc.invalidateQueries({ queryKey: ['feed', feedId] })
  void qc.invalidateQueries({ queryKey: ['feedIds', feedId] })
}

// 添加订阅
export function useAddFeed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ feedId, threadId }: { feedId: string; threadId: string }) =>
      apiAddFeed(feedId, threadId),
    onMutate: async ({ feedId, threadId }) => {
      await qc.cancelQueries({ queryKey: ['feedIds', feedId] })
      const prev = qc.getQueryData<string[]>(['feedIds', feedId])
      qc.setQueryData<string[]>(['feedIds', feedId], (old) =>
        old?.includes(threadId) ? old : [...(old ?? []), threadId],
      )
      return { prev }
    },
    onError: (_e, { feedId }, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(['feedIds', feedId], ctx.prev)
    },
    onSettled: (_d, _e, { feedId }) => invalidateFeed(qc, feedId),
  })
}

// 删除订阅
export function useDelFeed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ feedId, threadId }: { feedId: string; threadId: string }) =>
      apiDelFeed(feedId, threadId),
    onMutate: async ({ feedId, threadId }) => {
      await qc.cancelQueries({ queryKey: ['feedIds', feedId] })
      const prev = qc.getQueryData<string[]>(['feedIds', feedId])
      qc.setQueryData<string[]>(['feedIds', feedId], (old) =>
        (old ?? []).filter((id) => id !== threadId),
      )
      return { prev }
    },
    onError: (_e, { feedId }, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(['feedIds', feedId], ctx.prev)
    },
    onSettled: (_d, _e, { feedId }) => invalidateFeed(qc, feedId),
  })
}

/** 收藏 = 订阅 API；无 UUID 时自动生成 */
export function useToggleFeed() {
  const add = useAddFeed()
  const del = useDelFeed()
  return {
    toggle: async (threadId: string, currentlyIn: boolean) => {
      const feedId = ensureFeedUuid()
      if (currentlyIn) await del.mutateAsync({ feedId, threadId })
      else await add.mutateAsync({ feedId, threadId })
    },
    isPending: add.isPending || del.isPending,
  }
}

// 搜索
export function useSearch(keyword: string) {
  return useQuery({
    queryKey: ['search', keyword],
    queryFn: () => apiSearch(keyword),
    staleTime: 1000 * 60 * 5,
    enabled: keyword.trim().length > 0,
  })
}

// 发新串
export function usePostThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: apiPostThread,
    onSuccess: (_, { fid }) => { qc.invalidateQueries({ queryKey: ['forumThreads', fid] }) },
  })
}

// 回复
export function useReplyThread() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: apiReplyThread,
    onSuccess: (_, { resto }) => { qc.invalidateQueries({ queryKey: ['thread', resto] }) },
  })
}
