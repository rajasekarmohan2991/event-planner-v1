"use client"

import { useSession } from "next-auth/react"
import ManageTabs from '@/components/events/ManageTabs'
import { useEffect, useMemo, useState } from 'react'
import AvatarIcon from '@/components/ui/AvatarIcon'

type SpeakerItem = { id: number; name: string; title?: string; bio?: string; photoUrl?: string }

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
  const canSubmit = useMemo(() => name.trim().length > 0, [name])

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/events/${params.id}/speakers?page=0&size=20`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load speakers')
      const data = await res.json()
      const content = Array.isArray(data?.content) ? data.content : []
      setItems(content)
    } catch (e: any) {
      setError(e?.message || 'Failed to load speakers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status !== 'loading') load()
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
      <p className="text-sm text-muted-foreground">Event ID: {params.id}</p>

      {/* Add Speaker form */}
      <div className="rounded-md border p-4 space-y-3 bg-white">
        <h2 className="text-sm font-semibold">Add Speaker</h2>
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g., Jane Doe" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Title</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g., CTO, Acme Inc." />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Photo URL</label>
            <input value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="https://..." />
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
                  const data = await res.json().catch(()=>null)
                  if (!res.ok) throw new Error(data?.message || 'Upload failed')
                  if (data?.url) setPhotoUrl(data.url)
                } catch (err:any) {
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
                <img src={photoUrl} alt="Preview" className="h-12 w-12 rounded-full object-cover border"/>
                <span className="text-xs text-slate-500">Preview</span>
              </div>
            ) : null}
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Bio</label>
            <textarea value={bio} onChange={e=>setBio(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm min-h-24" placeholder="Short bio" />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            disabled={!canSubmit}
            onClick={async ()=>{
              try {
                setError(null)
                const res = await fetch(`/api/events/${params.id}/speakers`, {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, title: title || undefined, bio: bio || undefined, photoUrl: photoUrl || undefined })
                })
                const data = await res.json().catch(()=>null)
                if (!res.ok) throw new Error(data?.message || 'Create failed')
                setName(''); setTitle(''); setBio(''); setPhotoUrl('')
                await load()
              } catch (e:any) {
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
              <SpeakerRow key={s.id} item={s} eventId={params.id} onChanged={load} setBanner={(m)=>{ setNotice(m); setTimeout(()=> setNotice(null), 2500) }} />
            ))}
          </ul>
        )}
      </div>

      {notice && <div className="rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 px-3 py-2 text-sm">{notice}</div>}
    </div>
  )
}

function SpeakerRow({ item, eventId, onChanged, setBanner }:{ item: SpeakerItem; eventId: string; onChanged: ()=>void; setBanner:(m:string)=>void }){
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [title, setTitle] = useState(item.title || '')
  const [photoUrl, setPhotoUrl] = useState(item.photoUrl || '')
  const [bio, setBio] = useState(item.bio || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string|undefined>()

  const save = async ()=>{
    if (!name.trim()) { setErr('Name is required'); return }
    try{
      setBusy(true); setErr(undefined)
      const payload = { name: name.trim(), title: title || undefined, bio: bio || undefined, photoUrl: photoUrl || undefined }
      const res = await fetch(`/api/events/${eventId}/speakers/${item.id}`, { method:'PUT', credentials:'include', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json().catch(()=>null)
      if (!res.ok) throw new Error(data?.message||'Update failed')
      setEditing(false); setBanner('Speaker updated'); await onChanged()
    }catch(e:any){ setErr(e?.message||'Update failed') }
    finally{ setBusy(false) }
  }
  const del = async ()=>{
    if (!confirm('Delete this speaker?')) return
    try{ setBusy(true); const res = await fetch(`/api/events/${eventId}/speakers/${item.id}`, { method:'DELETE', credentials:'include' }); if(!res.ok){ const t=await res.text(); throw new Error(t||'Delete failed')}; setBanner('Speaker deleted'); await onChanged() }catch(e:any){ setErr(e?.message||'Delete failed') } finally{ setBusy(false) }
  }

  return (
    <li className="p-3">
      {!editing ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {item.photoUrl ? <img src={item.photoUrl} alt={item.name} className="h-8 w-8 rounded-full object-cover"/> : <AvatarIcon seed={`speaker:${item.name}`} size={32} query="speaker,portrait,person" />}
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{item.name}</div>
              {item.title ? <div className="text-xs text-slate-500 truncate">{item.title}</div> : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=> setEditing(true)} className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50">Edit</button>
            <button onClick={del} className="rounded-md border border-rose-300 text-rose-700 px-2 py-1 text-xs hover:bg-rose-50">Delete</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {err && <div className="text-xs text-rose-600">{err}</div>}
          <div className="grid md:grid-cols-2 gap-2">
            <input value={name} onChange={e=>setName(e.target.value)} className="rounded-md border px-2 py-1.5 text-sm" placeholder="Name" />
            <input value={title} onChange={e=>setTitle(e.target.value)} className="rounded-md border px-2 py-1.5 text-sm" placeholder="Title" />
            <input value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} className="md:col-span-2 rounded-md border px-2 py-1.5 text-sm" placeholder="Photo URL" />
            <textarea value={bio} onChange={e=>setBio(e.target.value)} className="md:col-span-2 rounded-md border px-2 py-1.5 text-sm min-h-16" placeholder="Bio" />
          </div>
          <div className="flex items-center gap-2">
            <button disabled={busy} onClick={save} className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">Save</button>
            <button disabled={busy} onClick={()=> setEditing(false)} className="rounded-md border px-3 py-1.5 text-xs">Cancel</button>
          </div>
        </div>
      )}
    </li>
  )
}
