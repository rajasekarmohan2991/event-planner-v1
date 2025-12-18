"use client"

import { useSession } from "next-auth/react"
import ManageTabs from '@/components/events/ManageTabs'
import { useEffect, useMemo, useState } from 'react'
import AvatarIcon from '@/components/ui/AvatarIcon'
import SessionCalendarView from '@/components/events/SessionCalendarView'
import { Calendar, List } from 'lucide-react'

type SessionItem = { id: number; title: string; description?: string; startTime: string; endTime: string; room?: string; track?: string; capacity?: number }
type SpeakerItem = { id: number; name: string; title?: string; bio?: string; company?: string; email?: string }

export default function EventSessionsPage({ params }: { params: { id: string } }) {
  const { status } = useSession()
  const [items, setItems] = useState<SessionItem[]>([])
  const [speakers, setSpeakers] = useState<SpeakerItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [room, setRoom] = useState('')
  const [track, setTrack] = useState('')
  const [capacity, setCapacity] = useState<string>('')
  const [selectedSpeakers, setSelectedSpeakers] = useState<number[]>([])
  const [addToCalendar, setAddToCalendar] = useState(true)
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [autoFetching, setAutoFetching] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar')
  const [event, setEvent] = useState<any>(null)

  const canSubmit = useMemo(() => title.trim().length > 0 && startTime && endTime, [title, startTime, endTime])

  // Validate session times against event times
  const validateSessionTime = (sessionStart: string, sessionEnd: string) => {
    if (!event) return { valid: true, message: '' }

    const eventStart = new Date(event.startsAt || event.startDate)
    const eventEnd = new Date(event.endsAt || event.endDate)
    const sessStart = new Date(sessionStart)
    const sessEnd = new Date(sessionEnd)

    if (sessStart < eventStart) {
      return {
        valid: false,
        message: `Session cannot start before event starts (${eventStart.toLocaleString()})`
      }
    }

    if (sessEnd > eventEnd) {
      return {
        valid: false,
        message: `Session cannot end after event ends (${eventEnd.toLocaleString()})`
      }
    }

    return { valid: true, message: '' }
  }

  // Auto-fetch session details when selected
  const handleSessionSelect = async (sessionId: string) => {
    if (!sessionId) {
      // Clear form
      setTitle('')
      setDescription('')
      setStartTime('')
      setEndTime('')
      setRoom('')
      setTrack('')
      setCapacity('')
      setSelectedSpeakers([])
      setSelectedSessionId('')
      return
    }

    try {
      setAutoFetching(true)
      setSelectedSessionId(sessionId)

      const res = await fetch(`/api/events/${params.id}/sessions/${sessionId}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch session details')

      const apiSessionData = await res.json()

      // Auto-populate form fields
      setTitle(apiSessionData.title || '')
      setDescription(apiSessionData.description || '')
      setStartTime(apiSessionData.startTime ? new Date(apiSessionData.startTime).toISOString().slice(0, 16) : '')
      setEndTime(apiSessionData.endTime ? new Date(apiSessionData.endTime).toISOString().slice(0, 16) : '')
      setRoom(apiSessionData.room || '')
      setTrack(apiSessionData.track || '')
      setCapacity(apiSessionData.capacity ? String(apiSessionData.capacity) : '')

      // Auto-populate speakers if available
      if (apiSessionData.speakers && apiSessionData.speakers.length > 0) {
        const speakerIds = apiSessionData.speakers.map((s: any) => parseInt(s.id))
        setSelectedSpeakers(speakerIds)
      } else if (apiSessionData.speakerIds && apiSessionData.speakerIds.length > 0) {
        setSelectedSpeakers(apiSessionData.speakerIds)
      }

      setNotice(`✓ Session details loaded: ${apiSessionData.title}`)
      setTimeout(() => setNotice(null), 3000)
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch session details')
    } finally {
      setAutoFetching(false)
    }
  }

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/events/${params?.id}/sessions`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load sessions');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      // Load speakers for attach UI
      const sp = await fetch(`/api/events/${params.id}/speakers?page=0&size=100`, { credentials: 'include' })
      if (sp.ok) {
        const sdata = await sp.json()
        const sc = Array.isArray(sdata?.content) ? sdata.content : []
        setSpeakers(sc.map((s: any) => ({
          id: s.id,
          name: s.name,
          title: s.title,
          bio: s.bio,
          company: s.company,
          email: s.email
        })))
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      if (status === 'loading') return

      // Fetch event details for validation
      try {
        const eventRes = await fetch(`/api/events/${params.id}`, { credentials: 'include' })
        if (eventRes.ok) {
          const eventData = await eventRes.json()
          setEvent(eventData)
        }
      } catch (e) {
        console.error('Failed to fetch event:', e)
      }

      // Fetch sessions
      await load()
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, params.id])

  if (status === 'loading') return <div className="p-6">Loading...</div>
  return (
    <div className="space-y-4">
      <ManageTabs eventId={params.id} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AvatarIcon seed={`event:${params.id}:sessions`} size={22} query="sessions,conference,event" />
          <div>
            <h1 className="text-xl font-semibold">Sessions</h1>
            <p className="text-sm text-muted-foreground">Manage event sessions and schedules</p>
          </div>
        </div>
      </div>

      {/* Add Session form */}
      <div className="rounded-md border p-4 space-y-3 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Add Session</h2>
          {autoFetching && <span className="text-xs text-blue-600">⏳ Loading session details...</span>}
        </div>
        {error && <div className="text-sm text-rose-600">{error}</div>}
        {notice && <div className="text-sm text-green-600">{notice}</div>}

        {/* Event Time Range Info */}
        {event && (event.startsAt || event.startDate) && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-xs font-semibold text-blue-900 mb-1">
              📅 Event Time Range
            </div>
            <div className="text-xs text-blue-700">
              {new Date(event.startsAt || event.startDate).toLocaleString()}
              {' → '}
              {new Date(event.endsAt || event.endDate).toLocaleString()}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              ℹ️ Sessions must be created within this time range
            </div>
          </div>
        )}
        {/* Session Selector for Auto-Fetch */}
        {items.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <label className="block text-xs font-semibold text-blue-900 mb-2">
              🔄 Quick Edit: Select Existing Session to Auto-Fill
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => handleSessionSelect(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              disabled={autoFetching}
            >
              <option value="">-- Create New Session --</option>
              {items.map(session => (
                <option key={session.id} value={session.id}>
                  {session.title} ({new Date(session.startTime).toLocaleString()})
                </option>
              ))}
            </select>
            <p className="text-xs text-blue-700 mt-1">
              Select a session to automatically populate all fields including speakers
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g., Opening Keynote" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Track</label>
            <input value={track} onChange={e => setTrack(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g., Main" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Room</label>
            <input value={room} onChange={e => setRoom(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g., Hall A" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Capacity</label>
            <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g., 200" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Starts</label>
            <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Ends</label>
            <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm min-h-24" placeholder="Session details" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Select Speakers</label>
            {speakers.length === 0 ? (
              <div className="border rounded-md p-4 text-center bg-amber-50 border-amber-200">
                <div className="text-sm text-amber-700 mb-2">⚠️ No speakers available</div>
                <div className="text-xs text-amber-600 mb-3">
                  Add speakers first to assign them to sessions. This follows the speakers-first workflow.
                </div>
                <a
                  href={`/events/${params.id}/speakers`}
                  className="inline-flex items-center gap-1 text-xs bg-amber-600 text-white px-3 py-1.5 rounded-md hover:bg-amber-700"
                >
                  🎤 Add Speakers First
                </a>
              </div>
            ) : (
              <div>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2 mb-3">
                  {speakers.map(speaker => (
                    <label key={speaker.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedSpeakers.includes(speaker.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSpeakers([...selectedSpeakers, speaker.id])
                          } else {
                            setSelectedSpeakers(selectedSpeakers.filter(id => id !== speaker.id))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">{speaker.name}</span>
                    </label>
                  ))}
                </div>
                {/* Show selected speaker details */}
                {selectedSpeakers.length > 0 && (
                  <div className="border rounded-md p-3 bg-blue-50 border-blue-200">
                    <div className="text-xs font-semibold text-blue-900 mb-2">✓ Selected Speakers ({selectedSpeakers.length})</div>
                    <div className="space-y-2">
                      {selectedSpeakers.map(speakerId => {
                        const speaker = speakers.find(s => s.id === speakerId)
                        if (!speaker) return null
                        return (
                          <div key={speaker.id} className="bg-white rounded p-2 border border-blue-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900">{speaker.name}</div>
                                {speaker.title && (
                                  <div className="text-xs text-gray-600">{speaker.title}</div>
                                )}
                                {speaker.company && (
                                  <div className="text-xs text-gray-500">{speaker.company}</div>
                                )}
                                {speaker.bio && (
                                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">{speaker.bio}</div>
                                )}
                                {speaker.email && (
                                  <div className="text-xs text-blue-600 mt-1">{speaker.email}</div>
                                )}
                              </div>
                              <button
                                onClick={() => setSelectedSpeakers(selectedSpeakers.filter(id => id !== speaker.id))}
                                className="text-xs text-red-600 hover:text-red-800 ml-2"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={addToCalendar}
                onChange={(e) => setAddToCalendar(e.target.checked)}
              />
              <span className="text-xs text-slate-600">Add to calendar events</span>
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            disabled={!canSubmit}
            onClick={async () => {
              try {
                setError(null)
                if (!title.trim()) { setError('Title is required'); return }
                if (!startTime) { setError('Start time is required'); return }
                if (!endTime) { setError('End time is required'); return }
                if (new Date(endTime) <= new Date(startTime)) { setError('End time must be after start time'); return }

                // Validate session time against event time
                const validation = validateSessionTime(startTime, endTime)
                if (!validation.valid) {
                  setError(validation.message)
                  return
                }
                const payload = {
                  title: title.trim(),
                  description: description || undefined,
                  startTime: new Date(startTime).toISOString(),
                  endTime: new Date(endTime).toISOString(),
                  room: room || undefined,
                  track: track || undefined,
                  capacity: capacity ? Number(capacity) : undefined,
                  speakers: selectedSpeakers,
                  addToCalendar: addToCalendar,
                }
                const res = await fetch(`/api/events/${params.id}/sessions`, {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                })
                const data = await res.json().catch(() => null)
                if (!res.ok) throw new Error(data?.message || 'Create failed')
                setTitle(''); setDescription(''); setStartTime(''); setEndTime(''); setRoom(''); setTrack(''); setCapacity(''); setSelectedSpeakers([])
                await load()
              } catch (e: any) {
                setError(e?.message || 'Create failed')
              }
            }}
          >
            Add Session
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">All Sessions</h3>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'calendar'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            <List className="h-4 w-4" />
            List
          </button>
        </div>
      </div>

      {/* Calendar or List View */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading sessions...</div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-gray-50 rounded-lg border-2 border-dashed">
          No sessions yet. Create your first session above!
        </div>
      ) : viewMode === 'calendar' ? (
        <SessionCalendarView
          sessions={items}
          onSessionClick={(sessionId) => {
            handleSessionSelect(String(sessionId))
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      ) : (
        <div className="rounded-md border bg-white">
          <div className="p-3 text-sm font-medium border-b">All Sessions</div>
          <ul className="divide-y">
            {items.map(s => (
              <SessionRow key={s.id} item={s} eventId={params.id} onChanged={load} speakers={speakers} setBanner={(m) => { setNotice(m); setTimeout(() => setNotice(null), 2500) }} />
            ))}
          </ul>
        </div>
      )}

      {notice && <div className="rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 px-3 py-2 text-sm">{notice}</div>}
    </div>
  )
}

function SessionRow({ item, eventId, onChanged, speakers, setBanner }: { item: SessionItem; eventId: string; onChanged: () => void; speakers: SpeakerItem[]; setBanner: (m: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [startTime, setStartTime] = useState(() => new Date(item.startTime).toISOString().slice(0, 16))
  const [endTime, setEndTime] = useState(() => new Date(item.endTime).toISOString().slice(0, 16))
  const [room, setRoom] = useState(item.room || '')
  const [track, setTrack] = useState(item.track || '')
  const [capacity, setCapacity] = useState<string>(item.capacity ? String(item.capacity) : '')
  const [description, setDescription] = useState(item.description || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | undefined>()
  const [attachId, setAttachId] = useState<string>('')

  const save = async () => {
    if (!title.trim() || !startTime || !endTime) { setErr('Title, start and end are required'); return }
    if (new Date(endTime) <= new Date(startTime)) { setErr('End time must be after start'); return }
    try {
      setBusy(true); setErr(undefined)
      const payload = {
        title: title.trim(),
        description: description || undefined,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        room: room || undefined,
        track: track || undefined,
        capacity: capacity ? Number(capacity) : undefined,
      }
      const res = await fetch(`/api/events/${eventId}/sessions/${item.id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message || 'Update failed')
      setEditing(false); setBanner('Session updated'); await onChanged()
    } catch (e: any) { setErr(e?.message || 'Update failed') }
    finally { setBusy(false) }
  }
  const del = async () => {
    if (!confirm('Delete this session?')) return
    try { setBusy(true); const res = await fetch(`/api/events/${eventId}/sessions/${item.id}`, { method: 'DELETE', credentials: 'include' }); if (!res.ok) { const t = await res.text(); throw new Error(t || 'Delete failed') }; setBanner('Session deleted'); await onChanged() } catch (e: any) { setErr(e?.message || 'Delete failed') } finally { setBusy(false) }
  }
  const attach = async () => {
    if (!attachId) return
    try { setBusy(true); const res = await fetch(`/api/events/${eventId}/sessions/${item.id}/speakers/${attachId}`, { method: 'POST', credentials: 'include' }); const t = await res.text(); if (!res.ok) throw new Error(t || 'Attach failed'); setBanner('Speaker attached'); setAttachId('') } catch (e: any) { setErr(e?.message || 'Attach failed') } finally { setBusy(false) }
  }
  const detach = async (speakerId: number) => {
    try { setBusy(true); const res = await fetch(`/api/events/${eventId}/sessions/${item.id}/speakers/${speakerId}`, { method: 'DELETE', credentials: 'include' }); const t = await res.text(); if (!res.ok) throw new Error(t || 'Detach failed'); setBanner('Speaker detached') } catch (e: any) { setErr(e?.message || 'Detach failed') } finally { setBusy(false) }
  }

  return (
    <li className="p-3">
      {!editing ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate inline-flex items-center gap-2">
              <AvatarIcon seed={`session:${item.title}`} size={18} query="session,talk,stage" />
              {item.title}
            </div>
            <div className="text-xs text-slate-500 truncate">{new Date(item.startTime).toLocaleString()} → {new Date(item.endTime).toLocaleString()} {item.room ? `· ${item.room}` : ''}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(true)} className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50">Edit</button>
            <button onClick={del} className="rounded-md border border-rose-300 text-rose-700 px-2 py-1 text-xs hover:bg-rose-50">Delete</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {err && <div className="text-xs text-rose-600">{err}</div>}
          <div className="grid md:grid-cols-2 gap-2">
            <input value={title} onChange={e => setTitle(e.target.value)} className="rounded-md border px-2 py-1.5 text-sm" />
            <input type="text" value={track} onChange={e => setTrack(e.target.value)} className="rounded-md border px-2 py-1.5 text-sm" placeholder="Track" />
            <input type="text" value={room} onChange={e => setRoom(e.target.value)} className="rounded-md border px-2 py-1.5 text-sm" placeholder="Room" />
            <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} className="rounded-md border px-2 py-1.5 text-sm" placeholder="Capacity" />
            <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="rounded-md border px-2 py-1.5 text-sm" />
            <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="rounded-md border px-2 py-1.5 text-sm" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="md:col-span-2 rounded-md border px-2 py-1.5 text-sm min-h-16" placeholder="Description" />
          </div>
          <div className="flex items-center gap-2">
            <button disabled={busy} onClick={save} className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">Save</button>
            <button disabled={busy} onClick={() => setEditing(false)} className="rounded-md border px-3 py-1.5 text-xs">Cancel</button>
          </div>
          {/* Attach speaker */}
          <div className="pt-2 border-t mt-2">
            <div className="text-xs text-slate-600 mb-1">Attach Speaker</div>
            <div className="flex items-center gap-2">
              <select value={attachId} onChange={e => setAttachId(e.target.value)} className="rounded-md border px-2 py-1 text-xs">
                <option value="">Select speaker</option>
                {speakers.map(sp => (<option key={sp.id} value={sp.id}>{sp.name}</option>))}
              </select>
              <button disabled={busy || !attachId} onClick={attach} className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50">Attach</button>
            </div>
            {/* Detach hint (requires session.speakers in payload; backend may not include it in list API) */}
          </div>
        </div>
      )}
    </li>
  )
}
