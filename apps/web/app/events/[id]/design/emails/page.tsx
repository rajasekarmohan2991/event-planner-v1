"use client"
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

export default function EmailsPage() {
  const { status } = useSession()
  const params = useParams<{ id: string }>()
  const eventId = String(params?.id || '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  const [config, setConfig] = useState({ fromName: '', replyTo: '', templateSubject: '', templateBody: '' })

  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/events/${eventId}/design/emails`, { cache: 'no-store' })
        if (!aborted && res.ok) {
          const data = await res.json()
          setConfig({
            fromName: data.fromName || '',
            replyTo: data.replyTo || '',
            templateSubject: data.templateSubject || '',
            templateBody: data.templateBody || ''
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
      const res = await fetch(`/api/events/${eventId}/design/emails`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config)
      })
      if (!res.ok) throw new Error('Failed to save')
      toast({ title: 'Email settings saved' })
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Try again', variant: 'destructive' as any })
    } finally { setSaving(false) }
  }

  const sendTest = async () => {
    try {
      setSending(true)
      const res = await fetch(`/api/events/${eventId}/design/emails`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'sendTest' })
      })
      if (!res.ok) throw new Error('Send test failed (check SMTP env)')
      toast({ title: 'Test email sent' })
    } catch (e: any) {
      toast({ title: 'Test failed', description: e?.message || 'Check SMTP configuration', variant: 'destructive' as any })
    } finally { setSending(false) }
  }

  if (status === 'loading' || loading) return <div className="p-6 animate-pulse">Loading emails…</div>

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Emails</h1>
        <p className="text-sm text-muted-foreground">Configure sender and default templates. Use Send Test to verify SMTP.</p>
      </header>

      <div className="rounded-lg border p-4 space-y-4">
        <div>
          <label className="text-sm">From Name</label>
          <input className="mt-1 w-full rounded border px-3 py-2 text-sm" value={config.fromName} onChange={e=>setConfig({ ...config, fromName: e.target.value })} />
        </div>
        <div>
          <label className="text-sm">Reply-To</label>
          <input className="mt-1 w-full rounded border px-3 py-2 text-sm" value={config.replyTo} onChange={e=>setConfig({ ...config, replyTo: e.target.value })} placeholder="you@example.com" />
        </div>
        <div>
          <label className="text-sm">Template Subject</label>
          <input className="mt-1 w-full rounded border px-3 py-2 text-sm" value={config.templateSubject} onChange={e=>setConfig({ ...config, templateSubject: e.target.value })} />
        </div>
        <div>
          <label className="text-sm">Template Body</label>
          <textarea className="mt-1 w-full rounded border px-3 py-2 text-sm" rows={6} value={config.templateBody} onChange={e=>setConfig({ ...config, templateBody: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className={`px-4 py-2 text-sm rounded-md ${saving ? 'bg-indigo-100 text-indigo-700 animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{saving ? 'Saving…' : 'Save Settings'}</button>
          <button onClick={sendTest} disabled={sending} className={`px-4 py-2 text-sm rounded-md border ${sending ? 'animate-pulse' : 'hover:bg-slate-50'}`}>{sending ? 'Sending…' : 'Send Test'}</button>
        </div>
      </div>
    </div>
  )
}
