import { useState } from 'react'
import { useSettingsStore, type ImageMode, type ReplySort } from '../store/settings'
import { getApiBaseUrl, setApiBase, getFeed } from '../api/client'
import { useFavoritesStore } from '../store/favorites'
import { Button } from '@heroui/react'
import { Sun, Moon, Monitor, Minus, Plus, RefreshCw } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useQueryClient } from '@tanstack/react-query'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const {
    imageMode, setImageMode, replySort, setReplySort,
    autoLoadNext, setAutoLoadNext, fontSize, setFontSize,
    feedUuid, setFeedUuid, userHash, setUserHash,
  } = useSettingsStore()
  const { syncFromFeed } = useFavoritesStore()
  const queryClient = useQueryClient()

  const [apiUrl, setApiUrl] = useState(getApiBaseUrl())
  const [hashInput, setHashInput] = useState(userHash)
  const [uuidInput, setUuidInput] = useState(feedUuid)
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState('')

  const handleSaveUuid = async () => {
    const uuid = uuidInput.trim()
    setFeedUuid(uuid)
    if (!uuid) return

    setSyncing(true)
    try {
      const data = await queryClient.fetchInfiniteQuery({
        queryKey: ['feed', uuid],
        queryFn: ({ pageParam }) => getFeed(uuid, pageParam),
        initialPageParam: 1,
        pages: 9999,
        getNextPageParam: (lastPage, _all, lastPageParam) =>
          lastPage.length > 0 ? lastPageParam + 1 : undefined,
      })
      const allItems = data.pages.flat()
      for (const item of allItems) {
        syncFromFeed({
          id: item.id, title: item.title || '无标题', forumName: '',
          forumId: item.fid, preview: item.content,
          img: item.img, ext: item.ext, replyCount: Number(item.reply_count || 0),
        })
      }
      setToast(`已同步 ${allItems.length} 个订阅`)
      setTimeout(() => setToast(''), 2500)
    } catch {
      setToast('同步失败，请检查 UUID 是否正确')
      setTimeout(() => setToast(''), 2500)
    } finally {
      setSyncing(false)
    }
  }

  const themeOptions = [
    { value: 'light', icon: Sun },
    { value: 'dark', icon: Moon },
    { value: 'system', icon: Monitor },
  ] as const

  return (
    <div className="min-h-full page-enter pb-8">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-divider px-3 py-2.5">
        <h2 className="text-base font-semibold text-foreground">设置</h2>
      </div>

      <Section title="外观">
        <Row label="主题">
          <div className="flex gap-1">
            {themeOptions.map(({ value, icon: Icon }) => (
              <button key={value} onClick={() => setTheme(value)}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-all ${
                  (theme || 'system') === value ? 'bg-accent text-accent-foreground' : 'bg-default-100 text-default-600 hover:bg-default-200'
                }`}>
                <Icon size={14} />{value === 'light' ? '浅色' : value === 'dark' ? '深色' : '系统'}
              </button>
            ))}
          </div>
        </Row>
        <Row label="图片">
          <select value={imageMode} onChange={e => setImageMode(e.target.value as ImageMode)}
            className="px-2.5 py-1.5 text-sm rounded-lg bg-default-100 text-foreground border-none focus:ring-2 focus:ring-accent outline-none">
            <option value="default">正常</option><option value="blur">模糊</option><option value="hidden">不显示</option>
          </select>
        </Row>
        <Row label="字号">
          <div className="flex items-center gap-2">
            <button onClick={() => setFontSize(Math.max(12, fontSize - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-default-100 hover:bg-default-200 text-default-600 active:scale-90"><Minus size={13} /></button>
            <span className="w-8 text-center text-sm font-medium">{fontSize}</span>
            <button onClick={() => setFontSize(Math.min(24, fontSize + 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-default-100 hover:bg-default-200 text-default-600 active:scale-90"><Plus size={13} /></button>
          </div>
        </Row>
        <Row label="自动翻页">
          <ToggleSwitch checked={autoLoadNext} onChange={setAutoLoadNext} />
        </Row>
        <Row label="回复排序">
          <select value={replySort} onChange={e => setReplySort(e.target.value as ReplySort)}
            className="px-2.5 py-1.5 text-sm rounded-lg bg-default-100 text-foreground border-none focus:ring-2 focus:ring-accent outline-none">
            <option value="asc">正序</option><option value="desc">倒序</option>
          </select>
        </Row>
      </Section>

      <Section title="网络">
        <Row label="API 地址">
          <div className="flex gap-1.5 w-full">
            <input type="text" value={apiUrl} onChange={e => setApiUrl(e.target.value)}
              className="flex-1 px-2.5 py-1.5 text-sm rounded-lg bg-default-100 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-accent border-none min-w-0" />
            <Button size="sm" variant="primary" onPress={() => setApiBase(apiUrl)}>保存</Button>
          </div>
        </Row>
      </Section>

      <Section title="账户">
        <Row label="Cookies">
          <div className="flex gap-1.5 w-full">
            <input type="text" value={hashInput} onChange={e => setHashInput(e.target.value)} placeholder="userhash"
              className="flex-1 px-2.5 py-1.5 text-sm rounded-lg bg-default-100 text-foreground focus:outline-none focus:ring-2 focus:ring-accent border-none min-w-0" />
            <Button size="sm" variant="primary" onPress={() => setUserHash(hashInput.trim())}>保存</Button>
          </div>
        </Row>
        <Row label="订阅 UUID">
          <div className="flex gap-1.5 w-full">
            <input type="text" value={uuidInput} onChange={e => setUuidInput(e.target.value)} placeholder="feed uuid"
              className="flex-1 px-2.5 py-1.5 text-sm rounded-lg bg-default-100 text-foreground focus:outline-none focus:ring-2 focus:ring-accent border-none min-w-0" />
            <Button size="sm" variant="primary" onPress={handleSaveUuid} isDisabled={syncing}>
              {syncing ? <RefreshCw size={14} className="animate-spin" /> : null}
              {syncing ? '同步中…' : '同步'}
            </Button>
          </div>
        </Row>
      </Section>

      <Section title="关于">
        <Row label="版本"><span className="text-sm text-muted">1.0.0</span></Row>
        <Row label="技术栈"><span className="text-sm text-muted">React + Vite + HeroUI + PWA</span></Row>
      </Section>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-xl text-sm font-medium text-white bg-default-900/90 dark:bg-default-100/90 dark:text-default-900 animate-[fadeSlideIn_.2s_ease-out] shadow-lg pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="px-4 py-1.5 text-xs font-semibold text-muted uppercase tracking-wider bg-default-50 dark:bg-default-50/20">{title}</div>
      <div>{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-divider gap-3">
      <span className="text-sm text-default-700 shrink-0">{label}</span>
      <div className="flex items-center shrink-0">{children}</div>
    </div>
  )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-accent' : 'bg-default-300 dark:bg-default-600'}`}>
      <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all absolute top-0.5 ${checked ? 'right-0.5' : 'left-0.5'}`}
        style={{ transform: checked ? 'translateX(0)' : 'translateX(0)' }} />
    </button>
  )
}
