"use client"
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

type RSVP = { id: string; email: string | null; name?: string | null; status: string; createdAt: string }
type Pending = { id: string; email: string | null; status: string; createdAt: string }

export default function MissedRegistrationsPage() {
  const params = useParams<{ id: string }>()
  const eventId = String(params?.id || '')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [pending, setPending] = useState<Pending[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const anySelected = useMemo(() => Object.values(selected).some(Boolean), [selected])

  const load = async () => {
    try {
      setLoading(true); setError(null)
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      const res = await fetch(`/api/events/${eventId}/registrations/missed?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const data = await res.json()
      setRsvps(Array.isArray(data?.rsvps) ? data.rsvps : [])
      setPending(Array.isArray(data?.pending) ? data.pending : [])
      setSelected({})
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (eventId) load() }, [eventId])

  const emailsSelected = useMemo(() => {
    const emails: string[] = []
    for (const it of [...rsvps, ...pending] as Array<{ email: string | null; id: string }>) {
      if (selected[it.id] && (it.email || '').trim()) emails.push((it.email || '').trim())
    }
    return emails
  }, [selected, rsvps, pending])

  const sendEmailSelected = async () => {
    try {
      if (!emailsSelected.length) return
      const res = await fetch(`/api/events/${eventId}/communicate/bulk`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: ['email'],
          subject: 'We saved your spot – complete your registration',
          html: '<p>Hi, you started interest on our event. Complete your registration to secure your seat.</p>',
          includeRegistrations: false,
          includeRsvps: false,
          dedupe: true,
          dryRun: false,
          testEmail: undefined,
        })
      })
      if (!res.ok) throw new Error('Failed to send')
      alert('Email triggered (check SMTP config).')
    } catch (e: any) {
      alert(e?.message || 'Failed to send')
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Missed Registrations</h1>
        <p className="text-sm text-muted-foreground">Event ID: {eventId}</p>
      </header>

      <div className="flex items-end gap-2">
        <div>
          <label className="block text-xs text-slate-500">Search</label>
          <input value={q} onChange={e=>setQ(e.target.value)} className="rounded border px-3 py-2 text-sm" placeholder="email" />
        </div>
        <button onClick={load} className="rounded-md bg-indigo-600 text-white px-3 py-2 text-sm">Apply</button>
        <div className="ml-auto flex items-center gap-2">
          <button disabled={!anySelected} onClick={sendEmailSelected} className={`rounded-md px-3 py-2 text-sm ${anySelected? 'bg-indigo-600 text-white':'border text-slate-400 cursor-not-allowed'}`}>Email Selected</button>
        </div>
      </div>

      {loading ? (
        <div className="rounded border bg-white p-4 text-sm">Loading…</div>
      ) : error ? (
        <div className="rounded border bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border overflow-hidden bg-white">
            <div className="px-4 py-2 border-b font-medium">RSVPs (accepted/maybe without registration)</div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2"><input type="checkbox" onChange={(e)=>{
                    const v = e.currentTarget.checked
                    const next: any = { ...selected }
                    for (const it of rsvps) next[it.id] = v
                    setSelected(next)
                  }} /></th>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map(it => (
                  <tr key={it.id} className="border-t">
                    <td className="px-3 py-2"><input type="checkbox" checked={!!selected[it.id]} onChange={(e)=> setSelected(s=> ({...s, [it.id]: e.currentTarget.checked}))} /></td>
                    <td className="px-3 py-2">{it.email || '—'}</td>
                    <td className="px-3 py-2">{it.name || '—'}</td>
                    <td className="px-3 py-2">{it.status}</td>
                    <td className="px-3 py-2">{new Date(it.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {rsvps.length === 0 && (
                  <tr><td className="px-3 py-3 text-muted-foreground" colSpan={5}>No items</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="rounded-lg border overflow-hidden bg-white">
            <div className="px-4 py-2 border-b font-medium">Pending registrations older than 48h</div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2"><input type="checkbox" onChange={(e)=>{
                    const v = e.currentTarget.checked
                    const next: any = { ...selected }
                    for (const it of pending) next[it.id] = v
                    setSelected(next)
                  }} /></th>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(it => (
                  <tr key={it.id} className="border-t">
                    <td className="px-3 py-2"><input type="checkbox" checked={!!selected[it.id]} onChange={(e)=> setSelected(s=> ({...s, [it.id]: e.currentTarget.checked}))} /></td>
                    <td className="px-3 py-2">{it.email || '—'}</td>
                    <td className="px-3 py-2">{it.status}</td>
                    <td className="px-3 py-2">{new Date(it.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {pending.length === 0 && (
                  <tr><td className="px-3 py-3 text-muted-foreground" colSpan={4}>No items</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
