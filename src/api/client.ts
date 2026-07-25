import type {
  ForumGroup,
  ForumThread,
  Thread,
  Reference,
  FeedItem,
  CdnInfo,
  Timeline,
} from '../types/api'
import { getActiveUserHash } from '../store/settings'

const API_BASE = '/api/'
const MAIN_POST = '/post/'
const CDN_BASE = ''

let apiBase = API_BASE
let mainPost = MAIN_POST
let cdnUrl = CDN_BASE

export function getImageUrl(img: string, ext: string, thumb = false): string {
  if (!img) return ''
  const path = thumb ? 'thumb' : 'image'
  if (cdnUrl) {
    return `${cdnUrl}${path}/${img}${ext}`
  }
  return `/${path}/${img}${ext}`
}

export function getApiBaseUrl(): string {
  return apiBase
}

export function setApiBase(url: string): void {
  apiBase = url
  if (!apiBase.endsWith('/')) apiBase += '/'
}

export function setCdnBase(url: string): void {
  cdnUrl = url
  if (cdnUrl && !cdnUrl.endsWith('/')) cdnUrl += '/'
}

export async function updateUrls(): Promise<void> {
  try {
    const res = await apiFetch<CdnInfo[]>('getCdnPath')
    if (Array.isArray(res) && res.length > 0 && res[0].url) {
      cdnUrl = res[0].url
      if (!cdnUrl.endsWith('/')) cdnUrl += '/'
    }
  } catch {
    // 忽略错误
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${apiBase}${path}`

  const userHash = getActiveUserHash()
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  }
  if (userHash) {
    // 浏览器禁止 fetch 设置 Cookie 头，改用自定义头，由代理层翻译为上游 Cookie
    headers['X-Userhash'] = userHash
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'same-origin',
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }

  const data = await res.json()

  if (typeof data === 'string') {
    throw new Error(data)
  }
  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(data.error)
  }

  return data as T
}

export async function getForumList(): Promise<ForumGroup[]> {
  return apiFetch<ForumGroup[]>('getForumList')
}

export async function getTimelineList(): Promise<Timeline[]> {
  return apiFetch<Timeline[]>('getTimelineList')
}

export async function getForumThreads(
  forumId: string,
  page = 1,
): Promise<ForumThread[]> {
  return apiFetch<ForumThread[]>(`showf?id=${forumId}&page=${page}`)
}

export async function getTimelineThreads(
  timelineId: string,
  page = 1,
): Promise<ForumThread[]> {
  return apiFetch<ForumThread[]>(`timeline?id=${timelineId}&page=${page}`)
}

export async function getThread(
  threadId: string,
  page = 1,
): Promise<Thread> {
  return apiFetch<Thread>(`thread?id=${threadId}&page=${page}`)
}

export async function getThreadPo(
  threadId: string,
  page = 1,
): Promise<Thread> {
  return apiFetch<Thread>(`po?id=${threadId}&page=${page}`)
}

export async function getReference(postId: string): Promise<Reference> {
  return apiFetch<Reference>(`ref?id=${postId}`)
}

export async function getFeed(feedId: string, page = 1): Promise<FeedItem[]> {
  return apiFetch<FeedItem[]>(`feed?uuid=${feedId}&page=${page}`)
}

export async function addFeed(feedId: string, threadId: string): Promise<void> {
  // 见 https://github.com/orzogc/xdnmb_api — 成功响应为含「订阅大成功」的 JSON 字符串
  await feedMutate(`addFeed?uuid=${encodeURIComponent(feedId)}&tid=${encodeURIComponent(threadId)}`, '订阅大成功')
}

export async function delFeed(feedId: string, threadId: string): Promise<void> {
  await feedMutate(`delFeed?uuid=${encodeURIComponent(feedId)}&tid=${encodeURIComponent(threadId)}`, '取消订阅成功')
}

async function feedMutate(path: string, successHint: string): Promise<void> {
  const url = `${apiBase}${path}`
  const userHash = getActiveUserHash()
  const headers: Record<string, string> = {}
  if (userHash) headers['X-Userhash'] = userHash

  const res = await fetch(url, { headers, credentials: 'same-origin' })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)

  const data = await res.json()
  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(String((data as { error: unknown }).error))
  }
  const text = typeof data === 'string' ? data : JSON.stringify(data ?? '')
  if (!text.includes(successHint)) {
    throw new Error(text || '订阅操作失败')
  }
}

export async function search(keyword: string): Promise<ForumThread[]> {
  return apiFetch<ForumThread[]>(`search?q=${encodeURIComponent(keyword)}`)
}

export async function postThread(params: {
  fid: string
  content: string
  title?: string
  name?: string
  email?: string
  image?: File
  watermark?: boolean
}): Promise<void> {
  const formData = new FormData()
  formData.append('fid', params.fid)
  formData.append('content', params.content)
  if (params.title) formData.append('title', params.title)
  if (params.name) formData.append('name', params.name)
  if (params.email) formData.append('email', params.email)
  if (params.image) formData.append('image', params.image)
  if (params.watermark) formData.append('water', 'true')

  const userHash = getActiveUserHash()
  const headers: Record<string, string> = {}
  if (userHash) {
    headers['X-Userhash'] = userHash
    formData.append('hash', userHash)
  }

  const res = await fetch(`${mainPost}Home/Forum/doPostThread.html`, {
    method: 'POST',
    body: formData,
    headers,
    credentials: 'same-origin',
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  const text = await res.text()
  if (text.includes('class="error"')) {
    const match = text.match(/class="error"[^>]*>([^<]+)</)
    throw new Error(match ? match[1] : '发帖失败')
  }
}

export async function replyThread(params: {
  resto: string
  content: string
  title?: string
  name?: string
  email?: string
  image?: File
  watermark?: boolean
}): Promise<void> {
  const formData = new FormData()
  formData.append('resto', params.resto)
  formData.append('content', params.content)
  if (params.title) formData.append('title', params.title)
  if (params.name) formData.append('name', params.name)
  if (params.email) formData.append('email', params.email)
  if (params.image) formData.append('image', params.image)
  if (params.watermark) formData.append('water', 'true')

  const userHash = getActiveUserHash()
  const headers: Record<string, string> = {}
  if (userHash) {
    headers['X-Userhash'] = userHash
    formData.append('hash', userHash)
  }

  const res = await fetch(`${mainPost}Home/Forum/doReplyThread.html`, {
    method: 'POST',
    body: formData,
    headers,
    credentials: 'same-origin',
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  const text = await res.text()
  if (text.includes('class="error"')) {
    const match = text.match(/class="error"[^>]*>([^<]+)</)
    throw new Error(match ? match[1] : '回复失败')
  }
}
