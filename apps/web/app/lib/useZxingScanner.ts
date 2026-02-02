"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader, NotFoundException, Result } from "@zxing/library"

export type UseZxingScannerOptions = {
  deviceId?: string
  onDecode: (text: string) => void
}

export function useZxingScanner({ deviceId, onDecode }: UseZxingScannerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [reader] = useState(() => new BrowserMultiFormatReader())
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      try { reader.reset() } catch {}
      const el = videoRef.current
      const s = el && (el.srcObject as MediaStream | null)
      s?.getTracks().forEach(t => t.stop())
    }
  }, [reader])

  const start = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: deviceId ? { exact: deviceId } : undefined, facingMode: "environment" } })
      if (videoRef.current) videoRef.current.srcObject = stream
      setActive(true)
      loop()
    } catch (e: any) {
      setError(e?.message || "Unable to access camera")
    }
  }

  const stop = () => {
    try { reader.reset() } catch {}
    const el = videoRef.current
    const s = el && (el.srcObject as MediaStream | null)
    s?.getTracks().forEach(t => t.stop())
    if (el) el.srcObject = null
    setActive(false)
  }

  const loop = async () => {
    if (!videoRef.current) return
    try {
      await reader.decodeFromVideoElementContinuously(videoRef.current, (result: Result | undefined, err: unknown) => {
        if (result) {
          try { onDecode(result.getText()) } catch {}
        } else if (err && !(err instanceof NotFoundException)) {
          setError((err as any)?.message || "Scan error")
        }
      })
    } catch (err) {
      if (!(err instanceof NotFoundException)) {
        setError((err as any)?.message || "Scan error")
      }
    }
  }

  return { videoRef, start, stop, active, error }
}
