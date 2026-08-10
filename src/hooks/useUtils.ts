import { useEffect, useRef, useState } from 'react'
import type { ForumGroup } from '../types/api'

/**
 * 解析内容中的 >>No.xxxx 引用
 */
export function parseContentReferences(content: string): string[] {
  const regex = /&gt;&gt;No\.(\d+)/g
  const matches: string[] = []
  let m
  while ((m = regex.exec(content)) !== null) {
    matches.push(m[1])
  }
  return matches
}

/**
 * 根据 fid 在版块列表中查找版块名称
 */
export function resolveForumName(
  forumGroups: ForumGroup[] | undefined,
  fid: string | number | undefined | null,
): string {
  if (!forumGroups || fid == null || fid === '') return ''
  const id = String(fid)
  for (const g of forumGroups) {
    const f = g.forums.find(x => String(x.id) === id)
    if (f) return f.name
  }
  return ''
}

/**
 * 将 HTML 内容渲染为带引用链接的 JSX 字符串（返回处理后的 HTML）
 */
export function renderContentWithQuotes(content: string): string {
  return content.replace(
    /&gt;&gt;No\.(\d+)/g,
    '<a class="quote-link" data-post-id="$1" href="javascript:void(0)">&gt;&gt;No.$1</a>',
  )
}

/**
 * 处理 [h]...[/h] 隐藏内容
 */
export function renderSpoilers(content: string, revealed = false): string {
  const cls = revealed ? 'spoiler revealed' : 'spoiler'
  return content.replace(
    /\[h\]([\s\S]*?)\[\/h\]/g,
    `<span class="${cls}">$1</span>`,
  )
}

/**
 * 去除 HTML 标签，获取纯文本预览
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}

/**
 * 解析 X 岛时间字符串为 Date
 * 输入格式: "2024-01-15(一)10:30:00"
 */
export function parseNmbTime(timeStr: string): Date | null {
  if (!timeStr) return null
  const cleaned = timeStr.replace(/\(.+?\)/, ' ').replace(/\s+/g, ' ').trim()
  // "2024-01-15 10:30:00" — treat as local time
  const m = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/)
  if (!m) {
    const d = new Date(cleaned)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const [, y, mo, d, h, mi, s] = m
  return new Date(+y, +mo - 1, +d, +h, +mi, +s)
}

/**
 * 相对时间：刚刚 / n分钟前 / n小时前 / n天前
 */
export function formatRelativeTime(timeStr: string, now = Date.now()): string {
  const date = parseNmbTime(timeStr)
  if (!date) return formatAbsoluteTime(timeStr)
  const diff = now - date.getTime()
  if (diff < 0) return formatAbsoluteTime(timeStr)
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return '刚刚'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}小时前`
  const day = Math.floor(hour / 24)
  return `${day}天前`
}

/**
 * 绝对时间：去掉星期括号，日期与时间之间加空格
 */
export function formatAbsoluteTime(timeStr: string): string {
  // 输入格式: "2024-01-15(一)10:30:00" → "2024-01-15 10:30:00"
  return timeStr.replace(/\(.+?\)/, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * 格式化时间：1 天内用相对时间，否则用绝对时间
 */
export function formatTime(timeStr: string): string {
  const date = parseNmbTime(timeStr)
  if (!date) return formatAbsoluteTime(timeStr)
  const diff = Date.now() - date.getTime()
  if (diff >= 0 && diff < 24 * 60 * 60 * 1000) {
    return formatRelativeTime(timeStr)
  }
  return formatAbsoluteTime(timeStr)
}

/**
 * 无限滚动 hook
 */
export function useIntersectionObserver<T extends HTMLElement>(
  callback: () => void,
  options?: IntersectionObserverInit,
) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback()
        }
      },
      { threshold: 0.1, ...options },
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [callback, options])

  return ref
}

/**
 * 防抖
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
