"use client"
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

export default function MicrositePage() {
  const { status } = useSession()
  const params = useParams<{ id: string }>()
  const eventId = String(params?.id || '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ slug: '', visibility: 'public', seoTitle: '', seoDescription: '', ogImageUrl: '' })

  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/events/${eventId}/design/microsite`, { cache: 'no-store' })
        if (!aborted && res.ok) {
          const data = await res.json()
          setForm({
            slug: data.slug || '',
            visibility: data.visibility || 'public',
            seoTitle: data.seoTitle || '',
            seoDescription: data.seoDescription || '',
            ogImageUrl: data.ogImageUrl || ''
          })
        }
      } catch {}
      finally { if (!aborted) setLoading(false) }
    })()
    return () => { aborted = true }
  }, [eventId])

  const save = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/events/${eventId}/design/microsite`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('Failed to save')
      toast({ title: 'Microsite saved' })
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Try again', variant: 'destructive' as any })
    } finally { setSaving(false) }
  }

  if (status === 'loading' || loading) return <div className="p-6 animate-pulse">Loading microsite…</div>

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Microsite</h1>
        <p className="text-sm text-muted-foreground">Configure your public event page.</p>
      </header>

      <div className="rounded-lg border p-4 space-y-4">
        <div>
          <label className="text-sm">Slug</label>
          <input className="mt-1 w-full rounded border px-3 py-2 text-sm" value={form.slug} onChange={e=>setForm({ ...form, slug: e.target.value })} placeholder="my-event" />
          <p className="text-xs text-muted-foreground mt-1">Preview: {process.env.NEXT_PUBLIC_EVENT_MICROSITES_BASE ? `${process.env.NEXT_PUBLIC_EVENT_MICROSITES_BASE}/${form.slug || 'your-slug'}` : `/{slug}`}</p>
        </div>
        <div>
          <label className="text-sm">Visibility</label>
          <select className="mt-1 w-full rounded border px-3 py-2 text-sm" value={form.visibility} onChange={e=>setForm({ ...form, visibility: e.target.value })}>
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div>
          <label className="text-sm">SEO Title</label>
          <input className="mt-1 w-full rounded border px-3 py-2 text-sm" value={form.seoTitle} onChange={e=>setForm({ ...form, seoTitle: e.target.value })} />
        </div>
        <div>
          <label className="text-sm">SEO Description</label>
          <textarea className="mt-1 w-full rounded border px-3 py-2 text-sm" rows={3} value={form.seoDescription} onChange={e=>setForm({ ...form, seoDescription: e.target.value })} />
        </div>
        <div>
          <label className="text-sm">OG Image URL</label>
          <input className="mt-1 w-full rounded border px-3 py-2 text-sm" value={form.ogImageUrl} onChange={e=>setForm({ ...form, ogImageUrl: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className={`px-4 py-2 text-sm rounded-md ${saving ? 'bg-indigo-100 text-indigo-700 animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{saving ? 'Saving…' : 'Save Microsite'}</button>
          <button onClick={()=>window.location.reload()} className="px-4 py-2 text-sm rounded-md border hover:bg-slate-50">Reset</button>
        </div>
      </div>
    </div>
  )
}
