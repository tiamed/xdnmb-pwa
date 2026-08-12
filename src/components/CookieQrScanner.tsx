import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@heroui/react'

export interface CookieQrPayload {
  cookie: string
  name: string
}

interface Props {
  open: boolean
  onClose: () => void
  onImport: (payload: CookieQrPayload) => void
  onError: (message: string) => void
}

function parseCookieQr(text: string): CookieQrPayload {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('二维码不是有效 JSON')
  }
  if (!data || typeof data !== 'object') throw new Error('二维码格式无效')
  const obj = data as Record<string, unknown>
  const cookie = typeof obj.cookie === 'string' ? obj.cookie.trim() : ''
  const name = typeof obj.name === 'string' ? obj.name.trim() : ''
  if (!cookie) throw new Error('二维码缺少 cookie 字段')
  return { cookie, name }
}

export default function CookieQrScanner({ open, onClose, onImport, onError }: Props) {
  const [starting, setStarting] = useState(true)
  const [camError, setCamError] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const handledRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const onCloseRef = useRef(onClose)
  const onImportRef = useRef(onImport)
  const onErrorRef = useRef(onError)
  onCloseRef.current = onClose
  onImportRef.current = onImport
  onErrorRef.current = onError

  useEffect(() => {
    if (!open) return
    handledRef.current = false
    setStarting(true)
    setCamError('')
    let cancelled = false

    // Wait a tick so the portal #cookie-qr-reader is in the DOM
    const timer = window.setTimeout(() => {
      const scanner = new Html5Qrcode('cookie-qr-reader')
      scannerRef.current = scanner

      const handleText = async (text: string) => {
        if (handledRef.current || cancelled) return
        handledRef.current = true
        try {
          const payload = parseCookieQr(text)
          if (scanner.isScanning) {
            try { await scanner.stop() } catch { /* ignore */ }
          }
          onImportRef.current(payload)
          onCloseRef.current()
        } catch (e) {
          handledRef.current = false
          onErrorRef.current(e instanceof Error ? e.message : '解析失败')
        }
      }

      void (async () => {
        try {
          await scanner.start(
            { facingMode: 'environment' },
            { fps: 8, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
            (decoded) => { void handleText(decoded) },
            () => { /* frame miss */ },
          )
          if (!cancelled) setStarting(false)
        } catch {
          if (!cancelled) {
            setStarting(false)
            setCamError('无法打开摄像头，可改用相册选图')
          }
        }
      })()
    }, 50)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      const s = scannerRef.current
      scannerRef.current = null
      if (s?.isScanning) {
        void s.stop().catch(() => {})
      }
      try { s?.clear() } catch { /* ignore */ }
    }
  }, [open])

  const scanFile = async (file: File) => {
    try {
      let scanner = scannerRef.current
      if (scanner?.isScanning) {
        try { await scanner.stop() } catch { /* ignore */ }
      }
      if (!scanner) {
        scanner = new Html5Qrcode('cookie-qr-reader')
        scannerRef.current = scanner
      }
      const text = await scanner.scanFile(file, true)
      const payload = parseCookieQr(text)
      onImportRef.current(payload)
      onCloseRef.current()
    } catch (e) {
      const msg = e instanceof Error ? e.message : '无法识别二维码'
      // scanFile failures are often generic
      onErrorRef.current(
        msg.includes('No QR') || msg.includes('QR code parse')
          ? '未识别到二维码'
          : msg,
      )
    }
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/90" role="dialog" aria-modal="true" aria-label="扫码导入 Cookie">
      <div
        className="flex items-center justify-between px-3 py-3 text-white shrink-0"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <span className="text-sm font-medium">扫码导入 Cookie</span>
        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="关闭">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-3 min-h-0">
        <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-black">
          <div id="cookie-qr-reader" className="w-full h-full [&_video]:object-cover [&_img]:object-contain" />
          {starting && !camError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white/80 text-sm gap-2">
              <Loader2 size={18} className="animate-spin" />启动摄像头…
            </div>
          )}
        </div>
        {camError && <p className="text-xs text-warning text-center">{camError}</p>}
        <p className="text-xs text-white/60 text-center">扫描含 cookie / name 的 JSON 二维码</p>
      </div>

      <div
        className="shrink-0 px-4 flex gap-2 justify-center"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void scanFile(f)
          }}
        />
        <Button size="sm" variant="secondary" onPress={() => fileInputRef.current?.click()}>
          <ImageIcon size={14} />从相册选择
        </Button>
      </div>
    </div>,
    document.body,
  )
}
