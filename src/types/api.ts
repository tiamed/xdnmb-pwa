// API 类型定义

export interface Forum {
  id: string
  fgroup: string
  sort: string
  name: string
  showName: string
  msg: string
  interval: string
  thread_count: string
  status: string
  safe_mode?: string
  auto_delete?: string
  permission_level?: string
}

export interface ForumGroup {
  id: string
  sort: string
  name: string
  status: string
  forums: Forum[]
}

export interface Post {
  id: string
  fid?: string
  ReplyCount?: string
  img: string
  ext: string
  now: string
  user_hash: string
  name: string
  title: string
  content: string
  sage: number
  admin: number
  Hide: number
}

export interface ForumThread extends Post {
  Replies: Post[]
  RemainReplies?: number
}

export interface Thread {
  id: string
  fid: string
  ReplyCount: string
  img: string
  ext: string
  now: string
  user_hash: string
  name: string
  title: string
  content: string
  sage: number
  admin: number
  Hide: number
  Replies: Post[]
  tip?: Post
}

export interface Reference {
  id: string
  img: string
  ext: string
  now: string
  user_hash: string
  name: string
  title: string
  content: string
  sage: number
  status: string
  admin: number
}

export interface FeedItem {
  id: string
  user_id: string
  fid: string
  reply_count: string
  recent_replies: string
  category: string
  file_id: string
  img: string
  ext: string
  now: string
  user_hash: string
  name: string
  email: string
  title: string
  content: string
  status: string
  admin: string
  hide: string
  po: string
}

export interface Timeline {
  id: string
  name: string
  displayName?: string
  msg?: string
}

export interface CdnInfo {
  url: string
  rate: number
}

export interface SearchResult {
  id: string
  fid: string
  title: string
  content: string
  user_hash: string
  now: string
  img: string
  ext: string
}
