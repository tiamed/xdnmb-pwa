import { useEffect, useRef, useState } from 'react'

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
 * 格式化时间
 */
export function formatTime(timeStr: string): string {
  // 输入格式: "2024-01-15(一)10:30:00" 或类似
  return timeStr.replace(/\(.+\)/, '')
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
