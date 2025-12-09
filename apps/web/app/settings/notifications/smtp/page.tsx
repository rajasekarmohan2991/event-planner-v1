"use client"

import { useEffect, useState } from 'react'

export default function SmtpConfigPage() {
  const [host, setHost] = useState('')
  const [port, setPort] = useState<number>(587)
  const [secure, setSecure] = useState(false)
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [from, setFrom] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function load() {
    setLoading(true); setMsg(null)
    try {
      const r = await fetch('/api/notifications/smtp-config', { cache: 'no-store' })
      const j = await r.json()
      setHost(j.host || '')
      setPort(Number(j.port || 587))
      setSecure(!!j.secure)
      setUser(j.user || '')
      setPass(j.pass || '')
      setFrom(j.from || '')
    } catch (e: any) { setMsg(e?.message || 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(()=> { load() }, [])

  async function save() {
    setSaving(true); setMsg(null)
    try {
      const body = { host, port, secure, user, pass, from }
      const r = await fetch('/api/notifications/smtp-config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!r.ok) throw new Error(await r.text())
      setMsg('Saved')
    } catch (e: any) { setMsg(e?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">SMTP Configuration</h1>
        <p className="text-sm text-muted-foreground">Used by Notifications send</p>
      </header>

      {msg && <div className="text-sm text-slate-600">{msg}</div>}

      <div className="rounded border bg-white p-4 space-y-3 max-w-2xl">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <div className="text-sm mb-1">Host</div>
            <input className="border rounded w-full px-3 py-2 text-sm" value={host} onChange={e=> setHost(e.target.value)} />
          </div>
          <div>
            <div className="text-sm mb-1">Port</div>
            <input type="number" className="border rounded w-full px-3 py-2 text-sm" value={port} onChange={e=> setPort(Number(e.target.value))} />
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={secure} onChange={e=> setSecure(e.target.checked)} /> Secure (TLS)
          </label>
          <div></div>
          <div>
            <div className="text-sm mb-1">User</div>
            <input className="border rounded w-full px-3 py-2 text-sm" value={user} onChange={e=> setUser(e.target.value)} />
          </div>
          <div>
            <div className="text-sm mb-1">Password</div>
            <input type="password" className="border rounded w-full px-3 py-2 text-sm" value={pass} onChange={e=> setPass(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <div className="text-sm mb-1">From</div>
            <input className="border rounded w-full px-3 py-2 text-sm" placeholder="noreply@yourdomain.com" value={from} onChange={e=> setFrom(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="rounded border px-3 py-2 text-sm" onClick={load} disabled={loading}>Reload</button>
          <button className="rounded bg-indigo-600 text-white px-3 py-2 text-sm" onClick={save} disabled={saving}>{saving? 'Saving…':'Save'}</button>
        </div>
        <div className="text-xs text-slate-500">You can also use environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM). Saved values here take precedence.</div>
      </div>
    </div>
  )
}
