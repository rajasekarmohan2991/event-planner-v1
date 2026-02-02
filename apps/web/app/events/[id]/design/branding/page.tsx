"use client"
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

export default function BrandingPage() {
  const { status } = useSession()
  const params = useParams<{ id: string }>()
  const eventId = String(params?.id || '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [logoUrl, setLogoUrl] = useState('')
  const [faviconUrl, setFaviconUrl] = useState('')
  const [brandName, setBrandName] = useState('')
  const [primary, setPrimary] = useState('#4f46e5')
  const [secondary, setSecondary] = useState('#8b5cf6')
  const [accent, setAccent] = useState('#f472b6')
  const [fontFamily, setFontFamily] = useState('Inter, system-ui, sans-serif')
  const [buttonStyle, setButtonStyle] = useState<'solid'|'outline'>('solid')

  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/design/branding`, { cache: 'no-store' })
        const data = res.ok ? await res.json() : {}
        if (!aborted && data) {
          setLogoUrl(data.logoUrl || '')
          setFaviconUrl(data.faviconUrl || '')
          setBrandName(data.brandName || '')
          setPrimary(data.primary || '#4f46e5')
          setSecondary(data.secondary || '#8b5cf6')
          setAccent(data.accent || '#f472b6')
          setFontFamily(data.fontFamily || 'Inter, system-ui, sans-serif')
          setButtonStyle((data.buttonStyle as any) || 'solid')
        }
      } finally {
        if (!aborted) setLoading(false)
      }
    })()
    return () => { aborted = true }
  }, [eventId])

  const save = async () => {
    try {
      setSaving(true)
      const body = { logoUrl, faviconUrl, brandName, primary, secondary, accent, fontFamily, buttonStyle }
      const res = await fetch(`/api/events/${eventId}/design/branding`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Save failed')
      toast({ title: 'Branding saved' })
    } catch (e:any) {
      toast({ title: 'Save failed', description: e?.message || 'Unable to save', variant: 'destructive' as any })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="animate-pulse h-28 bg-gray-100 dark:bg-slate-800 rounded" />

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Branding</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-slate-500">Brand Name</label>
          <input className="w-full rounded-md border px-3 py-2 text-sm" value={brandName} onChange={e=>setBrandName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-500">Logo URL</label>
          <input className="w-full rounded-md border px-3 py-2 text-sm" value={logoUrl} onChange={e=>setLogoUrl(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-500">Favicon URL</label>
          <input className="w-full rounded-md border px-3 py-2 text-sm" value={faviconUrl} onChange={e=>setFaviconUrl(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-500">Primary Color</label>
          <input type="color" className="h-10 w-16 rounded border" value={primary} onChange={e=>setPrimary(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-500">Secondary Color</label>
          <input type="color" className="h-10 w-16 rounded border" value={secondary} onChange={e=>setSecondary(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-500">Accent Color</label>
          <input type="color" className="h-10 w-16 rounded border" value={accent} onChange={e=>setAccent(e.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs text-slate-500">Font Family</label>
          <input className="w-full rounded-md border px-3 py-2 text-sm" value={fontFamily} onChange={e=>setFontFamily(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-500">Button Style</label>
          <select className="w-full rounded-md border px-3 py-2 text-sm" value={buttonStyle} onChange={e=>setButtonStyle(e.target.value as any)}>
            <option value="solid">Solid</option>
            <option value="outline">Outline</option>
          </select>
        </div>
      </div>
      <div>
        <button onClick={save} disabled={saving} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white ${saving? 'bg-indigo-400 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
