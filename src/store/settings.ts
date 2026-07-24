import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ImageMode = 'default' | 'hidden' | 'blur'
export type ReplySort = 'asc' | 'desc'

interface SettingsState {
  theme: ThemeMode
  imageMode: ImageMode
  replySort: ReplySort
  autoLoadNext: boolean
  showSpoiler: boolean
  fontSize: number
  feedUuid: string
  userHash: string
  setTheme: (theme: ThemeMode) => void
  setImageMode: (mode: ImageMode) => void
  setReplySort: (sort: ReplySort) => void
  setAutoLoadNext: (v: boolean) => void
  setShowSpoiler: (v: boolean) => void
  setFontSize: (size: number) => void
  setFeedUuid: (uuid: string) => void
  setUserHash: (hash: string) => void
  applyTheme: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      imageMode: 'default',
      replySort: 'asc',
      autoLoadNext: true,
      showSpoiler: false,
      fontSize: 16,
      feedUuid: '',
      userHash: '',

      setTheme: (theme) => {
        set({ theme })
        get().applyTheme()
      },
      setImageMode: (imageMode) => set({ imageMode }),
      setReplySort: (replySort) => set({ replySort }),
      setAutoLoadNext: (autoLoadNext) => set({ autoLoadNext }),
      setShowSpoiler: (showSpoiler) => set({ showSpoiler }),
      setFontSize: (fontSize) => set({ fontSize }),
      setFeedUuid: (feedUuid) => set({ feedUuid }),
      setUserHash: (userHash) => set({ userHash }),

      applyTheme: () => {
        const { theme } = get()
        const isDark =
          theme === 'dark' ||
          (theme === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.classList.toggle('dark', isDark)
      },
    }),
    {
      name: 'nmb-settings',
      partialize: (state) => ({
        theme: state.theme,
        imageMode: state.imageMode,
        replySort: state.replySort,
        autoLoadNext: state.autoLoadNext,
        showSpoiler: state.showSpoiler,
        fontSize: state.fontSize,
        feedUuid: state.feedUuid,
        userHash: state.userHash,
      }),
    },
  ),
)
