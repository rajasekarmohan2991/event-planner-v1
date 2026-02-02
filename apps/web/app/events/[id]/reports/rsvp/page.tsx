"use client"

import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Users, UserCheck, UserX, Clock, Eye } from 'lucide-react'

type Guest = {
  id: string
  name: string | null
  email: string | null
  status: 'GOING' | 'INTERESTED' | 'NOT_GOING' | 'YET_TO_RESPOND'
  createdAt: string
}

export default function RsvpAdminPage({ params }: { params: { id: string } }) {
  const [rows, setRows] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [form, setForm] = useState<{ name: string; email: string; status: Guest['status']}>({
    name: '', email: '', status: 'YET_TO_RESPOND'
  })

  useEffect(() => {
    let aborted = false
    const load = async () => {
      try {
        const res = await fetch(`/api/events/${params.id}/rsvp/guests`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load guests')
        const data = await res.json()
        if (!aborted) {
          setRows(Array.isArray(data?.items) ? data.items : [])
          setLastUpdated(new Date())
        }
      } catch {
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    
    // Initial load
    load()
    
    // Auto-refresh every 15 seconds
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(() => {
        load()
      }, 15000)
    }
    
    return () => { 
      aborted = true
      if (interval) clearInterval(interval)
    }
  }, [params.id, autoRefresh])

  const goingCount = useMemo(() => rows.filter(r => r.status === 'GOING').length, [rows])
  const interestedCount = useMemo(() => rows.filter(r => r.status === 'INTERESTED').length, [rows])
  const notGoingCount = useMemo(() => rows.filter(r => r.status === 'NOT_GOING').length, [rows])
  const pendingCount = useMemo(() => rows.filter(r => r.status === 'YET_TO_RESPOND').length, [rows])

  const manualRefresh = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${params.id}/rsvp/guests`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load guests')
      const data = await res.json()
      setRows(Array.isArray(data?.items) ? data.items : [])
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to refresh RSVP data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            RSVP Management
          </h1>
          <p className="text-sm text-muted-foreground">Event ID: {params.id}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="flex items-center gap-1 text-green-600">
                <UserCheck className="h-4 w-4" />
                <span className="font-semibold">{goingCount}</span>
              </div>
              <div className="text-xs text-gray-500">Going</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-blue-600">
                <Eye className="h-4 w-4" />
                <span className="font-semibold">{interestedCount}</span>
              </div>
              <div className="text-xs text-gray-500">Maybe</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-red-600">
                <UserX className="h-4 w-4" />
                <span className="font-semibold">{notGoingCount}</span>
              </div>
              <div className="text-xs text-gray-500">Not Going</div>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">{pendingCount}</span>
              </div>
              <div className="text-xs text-gray-500">Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Status Bar */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {autoRefresh ? 'Auto-refresh enabled' : 'Manual mode'}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
          >
            {autoRefresh ? 'Disable Auto-refresh' : 'Enable Auto-refresh'}
          </button>
          <button
            onClick={manualRefresh}
            disabled={loading}
            className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>


      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6" colSpan={5}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-4 py-6 text-slate-500" colSpan={5}>No guests yet.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{r.name || '-'}</td>
                <td className="px-4 py-3">{r.email || '-'}</td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-md border px-2 py-1 text-sm"
                    value={r.status}
                    onChange={async (e)=>{
                      const status = e.target.value as Guest['status']
                      try{
                        const res = await fetch(`/api/events/${params.id}/rsvp/guests/${r.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
                        if(!res.ok) throw new Error('Failed to update status')
                        const u = await res.json()
                        setRows(prev=> prev.map(x=> x.id===r.id ? u : x))
                      }catch(e:any){ alert(e?.message || 'Failed to update status') }
                    }}
                  >
                    <option value="YET_TO_RESPOND">Yet to Respond</option>
                    <option value="GOING">Attending</option>
                    <option value="INTERESTED">Maybe</option>
                    <option value="NOT_GOING">Not Attending</option>
                  </select>
                </td>
                <td className="px-4 py-3">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="rounded-md border px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                    onClick={async ()=>{
                      const ok = window.confirm('Delete guest?')
                      if(!ok) return
                      try{
                        const res = await fetch(`/api/events/${params.id}/rsvp/guests/${r.id}`, { method: 'DELETE' })
                        if(!res.ok) throw new Error('Delete failed')
                        setRows(prev=> prev.filter(x=> x.id!==r.id))
                      }catch(e:any){ alert(e?.message || 'Failed to delete') }
                    }}
                  >Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
