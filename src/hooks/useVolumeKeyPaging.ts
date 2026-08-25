import { useEffect } from 'react'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return !!target.closest('input, textarea, select, [contenteditable="true"]')
}

function isVolumeKey(e: KeyboardEvent): 'up' | 'down' | null {
  const code = e.code || ''
  const key = e.key || ''
  // Modern browsers / Android WebView
  if (code === 'AudioVolumeUp' || key === 'AudioVolumeUp' || key === 'VolumeUp') return 'up'
  if (code === 'AudioVolumeDown' || key === 'AudioVolumeDown' || key === 'VolumeDown') return 'down'
  // Legacy keyCode (175 up / 174 down)
  const kc = (e as KeyboardEvent & { keyCode?: number }).keyCode
  if (kc === 175) return 'up'
  if (kc === 174) return 'down'
  return null
}

/**
 * Volume up/down scrolls #main-scroll-container by roughly one viewport.
 * Skips when typing in form fields.
 */
export function useVolumeKeyPaging(enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      const dir = isVolumeKey(e)
      if (!dir) return
      if (isEditableTarget(e.target)) return

      const el = document.getElementById('main-scroll-container')
      if (!el) return

      e.preventDefault()
      e.stopPropagation()

      const delta = Math.max(120, Math.floor(el.clientHeight * 0.9))
      el.scrollBy({ top: dir === 'down' ? delta : -delta, behavior: 'smooth' })
    }

    // Also swallow keyup so some Android WebViews don't also change system volume
    const onKeyUp = (e: KeyboardEvent) => {
      if (!isVolumeKey(e)) return
      if (isEditableTarget(e.target)) return
      if (!document.getElementById('main-scroll-container')) return
      e.preventDefault()
      e.stopPropagation()
    }

    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
    }
  }, [enabled])
}
