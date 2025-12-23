"use client"

import { useSession } from "next-auth/react"
import ManageTabs from '@/components/events/ManageTabs'
import { useEffect, useMemo, useState } from 'react'
import AvatarIcon from '@/components/ui/AvatarIcon'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'
import { format } from 'date-fns'

type session = { id: string; title: string; startTime: string; endTime: string; room?: string; track?: string; totalAttendees?: number }
type SpeakerItem = { id: number; name: string; title?: string; bio?: string; photoUrl?: string; createdAt?: string; sessions?: session[] }

export default function EventSpeakersPage({ params }: { params: { id: string } }) {
  const { status } = useSession()
  const [items, setItems] = useState<SpeakerItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const canSubmit = useMemo(() => name.trim().length > 0, [name])

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/events/${params.id}/speakers?page=0&size=20`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load speakers')
      const data = await res.json()
      const raw = data?.data || data?.content || (Array.isArray(data) ? data : [])
      const content = Array.isArray(raw) ? raw : []
      // Force DESC sort by createdAt
      content.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      setItems(content)
    } catch (e: any) {
      setError(e?.message || 'Failed to load speakers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status !== 'loading') {
      load()
      // Fetch sessions for dropdown
      fetch(`/api/events/${params.id}/sessions`, { credentials: 'include' })
        .then(r => {
          console.log('Sessions fetch response status:', r.status)
          if (!r.ok) throw new Error(`Failed to fetch sessions: ${r.status}`)
          return r.json()
        })
        .then(d => {
          console.log('Sessions data:', d)
          const sessionsList = d.sessions || d.content || (Array.isArray(d) ? d : [])
          console.log('Parsed sessions list:', sessionsList)
          setSessions(sessionsList)
        })
        .catch(e => {
          console.error('Sessions fetch error:', e)
          setSessions([])
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, params.id])

  if (status === 'loading') return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-4">
      <ManageTabs eventId={params.id} />
      <div className="flex items-center gap-2">
        <AvatarIcon seed={`event:${params.id}:speakers`} size={22} query="speakers,conference,portrait" />
        <h1 className="text-xl font-semibold">Speakers</h1>
      </div>

      {/* Add Speaker form */}
      <div className="rounded-md border p-4 space-y-3 bg-white">
        <h2 className="text-sm font-semibold">Add Speaker</h2>
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g., Jane Doe" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g., CTO, Acme Inc." />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Photo URL</label>
            <input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="https://..." />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Or upload photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  setUploadError(null)
                  setUploading(true)
                  const fd = new FormData()
                  fd.append('file', file)
                  const res = await fetch('/api/uploads', { method: 'POST', body: fd })
                  const data = await res.json().catch(() => null)
                  if (!res.ok) throw new Error(data?.message || 'Upload failed')
                  if (data?.url) setPhotoUrl(data.url)
                } catch (err: any) {
                  setUploadError(err?.message || 'Upload failed')
                } finally {
                  setUploading(false)
                }
              }}
            />
            {uploading ? <div className="mt-1 text-xs text-slate-500">Uploading...</div> : null}
            {uploadError ? <div className="mt-1 text-xs text-rose-600">{uploadError}</div> : null}
            {photoUrl ? (
              <div className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="Preview" className="h-12 w-12 rounded-full object-cover border" />
                <span className="text-xs text-slate-500">Preview</span>
              </div>
            ) : null}
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Assign to Session (Optional)</label>
            <select value={selectedSessionId} onChange={e => setSelectedSessionId(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm bg-white">
              <option value="">-- Create new session automatically --</option>
              {sessions.length === 0 && (
                <option disabled>No sessions available (create one first)</option>
              )}
              {sessions.map(s => <option key={s.id} value={s.id}>{s.title || `Session ${s.id}`}</option>)}
            </select>
            {sessions.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">💡 Tip: Create sessions first, then assign speakers to them</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm min-h-24" placeholder="Short bio" />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            disabled={!canSubmit}
            onClick={async () => {
              try {
                setError(null)
                const res = await fetch(`/api/events/${params.id}/speakers`, {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, title: title || undefined, bio: bio || undefined, photoUrl: photoUrl || undefined, sessionId: selectedSessionId || undefined })
                })
                const data = await res.json().catch(() => null)
                if (!res.ok) throw new Error(data?.message || 'Create failed')
                setName(''); setTitle(''); setBio(''); setPhotoUrl(''); setSelectedSessionId('')
                await load()
              } catch (e: any) {
                setError(e?.message || 'Create failed')
              }
            }}
          >
            Add Speaker
          </button>
        </div>
      </div>

      {/* List */}
      <div className="rounded-md border bg-white">
        <div className="p-3 text-sm font-medium border-b">All Speakers</div>
        {loading ? (
          <div className="p-4 text-sm text-slate-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">No speakers yet.</div>
        ) : (
          <ul className="divide-y">
            {items.map(s => (
              <SpeakerRow key={s.id} item={s} eventId={params.id} onChanged={load} setBanner={(m) => { setNotice(m); setTimeout(() => setNotice(null), 2500) }} />
            ))}
          </ul>
        )}
      </div>

      {notice && <div className="rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 px-3 py-2 text-sm">{notice}</div>}
    </div>
  )
}

function SpeakerRow({ item, eventId, onChanged, setBanner }: { item: SpeakerItem; eventId: string; onChanged: () => void; setBanner: (m: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [title, setTitle] = useState(item.title || '')
  const [photoUrl, setPhotoUrl] = useState(item.photoUrl || '')
  const [bio, setBio] = useState(item.bio || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | undefined>()

  const save = async () => {
    if (!name.trim()) { setErr('Name is required'); return }
    try {
      setBusy(true); setErr(undefined)
      const payload = { name: name.trim(), title: title || undefined, bio: bio || undefined, photoUrl: photoUrl || undefined }
      const res = await fetch(`/api/events/${eventId}/speakers/${item.id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message || 'Update failed')
      setEditing(false); setBanner('Speaker updated'); await onChanged()
    } catch (e: any) { setErr(e?.message || 'Update failed') }
    finally { setBusy(false) }
  }
  const del = async () => {
    if (!confirm('Delete this speaker?')) return
    try { setBusy(true); const res = await fetch(`/api/events/${eventId}/speakers/${item.id}`, { method: 'DELETE', credentials: 'include' }); if (!res.ok) { const t = await res.text(); throw new Error(t || 'Delete failed') }; setBanner('Speaker deleted'); await onChanged() } catch (e: any) { setErr(e?.message || 'Delete failed') } finally { setBusy(false) }
  }

  return (
    <li className="p-3">
      {!editing ? (
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {item.photoUrl ? (
              <img src={item.photoUrl} alt={item.name} className="h-10 w-10 rounded-full object-cover border border-slate-200" />
            ) : (
              <AvatarIcon seed={`speaker:${item.name}`} size={40} query="speaker,portrait,person" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-900">{item.name}</div>
              {item.title && <div className="text-xs text-slate-500 mb-1">{item.title}</div>}

              {/* Session / Calendar Details */}
              {item.sessions && item.sessions.length > 0 ? (
                <div className="mt-2 space-y-1.5">
                  {item.sessions.map((session) => (
                    <div key={session.id} className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs bg-slate-50 border border-slate-100 rounded-md p-2">
                      <div className="font-semibold text-indigo-600 truncate max-w-[200px]" title={session.title}>
                        {session.title}
                      </div>
                      <div className="flex items-center gap-3 text-slate-500">
                        <div className="flex items-center gap-1" title="Date">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(session.startTime), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Time">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(session.startTime), 'h:mm a')} – {format(new Date(session.endTime), 'h:mm a')}</span>
                        </div>
                        {session.room && (
                          <div className="flex items-center gap-1" title="Venue">
                            <MapPin className="h-3 w-3" />
                            <span>{session.room}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1" title="Capacity/Attendees">
                          <Users className="h-3 w-3" />
                          <span>{session.totalAttendees || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-1 text-xs text-slate-400 italic">No assigned sessions</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(true)} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50 text-slate-600">
              Edit
            </button>
            <button onClick={del} className="rounded-md border border-rose-200 text-rose-600 px-2.5 py-1.5 text-xs font-medium hover:bg-rose-50">
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {err && <div className="text-xs text-rose-600">{err}</div>}
          <div className="grid md:grid-cols-2 gap-2">
            <input value={name} onChange={e => setName(e.target.value)} className="rounded-md border px-2 py-1.5 text-sm" placeholder="Name" />
            <input value={title} onChange={e => setTitle(e.target.value)} className="rounded-md border px-2 py-1.5 text-sm" placeholder="Title" />
            <input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} className="md:col-span-2 rounded-md border px-2 py-1.5 text-sm" placeholder="Photo URL" />
            <textarea value={bio} onChange={e => setBio(e.target.value)} className="md:col-span-2 rounded-md border px-2 py-1.5 text-sm min-h-16" placeholder="Bio" />
          </div>
          <div className="flex items-center gap-2">
            <button disabled={busy} onClick={save} className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">Save</button>
            <button disabled={busy} onClick={() => setEditing(false)} className="rounded-md border px-3 py-1.5 text-xs">Cancel</button>
          </div>
        </div>
      )}
    </li>
  )
}
