import type {
  ForumGroup,
  ForumThread,
  Thread,
  Reference,
  FeedItem,
  CdnInfo,
  Timeline,
} from '../types/api'

const DEFAULT_BASE_URL = 'https://www.nmbxd1.com'
const DEFAULT_CDN_URL = 'https://image.nmb.best/'

let baseUrl = DEFAULT_BASE_URL
let cdnUrl = DEFAULT_CDN_URL
let backupApiUrl = 'https://api.nmb.best/'
let useBackup = false

function getApiBase(): string {
  return useBackup ? backupApiUrl : baseUrl
}

function getApiUrl(path: string): string {
  return `${getApiBase()}${path.startsWith('/') ? path : '/' + path}`
}

export function getImageUrl(img: string, ext: string, thumb = false): string {
  if (!img) return ''
  const path = thumb ? 'thumb/' : 'image/'
  return `${cdnUrl}${path}${img}${ext}`
}

export async function updateUrls(): Promise<void> {
  try {
    // 获取 CDN 路径
    const cdnRes = await fetch(getApiUrl('Api/getCdnPath'))
    if (cdnRes.ok) {
      const cdns: CdnInfo[] = await cdnRes.json()
      if (cdns.length > 0) {
        cdnUrl = cdns[0].url
        if (!cdnUrl.endsWith('/')) cdnUrl += '/'
      }
    }
  } catch {
    // 忽略错误，使用默认值
  }

  try {
    // 获取备用 API
    const backupRes = await fetch(getApiUrl('Api/backupUrl'))
    if (backupRes.ok) {
      const backups: string[] = await backupRes.json()
      if (backups.length > 0) {
        backupApiUrl = backups[0]
        if (!backupApiUrl.endsWith('/')) backupApiUrl += '/'
      }
    }
  } catch {
    // 忽略错误
  }
}

export function setUseBackup(use: boolean): void {
  useBackup = use
}

export function isUseBackup(): boolean {
  return useBackup
}

function getUserHash(): string | null {
  return localStorage.getItem('nmb_userhash')
}

export function setUserHash(hash: string | null): void {
  if (hash) {
    localStorage.setItem('nmb_userhash', hash)
  } else {
    localStorage.removeItem('nmb_userhash')
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = getApiUrl(path)
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  }

  const userHash = getUserHash()
  if (userHash) {
    headers['Cookie'] = `userhash=${userHash}`
    // 某些浏览器下 fetch 不能直接设置 Cookie header，用 credentials: 'include'
    // 但跨域情况下需要服务端允许，这里尽量兼顾
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }

  const data = await res.json()

  // 错误检测
  if (typeof data === 'string') {
    throw new Error(data)
  }
  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(data.error)
  }

  return data as T
}

// 获取版块列表
export async function getForumList(): Promise<ForumGroup[]> {
  return apiFetch<ForumGroup[]>('Api/getForumList')
}

// 获取时间线列表
export async function getTimelineList(): Promise<Timeline[]> {
  return apiFetch<Timeline[]>('Api/getTimelineList')
}

// 获取版块串列表
export async function getForumThreads(
  forumId: string,
  page = 1,
): Promise<ForumThread[]> {
  return apiFetch<ForumThread[]>(`Api/showf?id=${forumId}&page=${page}`)
}

// 获取时间线串列表
export async function getTimelineThreads(
  timelineId: string,
  page = 1,
): Promise<ForumThread[]> {
  return apiFetch<ForumThread[]>(`Api/timeline?id=${timelineId}&page=${page}`)
}

// 获取串详情
export async function getThread(
  threadId: string,
  page = 1,
): Promise<Thread> {
  return apiFetch<Thread>(`Api/thread?id=${threadId}&page=${page}`)
}

// 只看 PO
export async function getThreadPo(
  threadId: string,
  page = 1,
): Promise<Thread> {
  return apiFetch<Thread>(`Api/po?id=${threadId}&page=${page}`)
}

// 获取引用
export async function getReference(postId: string): Promise<Reference> {
  return apiFetch<Reference>(`Api/ref?id=${postId}`)
}

// 获取订阅列表
export async function getFeed(feedId: string, page = 1): Promise<FeedItem[]> {
  return apiFetch<FeedItem[]>(`Api/feed?uuid=${feedId}&page=${page}`)
}

// 添加订阅
export async function addFeed(feedId: string, threadId: string): Promise<void> {
  await apiFetch(`Api/addFeed?uuid=${feedId}&tid=${threadId}`)
}

// 删除订阅
export async function delFeed(feedId: string, threadId: string): Promise<void> {
  await apiFetch(`Api/delFeed?uuid=${feedId}&tid=${threadId}`)
}

// 搜索
export async function search(keyword: string): Promise<ForumThread[]> {
  return apiFetch<ForumThread[]>(`Api/search?q=${encodeURIComponent(keyword)}`)
}

// 发新串
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

  const res = await fetch(`${baseUrl}/Home/Forum/doPostThread.html`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  // 检查返回页面是否包含错误信息
  const text = await res.text()
  if (text.includes('class="error"')) {
    const match = text.match(/class="error"[^>]*>([^<]+)</)
    throw new Error(match ? match[1] : '发帖失败')
  }
}

// 回复串
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

  const res = await fetch(`${baseUrl}/Home/Forum/doReplyThread.html`, {
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
