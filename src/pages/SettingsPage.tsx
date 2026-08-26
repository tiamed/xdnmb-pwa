import { useState } from 'react'
import { useSettingsStore, type ImageMode } from '../store/settings'
import { getApiBaseUrl, setApiBase, getFeed } from '../api/client'
import { Button } from '@heroui/react'
import { Sun, Moon, Monitor, RefreshCw, Trash2, PlusCircle, Check, QrCode } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import CookieQrScanner from '../components/CookieQrScanner'

export default function SettingsPage() {
  const {
    theme, setTheme, imageMode, setImageMode,
    autoLoadNext, setAutoLoadNext,
    feedUuid, setFeedUuid,
    cookies, activeCookieId,
    addCookie, updateCookie, removeCookie, setActiveCookie,
  } = useSettingsStore()
  const queryClient = useQueryClient()

  const [apiUrl, setApiUrl] = useState(getApiBaseUrl())
  const [newLabel, setNewLabel] = useState('')
  const [newHash, setNewHash] = useState('')
  const [uuidInput, setUuidInput] = useState(feedUuid)
  const [syncing, setSyncing] = useState(false)
  const [checking, setChecking] = useState(false)
  const [toast, setToast] = useState('')
  const [qrOpen, setQrOpen] = useState(false)

  const showToast = (msg: string, ms = 2000) => {
    setToast(msg)
    setTimeout(() => setToast(''), ms)
  }

  const addNewCookie = () => {
    const h = newHash.trim()
    if (!h) {
      showToast('请填写 userhash')
      return
    }
    addCookie(newLabel, h)
    setNewLabel(''); setNewHash('')
    showToast('已添加 Cookie', 1500)
  }

  const importFromQr = (payload: { cookie: string; name: string }) => {
    addCookie(payload.name, payload.cookie)
    const added = useSettingsStore.getState().cookies.find(c => c.hash === payload.cookie.trim())
    if (added) setActiveCookie(added.id)
    showToast(`已导入 ${payload.name || 'Cookie'}`, 2000)
  }

  const handleCheckUpdate = () => {
    setChecking(true)

    const timeout = setTimeout(() => {
      cleanup()
      setChecking(false)
      setToast('已是最新版本')
      setTimeout(() => setToast(''), 2000)
    }, 8000)

    const onControllerChange = () => {
      cleanup()
      setChecking(false)
      setToast('更新已就绪，即将刷新…')
      setTimeout(() => window.location.reload(), 500)
    }

    const cleanup = () => {
      clearTimeout(timeout)
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) {
        cleanup()
        setChecking(false)
        setToast('未注册 Service Worker')
        setTimeout(() => setToast(''), 2000)
        return
      }
      reg.update()
    }).catch(() => {
      cleanup()
      setChecking(false)
      setToast('检查更新失败')
      setTimeout(() => setToast(''), 2000)
    })
  }

  const handleSaveUuid = async () => {
    const uuid = uuidInput.trim()
    setFeedUuid(uuid)
    if (!uuid) {
      setToast('已清除订阅 UUID')
      setTimeout(() => setToast(''), 2000)
      return
    }

    setSyncing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: ['feed'] })
      await queryClient.invalidateQueries({ queryKey: ['feedIds'] })
      const ids = await queryClient.fetchQuery({
        queryKey: ['feedIds', uuid],
        queryFn: async () => {
          const all: string[] = []
          for (let page = 1; page <= 500; page++) {
            const items = await getFeed(uuid, page)
            if (!items.length) break
            for (const item of items) all.push(item.id)
          }
          return all
        },
      })
      setToast(`已保存，共 ${ids.length} 个订阅`)
      setTimeout(() => setToast(''), 2500)
    } catch {
      setToast('刷新失败，请检查 UUID 是否正确')
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
        <Row label="自动翻页">
          <ToggleSwitch checked={autoLoadNext} onChange={setAutoLoadNext} />
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
        <div className="px-4 py-3 border-b border-divider">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-default-700">Cookies</div>
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg text-accent hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors"
            >
              <QrCode size={14} />扫码导入
            </button>
          </div>
          <div className="space-y-2">
            {cookies.length === 0 && (
              <div className="text-xs text-muted py-2">尚未添加 Cookie，发帖/回复与受限内容将不可用。</div>
            )}
            {cookies.map((c) => {
              const active = c.id === activeCookieId
              return (
                <div key={c.id} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border ${active ? 'border-accent bg-accent-50/40 dark:bg-accent-900/10' : 'border-divider'}`}>
                  <button onClick={() => setActiveCookie(active ? null : c.id)} aria-label={active ? '取消使用' : '设为当前'}
                    className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-accent text-accent-foreground' : 'bg-default-200 dark:bg-default-700 text-transparent hover:text-default-500'}`}>
                    <Check size={12} strokeWidth={active ? 3 : 2} />
                  </button>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <input value={c.label} onChange={(e) => updateCookie(c.id, { label: e.target.value })} placeholder="备注"
                      className="text-sm font-medium text-foreground bg-transparent focus:outline-none focus:ring-1 focus:ring-accent rounded px-1 py-0.5 -mx-1 min-w-0" />
                    <input value={c.hash} onChange={(e) => updateCookie(c.id, { hash: e.target.value })} placeholder="userhash"
                      className="text-xs font-mono text-muted bg-default-100 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-accent min-w-0" />
                  </div>
                  <button onClick={() => removeCookie(c.id)} aria-label="删除" className="shrink-0 p-1 rounded-lg text-default-400 hover:text-danger hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-divider space-y-2">
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="备注（可选）"
              className="w-full text-sm px-2.5 py-1.5 rounded-lg bg-default-100 text-foreground focus:outline-none focus:ring-2 focus:ring-accent border-none" />
            <div className="flex gap-1.5">
              <input value={newHash} onChange={(e) => setNewHash(e.target.value)} placeholder="userhash"
                className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-lg bg-default-100 text-foreground focus:outline-none focus:ring-2 focus:ring-accent border-none min-w-0" />
              <Button size="sm" variant="primary" onPress={addNewCookie}>
                <PlusCircle size={14} />添加
              </Button>
            </div>
          </div>
        </div>
        <Row label="订阅 UUID">
          <div className="flex gap-1.5 w-full">
            <input type="text" value={uuidInput} onChange={e => setUuidInput(e.target.value)} placeholder="feed uuid"
              className="flex-1 px-2.5 py-1.5 text-sm rounded-lg bg-default-100 text-foreground focus:outline-none focus:ring-2 focus:ring-accent border-none min-w-0" />
            <Button size="sm" variant="primary" onPress={handleSaveUuid} isDisabled={syncing}>
              {syncing ? <RefreshCw size={14} className="animate-spin" /> : null}
              {syncing ? '刷新中…' : '保存'}
            </Button>
          </div>
        </Row>
      </Section>

      <Section title="关于">
        <Row label="版本"><span className="text-sm text-muted">1.0.0</span></Row>
        <Row label="检查更新">
          <button onClick={handleCheckUpdate} disabled={checking}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-default-100 text-default-600 hover:bg-default-200 disabled:opacity-50 transition-all">
            <RefreshCw size={12} className={checking ? 'animate-spin' : ''} />
            {checking ? '检查中…' : '检查更新'}
          </button>
        </Row>
        <Row label="GitHub">
          <a href="https://github.com/tiamed/xdnmb-pwa" target="_blank" rel="noopener noreferrer"
            className="text-sm text-accent hover:underline inline-flex items-center gap-1">
            tiamed/xdnmb-pwa
          </a>
        </Row>
      </Section>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-xl text-sm font-medium bg-foreground/95 text-background shadow-lg animate-[fadeSlideIn_.2s_ease-out] pointer-events-none">
          {toast}
        </div>
      )}

      <CookieQrScanner
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        onImport={importFromQr}
        onError={(msg) => showToast(msg)}
      />
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
      <div className="flex items-center min-w-0 flex-1 justify-end">{children}</div>
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
