import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
    staleTime: 1000 * 60 * 60, // 1小时缓存
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

// 版块串列表
export function useForumThreads(forumId: string, page = 1) {
  return useQuery({
    queryKey: ['forumThreads', forumId, page],
    queryFn: () => getForumThreads(forumId, page),
    staleTime: 1000 * 30, // 30秒
    enabled: !!forumId,
  })
}

// 时间线串列表
export function useTimelineThreads(timelineId: string, page = 1) {
  return useQuery({
    queryKey: ['timelineThreads', timelineId, page],
    queryFn: () => getTimelineThreads(timelineId, page),
    staleTime: 1000 * 30,
    enabled: !!timelineId,
  })
}

// 串详情
export function useThread(threadId: string, page = 1) {
  return useQuery({
    queryKey: ['thread', threadId, page],
    queryFn: () => getThread(threadId, page),
    staleTime: 1000 * 15,
    enabled: !!threadId,
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

// 订阅列表
export function useFeed(feedId: string, page = 1) {
  return useQuery({
    queryKey: ['feed', feedId, page],
    queryFn: () => getFeed(feedId, page),
    staleTime: 1000 * 30,
    enabled: !!feedId,
  })
}

// 添加订阅
export function useAddFeed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ feedId, threadId }: { feedId: string; threadId: string }) =>
      apiAddFeed(feedId, threadId),
    onSuccess: (_, { feedId }) => {
      queryClient.invalidateQueries({ queryKey: ['feed', feedId] })
    },
  })
}

// 删除订阅
export function useDelFeed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ feedId, threadId }: { feedId: string; threadId: string }) =>
      apiDelFeed(feedId, threadId),
    onSuccess: (_, { feedId }) => {
      queryClient.invalidateQueries({ queryKey: ['feed', feedId] })
    },
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
  return useMutation({
    mutationFn: apiPostThread,
  })
}

// 回复
export function useReplyThread() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiReplyThread,
    onSuccess: (_, { resto }) => {
      queryClient.invalidateQueries({ queryKey: ['thread', resto] })
    },
  })
}
