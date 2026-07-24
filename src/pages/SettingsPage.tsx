import { useState } from 'react'
import { useSettingsStore, type ThemeMode, type ImageMode, type ReplySort } from '../store/settings'
import { setUseBackup, isUseBackup } from '../api/client'

export default function SettingsPage() {
  const {
    theme,
    setTheme,
    imageMode,
    setImageMode,
    replySort,
    setReplySort,
    autoLoadNext,
    setAutoLoadNext,
    fontSize,
    setFontSize,
    feedUuid,
    setFeedUuid,
    userHash,
    setUserHash,
  } = useSettingsStore()

  const [backupEnabled, setBackupEnabled] = useState(isUseBackup())
  const [hashInput, setHashInput] = useState(userHash)
  const [uuidInput, setUuidInput] = useState(feedUuid)

  const toggleBackup = () => {
    const newVal = !backupEnabled
    setBackupEnabled(newVal)
    setUseBackup(newVal)
  }

  return (
    <div className="min-h-full">
      {/* 外观设置 */}
      <Section title="外观">
        <Row label="主题">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeMode)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="system">跟随系统</option>
            <option value="light">浅色</option>
            <option value="dark">深色</option>
          </select>
        </Row>

        <Row label="图片显示">
          <select
            value={imageMode}
            onChange={(e) => setImageMode(e.target.value as ImageMode)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="default">正常显示</option>
            <option value="blur">模糊（点击显示）</option>
            <option value="hidden">不显示</option>
          </select>
        </Row>

        <Row label="字体大小">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFontSize(Math.max(12, fontSize - 1))}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300"
            >
              -
            </button>
            <span className="w-10 text-center text-sm">{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(24, fontSize + 1))}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300"
            >
              +
            </button>
          </div>
        </Row>

        <Row label="自动加载下一页">
          <Toggle checked={autoLoadNext} onChange={setAutoLoadNext} />
        </Row>

        <Row label="回复排序">
          <select
            value={replySort}
            onChange={(e) => setReplySort(e.target.value as ReplySort)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="asc">正序</option>
            <option value="desc">倒序</option>
          </select>
        </Row>
      </Section>

      {/* 网络设置 */}
      <Section title="网络">
        <Row label="使用备用API">
          <Toggle checked={backupEnabled} onChange={toggleBackup} />
        </Row>
      </Section>

      {/* 账户 */}
      <Section title="账户">
        <Row label="饼干 (userhash)">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder="输入 userhash"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={() => {
                setUserHash(hashInput.trim())
              }}
              className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              保存
            </button>
          </div>
        </Row>
        <p className="px-4 pb-3 text-xs text-gray-500 dark:text-gray-500">
          用于发帖和访问需要权限的内容。在 NMB 网站登录后导出饼干获取。
        </p>

        <Row label="订阅 UUID">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={uuidInput}
              onChange={(e) => setUuidInput(e.target.value)}
              placeholder="输入 feed uuid"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={() => {
                setFeedUuid(uuidInput.trim())
              }}
              className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              保存
            </button>
          </div>
        </Row>
        <p className="px-4 pb-3 text-xs text-gray-500 dark:text-gray-500">
          用于同步移动端订阅列表。
        </p>
      </Section>

      {/* 关于 */}
      <Section title="关于">
        <Row label="版本">
          <span className="text-sm text-gray-500">1.0.0</span>
        </Row>
        <Row label="技术栈">
          <span className="text-sm text-gray-500">React + Vite + PWA</span>
        </Row>
      </Section>

      <div className="h-20" />
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 uppercase tracking-wide">
        {title}
      </div>
      <div className="bg-white dark:bg-[#16171d]">{children}</div>
    </div>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 gap-4">
      <span className="text-sm text-gray-700 dark:text-gray-300 shrink-0">
        {label}
      </span>
      <div className="flex items-center">{children}</div>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
