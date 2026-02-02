"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function NotificationTemplatesPage() {
  const params = useParams() as any
  const eventId = String(params?.id || '')
  const [key, setKey] = useState('rsvp_confirmation')
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [to, setTo] = useState('')
  const [dataJson, setDataJson] = useState('{"name":"John"}')
  const [msg, setMsg] = useState<string | null>(null)

  async function load() {
    setLoading(true); setMsg(null)
    try {
      const r = await fetch(`/api/events/${eventId}/notifications/templates?key=${encodeURIComponent(key)}`, { cache: 'no-store' })
      const j = await r.json()
      setSubject(j.subject || '')
      setHtml(j.html || '')
    } catch (e: any) {
      setMsg(e?.message || 'Failed to load')
    } finally { setLoading(false) }
  }

  useEffect(()=> { if (eventId) load() }, [eventId, key])

  async function save() {
    setSaving(true); setMsg(null)
    try {
      const r = await fetch(`/api/events/${eventId}/notifications/templates?key=${encodeURIComponent(key)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, html })
      })
      if (!r.ok) throw new Error(await r.text())
      setMsg('Saved')
    } catch (e: any) {
      setMsg(e?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  async function testSend() {
    setSending(true); setMsg(null)
    try {
      let data: any = {}
      try { data = JSON.parse(dataJson || '{}') } catch {}
      const r = await fetch(`/api/events/${eventId}/notifications/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, to, data })
      })
      const j = await r.json().catch(()=> ({}))
      if (!r.ok) throw new Error(j?.message || 'Send failed')
      setMsg(`Sent (id: ${j?.messageId || 'ok'})`)
    } catch (e: any) {
      setMsg(e?.message || 'Send failed')
    } finally { setSending(false) }
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notification Templates</h1>
          <p className="text-sm text-muted-foreground">Event ID: {eventId}</p>
        </div>
        <div className="flex gap-2">
          <select value={key} onChange={e=> setKey(e.target.value)} className="border rounded px-3 py-2 text-sm">
            <option value="rsvp_confirmation">RSVP Confirmation</option>
            <option value="reminder">Reminder</option>
            <option value="update">Event Update</option>
            <option value="checkin_confirmation">Check-in Confirmation</option>
          </select>
          <button className="rounded border px-3 py-2 text-sm" onClick={load} disabled={loading}>Reload</button>
        </div>
      </header>

      {msg && <div className="text-sm text-slate-600">{msg}</div>}

      <div className="rounded border bg-white p-4 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <div className="text-sm mb-1">Subject</div>
            <input className="border rounded w-full px-3 py-2 text-sm" value={subject} onChange={e=> setSubject(e.target.value)} />
          </div>
          <div>
            <div className="text-sm mb-1">Test send to</div>
            <input className="border rounded w-full px-3 py-2 text-sm" placeholder="you@example.com" value={to} onChange={e=> setTo(e.target.value)} />
          </div>
        </div>
        <div>
          <div className="text-sm mb-1">HTML</div>
          <textarea className="border rounded w-full px-3 py-2 text-sm min-h-[220px] font-mono" value={html} onChange={e=> setHtml(e.target.value)} />
        </div>
        <div className="grid md:grid-cols-2 gap-3 items-end">
          <div>
            <div className="text-sm mb-1">Template data (JSON)</div>
            <textarea className="border rounded w-full px-3 py-2 text-sm min-h-[120px] font-mono" value={dataJson} onChange={e=> setDataJson(e.target.value)} />
          </div>
          <div className="flex gap-2 md:justify-end">
            <button className="rounded border px-3 py-2 text-sm" onClick={save} disabled={saving}>{saving? 'Saving…':'Save'}</button>
            <button className="rounded bg-indigo-600 text-white px-3 py-2 text-sm" onClick={testSend} disabled={sending || !to}>{sending? 'Sending…':'Test Send'}</button>
          </div>
        </div>
        <div className="text-xs text-slate-500">Use variables like {'{{name}}'} in subject/html and pass them via Template data JSON.</div>
      </div>

      <div className="rounded border bg-white p-4">
        <div className="font-medium mb-2">Preview</div>
        <div className="border rounded p-3 max-w-none prose prose-sm" dangerouslySetInnerHTML={{ __html: html.replace(/\n/g,'<br/>') }} />
      </div>
    </div>
  )
}
