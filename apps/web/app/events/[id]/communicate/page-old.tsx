"use client"
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { Mail, Megaphone, MessageSquare, Send } from 'lucide-react'

export default function EventCommunicatePage() {
  const { status } = useSession()
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const eventId = String(params?.id || '')
  const [subj, setSubj] = useState('Test message')
  const [body, setBody] = useState('Hello from Event Planner!')
  const [sending, setSending] = useState(false)

  const sendTest = async () => {
    try {
      setSending(true)
      const res = await fetch(`/api/events/${eventId}/attendees/email`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          subject: subj, 
          html: `<p>${body}</p>`,
          testEmail: undefined, // backend will use configured sender or you can add an input to target yourself
          includeRegistrations: true,
          includeRsvps: true,
          dedupe: true,
          dryRun: false
        })
      })
      if (!res.ok) throw new Error('Send test failed (check SMTP / EMAIL_* env)')
      toast({ title: 'Test sent', description: 'Check your inbox' })
    } catch (e: any) {
      toast({ title: 'Test failed', description: e?.message || 'SMTP not configured', variant: 'destructive' as any })
    } finally { setSending(false) }
  }

  if (status === 'loading') return <div className="p-6">Loading…</div>

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Communicate</h1>
          <p className="text-sm text-muted-foreground">Send emails and announcements to attendees.</p>
        </div>
      </header>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-3">
        <button onClick={() => router.push(`/events/${eventId}/design/emails`)} className="rounded-md border p-4 text-left hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-indigo-600" />
            <div className="font-medium">Email Settings</div>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Configure sender and templates.</div>
        </button>
        <button className="rounded-md border p-4 text-left hover:shadow-sm transition-shadow" onClick={() => toast({ title: 'Announcements coming soon' })}>
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-emerald-600" />
            <div className="font-medium">Announcements</div>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Notify attendees via email/app.</div>
        </button>
        <button className="rounded-md border p-4 text-left hover:shadow-sm transition-shadow" onClick={() => toast({ title: 'SMS coming soon' })}>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-orange-600" />
            <div className="font-medium">SMS</div>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Transactional updates (optional).</div>
        </button>
      </div>

      {/* Send test */}
      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-medium mb-3 flex items-center gap-2"><Send className="h-4 w-4" /> Send Test</h2>
        <div className="grid gap-3">
          <div>
            <label className="text-sm">Subject</label>
            <input className="mt-1 w-full rounded border px-3 py-2 text-sm" value={subj} onChange={e=>setSubj(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">Message</label>
            <textarea className="mt-1 w-full rounded border px-3 py-2 text-sm" rows={5} value={body} onChange={e=>setBody(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={sendTest} disabled={sending} className={`px-4 py-2 text-sm rounded-md ${sending ? 'bg-indigo-100 text-indigo-700 animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{sending ? 'Sending…' : 'Send Test'}</button>
            <button onClick={()=>router.push(`/events/${eventId}/design/emails`)} className="px-4 py-2 text-sm rounded-md border hover:bg-slate-50">Open Email Settings</button>
          </div>
        </div>
      </div>
    </div>
  )
}
