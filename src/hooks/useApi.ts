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

// 串详情 - infinite replies
export function useInfiniteThread(threadId: string) {
  return useInfiniteQuery({
    queryKey: ['thread', threadId],
    queryFn: ({ pageParam }) => getThread(threadId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _all, lastPageParam) => {
      const total = Number(lastPage?.ReplyCount || 0)
      const loaded = (_all || []).reduce((s, p) => s + (p?.Replies?.length || 0), 0)
      return loaded < total ? lastPageParam + 1 : undefined
    },
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

// 添加订阅
export function useAddFeed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ feedId, threadId }: { feedId: string; threadId: string }) => apiAddFeed(feedId, threadId),
    onSuccess: (_, { feedId }) => { qc.invalidateQueries({ queryKey: ['feed', feedId] }) },
  })
}

// 删除订阅
export function useDelFeed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ feedId, threadId }: { feedId: string; threadId: string }) => apiDelFeed(feedId, threadId),
    onSuccess: (_, { feedId }) => { qc.invalidateQueries({ queryKey: ['feed', feedId] }) },
  })
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
