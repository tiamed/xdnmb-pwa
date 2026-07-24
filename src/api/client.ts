import type {
  ForumGroup,
  ForumThread,
  Thread,
  Reference,
  FeedItem,
  CdnInfo,
  Timeline,
} from '../types/api'

const API_BASE = 'https://api.nmb.best/api/'
const MAIN_SITE = 'https://www.nmbxd1.com'
const CDN_BASE = 'https://image.nmb.best/'

let apiBase = API_BASE
let mainUrl = MAIN_SITE
let cdnUrl = CDN_BASE

export function getImageUrl(img: string, ext: string, thumb = false): string {
  if (!img) return ''
  const path = thumb ? 'thumb/' : 'image/'
  return `${cdnUrl}${path}${img}${ext}`
}

export async function updateUrls(): Promise<void> {
  try {
    const cdnRes = await fetch(`${apiBase}getCdnPath`)
    if (cdnRes.ok) {
      const cdns: CdnInfo[] = await cdnRes.json()
      if (cdns.length > 0 && cdns[0].url) {
        cdnUrl = cdns[0].url
        if (!cdnUrl.endsWith('/')) cdnUrl += '/'
      }
    }
  } catch {
    // 忽略错误
  }
}

export function getApiBaseUrl(): string {
  return apiBase
}

export function setApiBase(url: string): void {
  apiBase = url
  if (!apiBase.endsWith('/')) apiBase += '/'
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${apiBase}${path}`

  const userHash = localStorage.getItem('nmb_userhash')
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  }
  if (userHash) {
    headers['Cookie'] = `userhash=${userHash}`
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'omit',
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
  await apiFetch(`addFeed?uuid=${feedId}&tid=${threadId}`)
}

export async function delFeed(feedId: string, threadId: string): Promise<void> {
  await apiFetch(`delFeed?uuid=${feedId}&tid=${threadId}`)
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

  const res = await fetch(`${mainUrl}/Home/Forum/doPostThread.html`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
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

  const res = await fetch(`${mainUrl}/Home/Forum/doReplyThread.html`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
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
