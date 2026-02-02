"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

type TaxSettings = {
  enabled: boolean
  gstNumber?: string | null
  taxInclusive: boolean
  ratePercent: number
  invoiceNotes?: string | null
}

const D: TaxSettings = { enabled: false, gstNumber: "", taxInclusive: true, ratePercent: 18, invoiceNotes: "" }

export default function TaxSettingsPage() {
  const params = useParams<{ id: string }>()
  const eventId = String(params?.id || '')
  const [s, setS] = useState<TaxSettings>(D)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => { (async () => {
    try {
      const r = await fetch(`/api/events/${eventId}/tax`, { cache: "no-store" })
      if (r.ok) setS(await r.json())
    } catch (e: any) { setMsg(e?.message || "Failed to load") }
    finally { setLoading(false) }
  })() }, [eventId])

  async function save() {
    setSaving(true); setMsg(null)
    try {
      const r = await fetch(`/api/events/${eventId}/tax`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) })
      if (!r.ok) throw new Error(await r.text())
      setMsg('Saved')
    } catch (e: any) { setMsg(e?.message || 'Failed to save') } finally { setSaving(false) }
  }

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Tax Settings</h1>
      {msg && <div className="text-sm text-slate-600">{msg}</div>}

      <div className="border rounded p-4 space-y-4 bg-white">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={s.enabled} onChange={e=>setS({ ...s, enabled: e.target.checked })} /> Enable Tax
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm mb-1">GST Number</div>
            <input className="border rounded w-full px-3 py-2 text-sm" value={s.gstNumber||""} onChange={e=>setS({ ...s, gstNumber: e.target.value })} placeholder="27ABCDE1234F1Z5" />
          </div>
          <div>
            <div className="text-sm mb-1">Rate (%)</div>
            <input type="number" min={0} max={100} className="border rounded w-full px-3 py-2 text-sm" value={s.ratePercent} onChange={e=>setS({ ...s, ratePercent: Number(e.target.value) })} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={s.taxInclusive} onChange={e=>setS({ ...s, taxInclusive: e.target.checked })} /> Prices include tax
        </label>
        <div>
          <div className="text-sm mb-1">Invoice Notes</div>
          <textarea className="border rounded w-full px-3 py-2 text-sm" rows={3} value={s.invoiceNotes||""} onChange={e=>setS({ ...s, invoiceNotes: e.target.value })} placeholder="Thank you for your purchase." />
        </div>
      </div>

      <div>
        <button onClick={save} disabled={saving} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60">{saving? 'Saving…':'Save'}</button>
      </div>
    </div>
  )
}
