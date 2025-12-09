"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { BrowserMultiFormatReader } from '@zxing/library'

const STORAGE_KEY = 'ep_checkin_queue_v1'

type QueueItem = {
  eventId: string
  token: string
  location?: string
  deviceId?: string
  idempotencyKey: string
  enqueuedAt: string
}

export default function CheckinScannerPage() {
  const params = useParams() as any
  const eventId = String(params?.id || '')
  const [status, setStatus] = useState<'idle'|'scanning'|'success'|'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const [cameraStarted, setCameraStarted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const [deviceId] = useState(() => `scanner-${Math.random().toString(36).slice(2,8)}`)
  const [location, setLocation] = useState<string>('Entrance Gate')
  const [lastResult, setLastResult] = useState<any>(null)
  const [syncing, setSyncing] = useState(false)

  const [queue, setQueue] = useState<QueueItem[]>([])

  // Load queue from database
  useEffect(() => {
    fetch(`/api/offline-queue?eventId=${eventId}`)
      .then(res => res.json())
      .then(data => {
        if (data.queue) {
          setQueue(data.queue.map((q: any) => ({
            eventId: Number(q.eventId),
            token: q.data.token,
            location: q.data.location,
            deviceId: q.data.deviceId,
            idempotencyKey: q.idempotencyKey,
            enqueuedAt: q.createdAt
          })))
        }
      })
      .catch(err => console.error('Failed to load queue:', err))
  }, [eventId, lastResult, syncing])

  async function enqueue(item: QueueItem) {
    try {
      await fetch('/api/offline-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: item.eventId,
          action: 'checkin',
          data: { token: item.token, location: item.location, deviceId: item.deviceId },
          idempotencyKey: item.idempotencyKey
        })
      })
      setQueue(prev => [...prev, item])
    } catch (err) {
      console.error('Failed to enqueue:', err)
    }
  }

  async function dequeueByIdem(idem: string) {
    try {
      await fetch(`/api/offline-queue?idempotencyKey=${idem}`, { method: 'DELETE' })
      setQueue(prev => prev.filter(i => i.idempotencyKey !== idem))
    } catch (err) {
      console.error('Failed to dequeue:', err)
    }
  }

  async function postCheckin(token: string, idem: string) {
    const res = await fetch(`/api/events/${eventId}/checkin`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, location, deviceId, idempotencyKey: idem }),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  async function handleContent(raw: string) {
    try {
      setStatus('scanning')
      setMessage('Scanning…')
      const token = raw.startsWith('CHK:') ? raw.slice(4) : raw
      const idem = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
      try {
        const data = await postCheckin(token, idem)
        setLastResult({ ok: true, data })
        setStatus('success')
        setMessage('Checked in')
      } catch (e) {
        // Offline-first: enqueue and report queued
        enqueue({ eventId, token, location, deviceId, idempotencyKey: idem, enqueuedAt: new Date().toISOString() })
        setLastResult({ ok: false, queued: true })
        setStatus('error')
        setMessage('Offline - queued for sync')
      }
    } catch (e: any) {
      setStatus('error')
      setMessage(e?.message || 'Scan failed')
    } finally {
      // small pause before next
      setTimeout(()=> setStatus('idle'), 500)
    }
  }

  async function startCamera() {
    if (cameraStarted) return
    try {
      const codeReader = new BrowserMultiFormatReader()
      codeReaderRef.current = codeReader
      const devices = await (codeReader as any).listVideoInputDevices()
      const preferred = devices[devices.length - 1]?.deviceId || devices[0]?.deviceId
      if (!preferred) throw new Error('No camera available')
      const preview = videoRef.current!
      setCameraStarted(true)
      await codeReader.decodeFromVideoDevice(preferred, preview, (result, err) => {
        if (result) {
          const text = result.getText()
          // Deduplicate same code back-to-back
          if (text && text !== (lastResult?.text as string)) {
            setLastResult({ text })
            handleContent(text)
          }
        }
      })
    } catch (e: any) {
      setMessage(e?.message || 'Camera error')
      setStatus('error')
    }
  }

  async function stopCamera() {
    try {
      codeReaderRef.current?.reset()
      setCameraStarted(false)
    } catch {}
  }

  useEffect(() => {
    const int = setInterval(async () => {
      if (syncing) return
      const list: QueueItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (!list.length) return
      setSyncing(true)
      try {
        for (const item of list) {
          try {
            await postCheckin(item.token, item.idempotencyKey)
            dequeueByIdem(item.idempotencyKey)
          } catch {
            // keep item in queue
          }
        }
      } finally { setSyncing(false) }
    }, 3000)
    return () => clearInterval(int)
  }, [eventId, syncing])

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Check-in Scanner</h1>
          <p className="text-sm text-muted-foreground">Event ID: {eventId}</p>
        </div>
        <div className="text-sm">Queued: <span className="font-semibold">{queue.length}</span>{syncing? ' (syncing…)':''}</div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          <div className={`rounded border p-2 ${status==='success'?'border-emerald-400':status==='error'?'border-rose-400':'border-slate-200'}`}>
            <video ref={videoRef} className="w-full aspect-video bg-black rounded" muted playsInline />
          </div>
          <div className="flex gap-2">
            {!cameraStarted ? (
              <button onClick={startCamera} className="rounded bg-indigo-600 text-white px-3 py-2 text-sm">Start Camera</button>
            ) : (
              <button onClick={stopCamera} className="rounded border px-3 py-2 text-sm">Stop Camera</button>
            )}
            <button onClick={()=> setLastResult(null)} className="rounded border px-3 py-2 text-sm">Clear</button>
            <button onClick={()=> setSyncing(true)} className="rounded border px-3 py-2 text-sm">Sync Now</button>
          </div>
          <div className="text-sm text-slate-600">{message}</div>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-sm mb-1">Location</div>
            <input value={location} onChange={e=>setLocation(e.target.value)} className="border rounded w-full px-3 py-2 text-sm" />
          </div>
          <div className="rounded border bg-white p-3">
            <div className="font-medium text-sm mb-2">Last Result</div>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(lastResult, null, 2)}</pre>
          </div>
          <div className="rounded border bg-white p-3">
            <div className="font-medium text-sm mb-2">Queued</div>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(queue, null, 2)}</pre>
          </div>
        </div>
      </div>

      <div className="rounded border bg-white p-3">
        <div className="font-medium text-sm mb-2">Manual Token</div>
        <ManualTokenForm onSubmit={(token)=> handleContent(token)} />
      </div>
    </div>
  )
}

function ManualTokenForm({ onSubmit }: { onSubmit: (t: string) => void }) {
  const [t, setT] = useState('')
  return (
    <div className="flex gap-2">
      <input value={t} onChange={e=>setT(e.target.value)} className="border rounded w-full px-3 py-2 text-sm" placeholder="Paste QR token (or CHK:<token>)" />
      <button onClick={()=> onSubmit(t)} className="rounded border px-3 py-2 text-sm">Submit</button>
    </div>
  )
}
