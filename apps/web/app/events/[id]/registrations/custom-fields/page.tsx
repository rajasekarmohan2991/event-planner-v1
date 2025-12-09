"use client"

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

type Field = {
  id: string
  eventId: string
  key: string
  label: string
  type: 'TEXT'|'EMAIL'|'NUMBER'|'SELECT'|'CHECKBOX'
  required: boolean
  helpText?: string | null
  options?: Array<{ label: string; value: string }> | null
  order: number
}

export default function CustomFieldsBuilderPage() {
  const params = useParams() as any
  const eventId = String(params?.id || '')
  const [items, setItems] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [draft, setDraft] = useState<Partial<Field>>({ type: 'TEXT', required: false })

  async function load() {
    try {
      setLoading(true); setError(null)
      const r = await fetch(`/api/events/${eventId}/custom-fields`, { cache: 'no-store' })
      if (!r.ok) throw new Error(`Failed (${r.status})`)
      const j = await r.json()
      setItems(j || [])
    } catch (e: any) { setError(e?.message || 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (eventId) load() }, [eventId])

  async function create() {
    setSaving(true)
    try {
      const body: any = {
        label: draft.label || '',
        key: draft.key || undefined,
        type: draft.type || 'TEXT',
        required: !!draft.required,
        helpText: draft.helpText || null,
        options: draft.type === 'SELECT' ? (draft.options || []) : null,
      }
      const r = await fetch(`/api/events/${eventId}/custom-fields`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!r.ok) throw new Error(await r.text())
      const created = await r.json()
      setItems(prev => [...prev, created].sort((a,b)=> a.order-b.order))
      setDraft({ type: 'TEXT', required: false })
    } catch (e: any) {
      alert(e?.message || 'Create failed')
    } finally { setSaving(false) }
  }

  async function update(id: string, patch: Partial<Field>) {
    const r = await fetch(`/api/events/${eventId}/custom-fields/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    if (!r.ok) throw new Error('Update failed')
    const j = await r.json()
    setItems(prev=> prev.map(x=> x.id===id ? j : x).sort((a,b)=> a.order-b.order))
  }

  async function remove(id: string) {
    if (!confirm('Delete field?')) return
    const r = await fetch(`/api/events/${eventId}/custom-fields/${id}`, { method: 'DELETE' })
    if (!r.ok) return alert('Delete failed')
    setItems(prev=> prev.filter(x=> x.id!==id))
  }

  const draftOptionsCSV = useMemo(() => (draft.options||[])?.map(o=> `${o.label}:${o.value}`).join(',') || '', [draft.options])

  function setDraftOptionsFromCSV(csv: string) {
    const arr = (csv||'').split(',').map(x=>x.trim()).filter(Boolean)
    const opts = arr.map(s=>{
      const [l, ...rest] = s.split(':')
      const v = rest.join(':') || l
      return { label: l, value: v }
    })
    setDraft(d=> ({ ...d, options: opts }))
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Custom Fields</h1>
        <p className="text-sm text-muted-foreground">Event ID: {eventId}</p>
      </header>

      <div className="rounded border bg-white p-4 space-y-3">
        <div className="font-medium">Add Field</div>
        <div className="grid md:grid-cols-5 gap-3">
          <input className="border rounded px-3 py-2 text-sm" placeholder="Label" value={draft.label||''} onChange={e=>setDraft(d=>({...d, label:e.target.value}))} />
          <input className="border rounded px-3 py-2 text-sm" placeholder="Key (optional)" value={draft.key||''} onChange={e=>setDraft(d=>({...d, key:e.target.value}))} />
          <select className="border rounded px-3 py-2 text-sm" value={draft.type||'TEXT'} onChange={e=>setDraft(d=>({...d, type: e.target.value as any }))}>
            <option value="TEXT">Text</option>
            <option value="EMAIL">Email</option>
            <option value="NUMBER">Number</option>
            <option value="SELECT">Select</option>
            <option value="CHECKBOX">Checkbox</option>
          </select>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!draft.required} onChange={e=>setDraft(d=>({...d, required:e.target.checked}))} /> Required</label>
          <input className="border rounded px-3 py-2 text-sm" placeholder="Help text" value={draft.helpText||''} onChange={e=>setDraft(d=>({...d, helpText:e.target.value}))} />
          {draft.type==='SELECT' && (
            <div className="md:col-span-5">
              <div className="text-xs text-slate-500 mb-1">Options (label:value, comma separated)</div>
              <input className="border rounded px-3 py-2 text-sm w-full" value={draftOptionsCSV} onChange={e=> setDraftOptionsFromCSV(e.target.value)} />
            </div>
          )}
        </div>
        <div>
          <button className="rounded bg-indigo-600 text-white px-3 py-2 text-sm" disabled={saving || !draft.label} onClick={create}>{saving? 'Adding…':'Add Field'}</button>
        </div>
      </div>

      {loading ? (
        <div className="rounded border bg-white p-4 text-sm">Loading…</div>
      ) : error ? (
        <div className="rounded border bg-rose-50 p-4 text-rose-700 text-sm">{error}</div>
      ) : (
        <div className="rounded-lg border overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Label</th>
                <th className="text-left px-4 py-3">Key</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Required</th>
                <th className="text-left px-4 py-3">Help</th>
                <th className="text-left px-4 py-3">Options</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-t">
                  <td className="px-4 py-3">
                    <input type="number" className="border rounded px-2 py-1 w-20" value={it.order} onChange={e=> update(it.id, { order: Number(e.target.value) })} />
                  </td>
                  <td className="px-4 py-3">
                    <input className="border rounded px-2 py-1" value={it.label} onChange={e=> update(it.id, { label: e.target.value })} />
                  </td>
                  <td className="px-4 py-3">
                    <input className="border rounded px-2 py-1" value={it.key} onChange={e=> update(it.id, { key: e.target.value })} />
                  </td>
                  <td className="px-4 py-3">
                    <select className="border rounded px-2 py-1" value={it.type} onChange={e=> update(it.id, { type: e.target.value as any })}>
                      <option value="TEXT">Text</option>
                      <option value="EMAIL">Email</option>
                      <option value="NUMBER">Number</option>
                      <option value="SELECT">Select</option>
                      <option value="CHECKBOX">Checkbox</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={it.required} onChange={e=> update(it.id, { required: e.target.checked })} />
                  </td>
                  <td className="px-4 py-3">
                    <input className="border rounded px-2 py-1" value={it.helpText || ''} onChange={e=> update(it.id, { helpText: e.target.value })} />
                  </td>
                  <td className="px-4 py-3">
                    {it.type==='SELECT' ? (
                      <input className="border rounded px-2 py-1 w-56" value={(it.options||[]).map(o=>`${o.label}:${o.value}`).join(',')} onChange={e=>{
                        const csv = e.target.value
                        const arr = (csv||'').split(',').map(x=>x.trim()).filter(Boolean)
                        const opts = arr.map(s=>{ const [l, ...r] = s.split(':'); const v = r.join(':')||l; return { label:l, value:v }})
                        update(it.id, { options: opts as any })
                      }} />
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded border px-3 py-1 text-xs text-red-700 hover:bg-red-50" onClick={()=> remove(it.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {items.length===0 && (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={8}>No fields yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
