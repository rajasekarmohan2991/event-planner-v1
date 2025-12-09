"use client"
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

type AllowTransfer = { enabled: boolean; scope: 'all'|'selected'; until: 'event_end'|'custom'; customUntilIso?: string|null; ticketClassIds?: string[] }
type RegistrationApproval = { enabled: boolean; scope: 'all'|'selected'; ticketClassIds?: string[] }
type Settings = {
  timeLimitMinutes: number
  noTimeLimit: boolean
  ticketIssueMode: 'on_payment' | 'on_registration'
  allowTransfer: AllowTransfer
  appleWallet: boolean
  showAvailability: boolean
  restrictDuplicates: 'event' | 'ticket' | 'none'
  registrationApproval: RegistrationApproval
  cancellationApproval: boolean
  allowCheckinUnpaidOffline: boolean
}

const D: Settings = {
  timeLimitMinutes: 15,
  noTimeLimit: false,
  ticketIssueMode: 'on_payment',
  allowTransfer: { enabled: false, scope: 'all', until: 'event_end', customUntilIso: null, ticketClassIds: [] },
  appleWallet: true,
  showAvailability: false,
  restrictDuplicates: 'event',
  registrationApproval: { enabled: false, scope: 'all', ticketClassIds: [] },
  cancellationApproval: false,
  allowCheckinUnpaidOffline: false,
}

export default function RegistrationSettingsPage() {
  const params = useParams() as any
  const eventId = String(params?.id || '')
  const [s, setS] = useState<Settings>(D)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => { (async () => {
    try {
      const r = await fetch(`/api/events/${eventId}/registration-settings/advanced`, { cache: 'no-store' })
      if (r.ok) setS(await r.json())
    } finally { setLoading(false) }
  })() }, [eventId])

  async function save() {
    setSaving(true); setMsg(null)
    try {
      const r = await fetch(`/api/events/${eventId}/registration-settings/advanced`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) })
      if (!r.ok) throw new Error(await r.text())
      setMsg('Saved')
    } catch (e: any) { setMsg(e?.message || 'Failed to save') } finally { setSaving(false) }
  }

  const transferIdsCSV = useMemo(()=> (s.allowTransfer.ticketClassIds||[]).join(','), [s.allowTransfer.ticketClassIds])
  const approvalIdsCSV = useMemo(()=> (s.registrationApproval.ticketClassIds||[]).join(','), [s.registrationApproval.ticketClassIds])

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-semibold">Registration Settings</h1>
      {msg && <div className="text-sm text-slate-700">{msg}</div>}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4 border rounded p-4 bg-white">
          <div className="font-medium">Time Limit</div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.noTimeLimit} onChange={e=>setS(v=>({...v,noTimeLimit:e.target.checked}))} /> No time limit</label>
          {!s.noTimeLimit && (
            <div>
              <div className="text-sm mb-1">Minutes</div>
              <input type="number" min={0} className="border rounded w-full px-3 py-2 text-sm" value={s.timeLimitMinutes} onChange={e=>setS(v=>({...v,timeLimitMinutes:Math.max(0, Number(e.target.value)||0)}))} />
            </div>
          )}
          <div>
            <div className="text-sm mb-1">Ticket issue mode</div>
            <select className="border rounded w-full px-3 py-2 text-sm" value={s.ticketIssueMode} onChange={e=>setS(v=>({...v,ticketIssueMode:e.target.value as any}))}>
              <option value="on_payment">On payment</option>
              <option value="on_registration">On registration</option>
            </select>
          </div>
        </div>

        <div className="space-y-4 border rounded p-4 bg-white">
          <div className="font-medium">Transfer</div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.allowTransfer.enabled} onChange={e=>setS(v=>({...v,allowTransfer:{...v.allowTransfer, enabled:e.target.checked}}))} /> Enable transfer</label>
          <div>
            <div className="text-sm mb-1">Scope</div>
            <select className="border rounded w-full px-3 py-2 text-sm" value={s.allowTransfer.scope} onChange={e=>setS(v=>({...v,allowTransfer:{...v.allowTransfer, scope:e.target.value as any}}))}>
              <option value="all">All tickets</option>
              <option value="selected">Selected tickets</option>
            </select>
          </div>
          {s.allowTransfer.scope==='selected' && (
            <div>
              <div className="text-sm mb-1">Ticket class IDs (comma separated)</div>
              <input className="border rounded w-full px-3 py-2 text-sm" value={transferIdsCSV} onChange={e=>{
                const ids = e.target.value.split(',').map(x=>x.trim()).filter(Boolean)
                setS(v=>({...v,allowTransfer:{...v.allowTransfer, ticketClassIds: ids}}))
              }} />
            </div>
          )}
          <div>
            <div className="text-sm mb-1">Until</div>
            <select className="border rounded w-full px-3 py-2 text-sm" value={s.allowTransfer.until} onChange={e=>setS(v=>({...v,allowTransfer:{...v.allowTransfer, until:e.target.value as any}}))}>
              <option value="event_end">Event end</option>
              <option value="custom">Custom date/time</option>
            </select>
          </div>
          {s.allowTransfer.until==='custom' && (
            <div>
              <div className="text-sm mb-1">Custom Until (ISO)</div>
              <input className="border rounded w-full px-3 py-2 text-sm" placeholder="2025-11-01T10:00:00.000Z" value={s.allowTransfer.customUntilIso||''} onChange={e=>setS(v=>({...v,allowTransfer:{...v.allowTransfer, customUntilIso:e.target.value}}))} />
            </div>
          )}
        </div>

        <div className="space-y-4 border rounded p-4 bg-white">
          <div className="font-medium">General</div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.appleWallet} onChange={e=>setS(v=>({...v,appleWallet:e.target.checked}))} /> Apple Wallet</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.showAvailability} onChange={e=>setS(v=>({...v,showAvailability:e.target.checked}))} /> Show availability</label>
          <div>
            <div className="text-sm mb-1">Restrict duplicates</div>
            <select className="border rounded w-full px-3 py-2 text-sm" value={s.restrictDuplicates} onChange={e=>setS(v=>({...v,restrictDuplicates:e.target.value as any}))}>
              <option value="event">Per event</option>
              <option value="ticket">Per ticket</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>

        <div className="space-y-4 border rounded p-4 bg-white">
          <div className="font-medium">Approvals</div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.registrationApproval.enabled} onChange={e=>setS(v=>({...v,registrationApproval:{...v.registrationApproval, enabled:e.target.checked}}))} /> Registration approval</label>
          <div>
            <div className="text-sm mb-1">Approval scope</div>
            <select className="border rounded w-full px-3 py-2 text-sm" value={s.registrationApproval.scope} onChange={e=>setS(v=>({...v,registrationApproval:{...v.registrationApproval, scope:e.target.value as any}}))}>
              <option value="all">All tickets</option>
              <option value="selected">Selected tickets</option>
            </select>
          </div>
          {s.registrationApproval.scope==='selected' && (
            <div>
              <div className="text-sm mb-1">Ticket class IDs (comma separated)</div>
              <input className="border rounded w-full px-3 py-2 text-sm" value={approvalIdsCSV} onChange={e=>{
                const ids = e.target.value.split(',').map(x=>x.trim()).filter(Boolean)
                setS(v=>({...v,registrationApproval:{...v.registrationApproval, ticketClassIds: ids}}))
              }} />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.cancellationApproval} onChange={e=>setS(v=>({...v,cancellationApproval:e.target.checked}))} /> Cancellation approval</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.allowCheckinUnpaidOffline} onChange={e=>setS(v=>({...v,allowCheckinUnpaidOffline:e.target.checked}))} /> Allow check-in for unpaid (offline)</label>
        </div>
      </div>

      <div>
        <button onClick={save} disabled={saving} className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-60">{saving? 'Saving…':'Save'}</button>
      </div>
    </div>
  )
}
