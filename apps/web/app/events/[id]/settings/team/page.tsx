"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function TeamSettingsPage() {
  const params = useParams() as any
  const eventId = String(params?.id || '')
  const [items, setItems] = useState<Array<{ id: string; userId: string; role: string; user?: { email?: string|null; name?: string|null } }>>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState('STAFF')
  const [msg, setMsg] = useState<string|null>(null)

  async function load() {
    setLoading(true); setMsg(null)
    try {
      const r = await fetch(`/api/events/${eventId}/roles`, { cache: 'no-store' })
      const j = await r.json()
      setItems(Array.isArray(j.items) ? j.items : [])
    } catch (e:any) { setMsg(e?.message||'Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(()=> { if (eventId) load() }, [eventId])

  async function add() {
    setMsg(null)
    try {
      const body: any = { role }
      if (email.trim()) body.email = email.trim()
      if (userId.trim()) body.userId = userId.trim()
      const r = await fetch(`/api/events/${eventId}/roles`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
      const j = await r.json().catch(()=> ({}))
      if (!r.ok) throw new Error(j?.message || 'Failed to add')
      setEmail(''); setUserId('')
      await load()
      setMsg('Added')
    } catch (e:any) { setMsg(e?.message||'Failed to add') }
  }

  async function remove(id: string) {
    setMsg(null)
    try {
      const r = await fetch(`/api/events/${eventId}/roles/${id}`, { method:'DELETE' })
      if (!r.ok) throw new Error(await r.text())
      await load()
      setMsg('Removed')
    } catch (e:any) { setMsg(e?.message||'Failed to remove') }
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Team</h1>
        <p className="text-sm text-muted-foreground">Manage event roles</p>
      </header>

      {msg && <div className="text-sm text-slate-600">{msg}</div>}

      <div className="rounded border bg-white p-4 space-y-3 max-w-3xl">
        <div className="grid md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">User Email</label>
            <input className="border rounded w-full px-3 py-2 text-sm" placeholder="user@domain.com" value={email} onChange={e=> setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">or User ID</label>
            <input className="border rounded w-full px-3 py-2 text-sm" placeholder="uuid" value={userId} onChange={e=> setUserId(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Role</label>
            <select className="border rounded w-full px-3 py-2 text-sm" value={role} onChange={e=> setRole(e.target.value)}>
              <option value="OWNER">OWNER</option>
              <option value="ORGANIZER">ORGANIZER</option>
              <option value="STAFF">STAFF</option>
            </select>
          </div>
        </div>
        <div>
          <button onClick={add} className="rounded bg-indigo-600 text-white px-3 py-2 text-sm">Add</button>
        </div>
      </div>

      <div className="rounded border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-3" colSpan={4}>Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-4 py-6 text-muted-foreground" colSpan={4}>No team members yet.</td></tr>
            ) : items.map(it => (
              <tr key={it.id} className="border-t">
                <td className="px-4 py-3">{it.user?.name || it.userId}</td>
                <td className="px-4 py-3">{it.user?.email || '—'}</td>
                <td className="px-4 py-3">{it.role}</td>
                <td className="px-4 py-3">
                  <button onClick={()=> remove(it.id)} className="rounded border px-2 py-1">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
