"use client"
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

export default function ThemePage() {
  const { status } = useSession()
  const params = useParams<{ id: string }>()
  const eventId = String(params?.id || '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [theme, setTheme] = useState<{ preset?: string; rounded?: boolean; density?: 'comfortable'|'compact' } | null>(null)

  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/events/${eventId}/design/theme`, { cache: 'no-store' })
        if (!aborted && res.ok) setTheme(await res.json())
      } catch {}
      finally { if (!aborted) setLoading(false) }
    })()
    return () => { aborted = true }
  }, [eventId])

  const save = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/events/${eventId}/design/theme`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(theme || {})
      })
      if (!res.ok) throw new Error('Failed to save')
      toast({ title: 'Theme saved' })
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Try again', variant: 'destructive' as any })
    } finally { setSaving(false) }
  }

  if (status === 'loading' || loading) return <div className="p-6 animate-pulse">Loading theme…</div>

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Theme</h1>
        <p className="text-sm text-muted-foreground">Choose presets and layout options.</p>
      </header>

      <div className="rounded-lg border p-4 space-y-4">
        <div>
          <label className="text-sm">Preset</label>
          <select
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={theme?.preset || ''}
            onChange={e => setTheme(prev => ({ ...(prev||{}), preset: e.target.value }))}
          >
            <option value="">Default</option>
            <option value="indigo">Indigo</option>
            <option value="emerald">Emerald</option>
            <option value="rose">Rose</option>
            <option value="slate">Slate</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input id="rounded" type="checkbox" checked={!!theme?.rounded} onChange={e => setTheme(prev => ({ ...(prev||{}), rounded: e.target.checked }))} />
          <label htmlFor="rounded" className="text-sm">Use rounded components</label>
        </div>
        <div>
          <label className="text-sm">Density</label>
          <select
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={theme?.density || 'comfortable'}
            onChange={e => setTheme(prev => ({ ...(prev||{}), density: e.target.value as any }))}
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className={`px-4 py-2 text-sm rounded-md ${saving ? 'bg-indigo-100 text-indigo-700 animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{saving ? 'Saving…' : 'Save Theme'}</button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload()
              }
            }}
            className="px-4 py-2 text-sm rounded-md border hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
