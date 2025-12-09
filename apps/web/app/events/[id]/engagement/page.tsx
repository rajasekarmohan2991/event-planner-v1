"use client"

import { useSession } from "next-auth/react"
import ManageTabs from '@/components/events/ManageTabs'
import { useEffect, useMemo, useState } from 'react'

export default function EventEngagementPage({ params }: { params: { id: string } }) {
  const { status } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  const [registrations, setRegistrations] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])

  const totals = useMemo(()=>({
    registrations: registrations.length,
    tickets: tickets.length,
    sessions: sessions.length,
  }), [registrations, tickets, sessions])

  useEffect(() => {
    let aborted = false
    async function load() {
      try {
        setLoading(true); setError(null)
        const [rRes, tRes, sRes] = await Promise.all([
          fetch(`/api/events/${params.id}/registrations?page=0&size=50`, { cache: 'no-store', credentials: 'include' }),
          fetch(`/api/events/${params.id}/tickets`, { cache: 'no-store', credentials: 'include' }),
          fetch(`/api/events/${params.id}/sessions?page=0&size=50`, { cache: 'no-store', credentials: 'include' }),
        ])

        const rJson = rRes.ok ? await rRes.json() : { registrations: [] }
        const tJson = tRes.ok ? await tRes.json() : []
        const sJson = sRes.ok ? await sRes.json() : { content: [] }

        if (aborted) return
        // Handle new registrations API format
        const registrationsList = rJson?.registrations || rJson?.content || []
        setRegistrations(Array.isArray(registrationsList) ? registrationsList : [])
        setTickets(Array.isArray(tJson) ? tJson : (Array.isArray(tJson?.content) ? tJson.content : []))
        setSessions(Array.isArray(sJson?.content) ? sJson.content : [])
      } catch (e:any) {
        if (!aborted) setError(e?.message || 'Failed to load engagement metrics')
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    if (status !== 'loading') load()
    return () => { aborted = true }
  }, [status, params.id])

  if (status === 'loading') return <div className="p-6">Loading...</div>
  return (
    <div className="space-y-4">
      <ManageTabs eventId={params.id} />
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Engagement</h1>
        <span className="text-xs text-muted-foreground">Event ID: {params.id}</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-md border bg-white p-4">
          <div className="text-xs text-muted-foreground">Registrations</div>
          <div className="text-2xl font-semibold">{totals.registrations}</div>
        </div>
        <div className="rounded-md border bg-white p-4">
          <div className="text-xs text-muted-foreground">Tickets</div>
          <div className="text-2xl font-semibold">{totals.tickets}</div>
        </div>
        <div className="rounded-md border bg-white p-4">
          <div className="text-xs text-muted-foreground">Sessions</div>
          <div className="text-2xl font-semibold">{totals.sessions}</div>
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-sm text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="p-4 text-sm text-rose-600">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-md border bg-white p-4">
            <div className="text-sm font-medium mb-2">Recent Registrations</div>
            {registrations.length === 0 ? (
              <div className="text-sm text-muted-foreground">No registrations yet.</div>
            ) : (
              <ul className="text-sm divide-y">
                {registrations.slice(0,8).map((r:any)=> {
                  const name = r.firstName && r.lastName ? `${r.firstName} ${r.lastName}` : r.name || r.email || `#${r.id}`
                  const email = r.email || r.dataJson?.email || ''
                  const status = r.status || 'REGISTERED'
                  return (
                    <li key={r.id} className="py-2 flex items-center justify-between">
                      <div className="truncate">
                        <div className="font-medium truncate">{name}</div>
                        <div className="text-xs text-muted-foreground truncate">{email}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{status}</div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
          <div className="rounded-md border bg-white p-4">
            <div className="text-sm font-medium mb-2">Upcoming Sessions</div>
            {sessions.length === 0 ? (
              <div className="text-sm text-muted-foreground">No sessions yet.</div>
            ) : (
              <ul className="text-sm divide-y">
                {sessions.slice(0,8).map((s:any)=> (
                  <li key={s.id} className="py-2">
                    <div className="font-medium truncate">{s.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{s.startTime} → {s.endTime}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
