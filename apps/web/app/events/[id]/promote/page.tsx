"use client"

import { useSession } from "next-auth/react"
import ManageTabs from '@/components/events/ManageTabs'
import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'

export default function EventPromotePage({ params }: { params: { id: string } }) {
  const { status } = useSession()
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const publicUrl = useMemo(() => {
    const base = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001')
    return `${base.replace(/\/$/, '')}/events/${params.id}/public`
  }, [params.id])

  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(publicUrl); setMsg('Link copied'); setTimeout(()=>setMsg(null), 2000) } catch { setErr('Copy failed') }
  }, [publicUrl])

  const publish = useCallback(async () => {
    try {
      setBusy(true); setErr(null); setMsg(null)
      const res = await fetch(`/api/events/${params.id}/publish`, { method: 'PATCH' })
      if (!res.ok) throw new Error(await res.text().catch(()=> 'Publish failed'))
      setMsg('Event published')
      setTimeout(()=>setMsg(null), 2500)
    } catch (e:any) { setErr(e?.message || 'Publish failed') } finally { setBusy(false) }
  }, [params.id])

  if (status === 'loading') return <div className="p-6">Loading...</div>
  return (
    <div className="space-y-4">
      <ManageTabs eventId={params.id} />
      <h1 className="text-xl font-semibold">Promote</h1>
      <p className="text-sm text-muted-foreground">Event ID: {params.id}</p>

      <div className="rounded-md border p-4 bg-white space-y-3">
        <div className="text-sm font-medium">Public Event Link</div>
        <div className="flex items-center gap-2">
          <input readOnly value={publicUrl} className="flex-1 rounded-md border px-3 py-2 text-sm" />
          <button onClick={copy} className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white">Copy</button>
          <Link href={publicUrl} target="_blank" className="rounded-md bg-slate-100 px-3 py-2 text-sm">Open</Link>
        </div>
        <div className="text-xs text-muted-foreground">Share your event link with attendees.</div>
        <div className="flex flex-wrap gap-2 pt-2">
          <button onClick={()=>window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Join my event!')}&url=${encodeURIComponent(publicUrl)}`,'_blank')} className="rounded-md bg-slate-100 px-3 py-2 text-sm">Share on X</button>
          <button onClick={()=>window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`,'_blank')} className="rounded-md bg-slate-100 px-3 py-2 text-sm">Share on LinkedIn</button>
          <button onClick={()=>window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(publicUrl)}`,'_blank')} className="rounded-md bg-slate-100 px-3 py-2 text-sm">Share on WhatsApp</button>
        </div>
      </div>

      <div className="rounded-md border p-4 bg-white space-y-3">
        <div className="text-sm font-medium">Publish</div>
        <p className="text-sm text-muted-foreground">Make your event discoverable. You can unpublish later if needed.</p>
        <div className="flex items-center gap-2">
          <button disabled={busy} onClick={publish} className="rounded-md bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-60">{busy ? 'Publishing...' : 'Publish Event'}</button>
          <Link href={`/events/${params.id}/design`} className="rounded-md bg-slate-100 px-3 py-2 text-sm">Edit Public Site</Link>
        </div>
        {msg && <div className="text-sm text-emerald-600">{msg}</div>}
        {err && <div className="text-sm text-rose-600">{err}</div>}
      </div>
    </div>
  )
}
