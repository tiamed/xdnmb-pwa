import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ImageMode = 'default' | 'hidden' | 'blur'
export type ReplySort = 'asc' | 'desc'

export interface UserCookie {
  id: string
  label: string
  hash: string
}

interface SettingsState {
  theme: ThemeMode
  imageMode: ImageMode
  replySort: ReplySort
  autoLoadNext: boolean
  showSpoiler: boolean
  feedUuid: string
  /** 首页时间线 id；空则用列表第一项 */
  homeTimelineId: string
  cookies: UserCookie[]
  activeCookieId: string | null
  setTheme: (theme: ThemeMode) => void
  setImageMode: (mode: ImageMode) => void
  setReplySort: (sort: ReplySort) => void
  setAutoLoadNext: (v: boolean) => void
  setShowSpoiler: (v: boolean) => void
  setFeedUuid: (uuid: string) => void
  setHomeTimelineId: (id: string) => void
  addCookie: (label: string, hash: string) => void
  updateCookie: (id: string, patch: Partial<Omit<UserCookie, 'id'>>) => void
  removeCookie: (id: string) => void
  setActiveCookie: (id: string | null) => void
  applyTheme: () => void
}

const genId = () => Math.random().toString(36).slice(2, 10)

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      imageMode: 'default',
      replySort: 'asc',
      autoLoadNext: true,
      showSpoiler: false,
      feedUuid: '',
      homeTimelineId: '',
      cookies: [],
      activeCookieId: null,

      setTheme: (theme) => {
        set({ theme })
        get().applyTheme()
      },
      setImageMode: (imageMode) => set({ imageMode }),
      setReplySort: (replySort) => set({ replySort }),
      setAutoLoadNext: (autoLoadNext) => set({ autoLoadNext }),
      setShowSpoiler: (showSpoiler) => set({ showSpoiler }),
      setFeedUuid: (feedUuid) => set({ feedUuid }),
      setHomeTimelineId: (homeTimelineId) => set({ homeTimelineId }),

      addCookie: (label, hash) => set((s) => {
        const c: UserCookie = {
          id: genId(),
          label: (label || '').trim() || `Cookie ${s.cookies.length + 1}`,
          hash: (hash || '').trim(),
        }
        const cookies = [...s.cookies, c]
        return { cookies, activeCookieId: s.activeCookieId ?? c.id }
      }),
      updateCookie: (id, patch) => set((s) => ({
        cookies: s.cookies.map((c) => (c.id === id ? { ...c, ...patch, hash: patch.hash !== undefined ? patch.hash.trim() : c.hash } : c)),
      })),
      removeCookie: (id) => set((s) => {
        const cookies = s.cookies.filter((c) => c.id !== id)
        const activeCookieId = s.activeCookieId === id ? (cookies[0]?.id ?? null) : s.activeCookieId
        return { cookies, activeCookieId }
      }),
      setActiveCookie: (activeCookieId) => set({ activeCookieId }),

      applyTheme: () => {
        const { theme } = get()
        const isDark =
          theme === 'dark' ||
          (theme === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.classList.toggle('dark', isDark)
        const meta = document.querySelector('meta[name="theme-color"]')
        if (meta) meta.setAttribute('content', isDark ? '#16171d' : '#f5f5f5')
      },
    }),
    {
      name: 'nmb-settings',
      version: 2,
      partialize: (state) => ({
        theme: state.theme,
        imageMode: state.imageMode,
        replySort: state.replySort,
        autoLoadNext: state.autoLoadNext,
        showSpoiler: state.showSpoiler,
        feedUuid: state.feedUuid,
        homeTimelineId: state.homeTimelineId,
        cookies: state.cookies,
        activeCookieId: state.activeCookieId,
      }),
      migrate: (persisted: any, version: number) => {
        if (!persisted) return {}
        if (version < 2 && typeof persisted.userHash === 'string' && persisted.userHash.trim()) {
          const c: UserCookie = { id: genId(), label: '默认', hash: persisted.userHash.trim() }
          return { ...persisted, cookies: [c], activeCookieId: c.id, userHash: undefined }
        }
        return persisted
      },
    },
  ),
)

export function getActiveUserHash(): string {
  const s = useSettingsStore.getState()
  if (!s.activeCookieId) return ''
  const c = s.cookies.find((c) => c.id === s.activeCookieId)
  return c?.hash ?? ''
}

export function getFeedUuid(): string {
  return useSettingsStore.getState().feedUuid.trim()
}

/** 若尚未设置订阅 UUID，则生成并持久化 */
export function ensureFeedUuid(): string {
  const existing = getFeedUuid()
  if (existing) return existing
  const uuid = crypto.randomUUID()
  useSettingsStore.getState().setFeedUuid(uuid)
  return uuid
}