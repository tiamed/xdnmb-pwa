import { useState } from 'react'
import { useSettingsStore, type ImageMode, type ReplySort } from '../store/settings'
import { getApiBaseUrl, setApiBase } from '../api/client'
import { Sun, Moon, Monitor, Minus, Plus } from 'lucide-react'

export default function SettingsPage() {
  const {
    theme, setTheme, imageMode, setImageMode, replySort, setReplySort,
    autoLoadNext, setAutoLoadNext, fontSize, setFontSize,
    feedUuid, setFeedUuid, userHash, setUserHash,
  } = useSettingsStore()

  const [apiUrl, setApiUrl] = useState(getApiBaseUrl())
  const [hashInput, setHashInput] = useState(userHash)
  const [uuidInput, setUuidInput] = useState(feedUuid)

  return (
    <div className="min-h-full page-enter pb-8">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-divider px-3 py-2.5">
        <h2 className="text-base font-semibold text-default-900">设置</h2>
      </div>

      <Section title="外观">
        <Row label="主题">
          <div className="flex gap-1">
            <ThemeBtn icon={<Sun size={15} />} active={theme === 'light'} onClick={() => setTheme('light')} label="浅色" />
            <ThemeBtn icon={<Moon size={15} />} active={theme === 'dark'} onClick={() => setTheme('dark')} label="深色" />
            <ThemeBtn icon={<Monitor size={15} />} active={theme === 'system'} onClick={() => setTheme('system')} label="系统" />
          </div>
        </Row>
        <Row label="图片">
          <select value={imageMode} onChange={e => setImageMode(e.target.value as ImageMode)}
            className="px-2.5 py-1.5 text-sm rounded-lg bg-default-100 text-default-900 border-none focus:ring-2 focus:ring-primary">
            <option value="default">正常</option><option value="blur">模糊</option><option value="hidden">不显示</option>
          </select>
        </Row>
        <Row label="字号">
          <div className="flex items-center gap-2">
            <button onClick={() => setFontSize(Math.max(12, fontSize - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-default-100 hover:bg-default-200 text-default-600"><Minus size={13} /></button>
            <span className="w-8 text-center text-sm font-medium">{fontSize}</span>
            <button onClick={() => setFontSize(Math.min(24, fontSize + 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-default-100 hover:bg-default-200 text-default-600"><Plus size={13} /></button>
          </div>
        </Row>
        <Row label="自动翻页">
          <Toggle checked={autoLoadNext} onChange={setAutoLoadNext} />
        </Row>
        <Row label="回复排序">
          <select value={replySort} onChange={e => setReplySort(e.target.value as ReplySort)}
            className="px-2.5 py-1.5 text-sm rounded-lg bg-default-100 text-default-900 border-none focus:ring-2 focus:ring-primary">
            <option value="asc">正序</option><option value="desc">倒序</option>
          </select>
        </Row>
      </Section>

      <Section title="网络">
        <Row label="API 地址">
          <div className="flex gap-1.5">
            <input type="text" value={apiUrl} onChange={e => setApiUrl(e.target.value)}
              className="flex-1 px-2.5 py-1.5 text-sm rounded-lg bg-default-100 text-default-900 font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={() => setApiBase(apiUrl)} className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-600">保存</button>
          </div>
        </Row>
      </Section>

      <Section title="账户">
        <Row label="Cookies">
          <div className="flex-1 flex gap-1.5">
            <input type="text" value={hashInput} onChange={e => setHashInput(e.target.value)} placeholder="userhash"
              className="flex-1 px-2.5 py-1.5 text-sm rounded-lg bg-default-100 text-default-900 focus:outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={() => setUserHash(hashInput.trim())} className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-600">保存</button>
          </div>
        </Row>
        <p className="px-4 pb-2 text-xs text-default-400">用于发帖和查看需要权限的内容</p>

        <Row label="订阅 UUID">
          <div className="flex-1 flex gap-1.5">
            <input type="text" value={uuidInput} onChange={e => setUuidInput(e.target.value)} placeholder="feed uuid"
              className="flex-1 px-2.5 py-1.5 text-sm rounded-lg bg-default-100 text-default-900 focus:outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={() => setFeedUuid(uuidInput.trim())} className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-600">保存</button>
          </div>
        </Row>
      </Section>

      <Section title="关于">
        <Row label="版本"><span className="text-sm text-default-500">1.0.0</span></Row>
        <Row label="技术栈"><span className="text-sm text-default-500">React + Vite + HeroUI + PWA</span></Row>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="px-4 py-2 text-xs font-semibold text-default-400 uppercase tracking-wider bg-default-50 dark:bg-default-50/20">{title}</div>
      <div>{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-divider gap-3">
      <span className="text-sm text-default-700 shrink-0">{label}</span>
      <div className="flex items-center">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-default-300 dark:bg-default-600'}`}>
      <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform absolute top-0.5 ${checked ? 'translate-x-5.5 left-0' : 'left-0.5'}`} style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }} />
    </button>
  )
}

function ThemeBtn({ icon, active, onClick, label }: { icon: React.ReactNode; active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${active ? 'bg-primary text-white' : 'bg-default-100 text-default-600 hover:bg-default-200'}`}>
      {icon}{label}
    </button>
  )
}
