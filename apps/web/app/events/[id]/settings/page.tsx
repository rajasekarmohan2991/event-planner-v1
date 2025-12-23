"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from '@/components/ui/use-toast'

function slugify(input: string) {
  return (input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function EventSettingsPage({ params }: { params: { id: string } }) {
  const { status } = useSession()
  const router = useRouter()
  const [active, setActive] = useState<'general' | 'registration' | 'payments' | 'notifications' | 'integrations' | 'promote' | 'engagement'>('general')
  const [eventName, setEventName] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Tab forms
  const [general, setGeneral] = useState<any>({ timezone: '', visibility: 'public' })
  const [registration, setRegistration] = useState<any>({ capacity: '', approvalRequired: false })
  const [payments, setPayments] = useState<any>({ currency: 'INR', enableOnline: true })
  const [notifications, setNotifications] = useState<any>({ rsvpReminders: true, checkinNotice: true, senderName: '' })
  const [integrations, setIntegrations] = useState<any>({ webhookUrl: '', mapKey: '' })
  const [promote, setPromote] = useState<any>({ emailCampaigns: false, socialMedia: false })
  const [engagement, setEngagement] = useState<any>({ polls: false, qna: false })

  useEffect(() => {
    let aborted = false
      ; (async () => {
        setLoading(true)
        setError(null)
        try {
          console.log('🔍 Settings: Fetching event', params.id)
          const res = await fetch(`/api/events/${params.id}`, { credentials: 'include', cache: 'no-store' })
          console.log('📡 Settings: Response status', res.status)
          if (!res.ok) {
            const errorText = await res.text()
            console.error('❌ Settings: Failed to load event:', errorText)
            throw new Error(`Failed to load event (${res.status})`)
          }
          const data = await res.json().catch(() => ({}))
          console.log('📊 Settings: Event data', data)
          if (!aborted) setEventName(data?.name || data?.title || '')
        } catch (e: any) {
          console.error('❌ Settings: Error', e)
          if (!aborted) setError(e?.message || 'Unable to load event')
        } finally {
          if (!aborted) setLoading(false)
        }
      })()
    return () => { aborted = true }
  }, [params.id])

  // Load settings blobs
  useEffect(() => {
    let aborted = false
      ; (async () => {
        try {
          const [gRes, rRes, pRes, nRes, iRes] = await Promise.all([
            fetch(`/api/events/${params.id}/settings/general`, { cache: 'no-store' }),
            fetch(`/api/events/${params.id}/settings/registration`, { cache: 'no-store' }),
            fetch(`/api/events/${params.id}/settings/payments`, { cache: 'no-store' }),
            fetch(`/api/events/${params.id}/settings/notifications`, { cache: 'no-store' }),
            fetch(`/api/events/${params.id}/settings/integrations`, { cache: 'no-store' }),
          ])
          if (!aborted && gRes.ok) setGeneral(await gRes.json().catch(() => ({})))
          if (!aborted && rRes.ok) setRegistration(await rRes.json().catch(() => ({})))
          if (!aborted && pRes.ok) setPayments(await pRes.json().catch(() => ({})))
          if (!aborted && nRes.ok) setNotifications(await nRes.json().catch(() => ({})))
          if (!aborted && iRes.ok) setIntegrations(await iRes.json().catch(() => ({})))
        } catch { }
      })()
    return () => { aborted = true }
  }, [params.id])

  const slug = useMemo(() => {
    const base = slugify(eventName)
    return base ? `${base}-${params.id}` : params.id
  }, [eventName, params.id])

  const publicUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const origin = window.location.origin
    return `${origin}/e/${slug}`
  }, [slug])

  if (status === 'loading' || loading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  const saveActiveTab = async () => {
    try {
      setSaving(true)
      let url = ''
      let body: any = {}
      if (active === 'general') { url = `/api/events/${params.id}/settings/general`; body = general }
      if (active === 'registration') { url = `/api/events/${params.id}/settings/registration`; body = registration }
      if (active === 'payments') { url = `/api/events/${params.id}/settings/payments`; body = payments }
      if (active === 'notifications') { url = `/api/events/${params.id}/settings/notifications`; body = notifications }
      if (active === 'integrations') { url = `/api/events/${params.id}/settings/integrations`; body = integrations }
      if (active === 'promote') { url = `/api/events/${params.id}/settings/promote`; body = promote }
      if (active === 'engagement') { url = `/api/events/${params.id}/settings/engagement`; body = engagement }
      const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Save failed')
      toast({ title: 'Settings saved' })
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Try again', variant: 'destructive' as any })
    } finally { setSaving(false) }
  }

  const handleDeleteEvent = async () => {
    if (!confirm('Are you absolutely sure you want to delete this event? This action cannot be undone.')) return

    try {
      const res = await fetch(`/api/events/${params.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Event deleted' })
        router.push('/dashboard/organizer')
      } else {
        const data = await res.json()
        toast({ title: 'Failed to delete', description: data.message || 'Unknown error', variant: 'destructive' as any })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete event', variant: 'destructive' as any })
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <div className="rounded border p-4 space-y-3 bg-white">
        <div className="font-medium">Public website URL</div>
        <p className="text-sm text-slate-600">Share this link with attendees. It uses a readable slug based on your event name.</p>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            readOnly
            value={publicUrl}
            className="flex-1 rounded-md border px-3 py-2 text-sm bg-slate-50"
          />
          <button
            className="rounded-md bg-indigo-600 text-white text-sm px-3 py-2 hover:bg-indigo-700"
            onClick={async () => { try { await navigator.clipboard.writeText(publicUrl) } catch { } }}
          >
            Copy
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50"
          >
            Open
          </a>
        </div>
        <div className="text-xs text-slate-500">Format: /e/[slug] where slug = slugified name + id. Example: my-event-{params.id}</div>
      </div>


      {/* Tabs */}
      <div className="rounded border">
        <div className="flex flex-wrap gap-1 border-b p-2 text-sm">
          {['general', 'registration', 'payments', 'notifications', 'integrations', 'promote', 'engagement'].map((t) => (
            <button key={t}
              onClick={() => setActive(t as any)}
              className={`px-3 py-1.5 rounded-md ${active === t ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}`}
            >{t[0].toUpperCase() + t.slice(1)}</button>
          ))}
          <div className="ml-auto">
            <button onClick={saveActiveTab} disabled={saving} className={`px-3 py-1.5 rounded-md text-sm ${saving ? 'bg-indigo-100 text-indigo-700 animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>

        {/* Panels */}
        <div className="p-4 space-y-4">
          {active === 'general' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Timezone</label>
                <input className="mt-1 w-full rounded border px-3 py-2 text-sm" value={general.timezone || ''} onChange={e => setGeneral({ ...general, timezone: e.target.value })} placeholder="Asia/Kolkata" />
              </div>
              <div>
                <label className="text-sm">Visibility</label>
                <select className="mt-1 w-full rounded border px-3 py-2 text-sm" value={general.visibility || 'public'} onChange={e => setGeneral({ ...general, visibility: e.target.value })}>
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
          )}

          {active === 'registration' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Capacity</label>
                <input type="number" className="mt-1 w-full rounded border px-3 py-2 text-sm" value={registration.capacity || ''} onChange={e => setRegistration({ ...registration, capacity: e.target.value })} placeholder="500" />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input id="approval" type="checkbox" checked={!!registration.approvalRequired} onChange={e => setRegistration({ ...registration, approvalRequired: e.target.checked })} />
                <label htmlFor="approval" className="text-sm">Approval required</label>
              </div>
            </div>
          )}

          {active === 'payments' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Currency</label>
                <select className="mt-1 w-full rounded border px-3 py-2 text-sm" value={payments.currency || 'INR'} onChange={e => setPayments({ ...payments, currency: e.target.value })}>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input id="payonline" type="checkbox" checked={!!payments.enableOnline} onChange={e => setPayments({ ...payments, enableOnline: e.target.checked })} />
                <label htmlFor="payonline" className="text-sm">Enable online payments</label>
              </div>
            </div>
          )}

          {active === 'notifications' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input id="rsvpRem" type="checkbox" checked={!!notifications.rsvpReminders} onChange={e => setNotifications({ ...notifications, rsvpReminders: e.target.checked })} />
                <label htmlFor="rsvpRem" className="text-sm">RSVP reminders</label>
              </div>
              <div className="flex items-center gap-2">
                <input id="checkinNotice" type="checkbox" checked={!!notifications.checkinNotice} onChange={e => setNotifications({ ...notifications, checkinNotice: e.target.checked })} />
                <label htmlFor="checkinNotice" className="text-sm">Check-in confirmations</label>
              </div>
              <div>
                <label className="text-sm">Sender name</label>
                <input className="mt-1 w-full rounded border px-3 py-2 text-sm" value={notifications.senderName || ''} onChange={e => setNotifications({ ...notifications, senderName: e.target.value })} placeholder="Event Team" />
              </div>
            </div>
          )}

          {active === 'integrations' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Webhook URL</label>
                <input className="mt-1 w-full rounded border px-3 py-2 text-sm" value={integrations.webhookUrl || ''} onChange={e => setIntegrations({ ...integrations, webhookUrl: e.target.value })} placeholder="https://example.com/webhook" />
              </div>
              <div>
                <label className="text-sm">Map Key</label>
                <input className="mt-1 w-full rounded border px-3 py-2 text-sm" value={integrations.mapKey || ''} onChange={e => setIntegrations({ ...integrations, mapKey: e.target.value })} placeholder="MapTiler/Google key" />
              </div>
            </div>
          )}

          {active === 'promote' && (
            <div className="space-y-4">
              <div className="text-sm font-medium text-slate-700">Promotion Settings</div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input id="emailCampaigns" type="checkbox" checked={!!promote.emailCampaigns} onChange={e => setPromote({ ...promote, emailCampaigns: e.target.checked })} />
                  <label htmlFor="emailCampaigns" className="text-sm">Enable email campaigns</label>
                </div>
                <div className="flex items-center gap-2">
                  <input id="socialMedia" type="checkbox" checked={!!promote.socialMedia} onChange={e => setPromote({ ...promote, socialMedia: e.target.checked })} />
                  <label htmlFor="socialMedia" className="text-sm">Enable social media promotion</label>
                </div>
              </div>
              <div>
                <label className="text-sm">Campaign Name</label>
                <input className="mt-1 w-full rounded border px-3 py-2 text-sm" value={promote.campaignName || ''} onChange={e => setPromote({ ...promote, campaignName: e.target.value })} placeholder="Event Promotion Campaign" />
              </div>
              <div>
                <label className="text-sm">Target Audience</label>
                <textarea className="mt-1 w-full rounded border px-3 py-2 text-sm" rows={3} value={promote.targetAudience || ''} onChange={e => setPromote({ ...promote, targetAudience: e.target.value })} placeholder="Describe your target audience..." />
              </div>
            </div>
          )}

          {active === 'engagement' && (
            <div className="space-y-4">
              <div className="text-sm font-medium text-slate-700">Engagement Features</div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input id="polls" type="checkbox" checked={!!engagement.polls} onChange={e => setEngagement({ ...engagement, polls: e.target.checked })} />
                  <label htmlFor="polls" className="text-sm">Enable live polls</label>
                </div>
                <div className="flex items-center gap-2">
                  <input id="qna" type="checkbox" checked={!!engagement.qna} onChange={e => setEngagement({ ...engagement, qna: e.target.checked })} />
                  <label htmlFor="qna" className="text-sm">Enable Q&A sessions</label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input id="networking" type="checkbox" checked={!!engagement.networking} onChange={e => setEngagement({ ...engagement, networking: e.target.checked })} />
                <label htmlFor="networking" className="text-sm">Enable networking features</label>
              </div>
              <div>
                <label className="text-sm">Engagement Message</label>
                <textarea className="mt-1 w-full rounded border px-3 py-2 text-sm" rows={3} value={engagement.message || ''} onChange={e => setEngagement({ ...engagement, message: e.target.value })} placeholder="Welcome message for attendees..." />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded border border-red-200 bg-red-50">
        <div className="p-4 border-b border-red-200">
          <div className="text-base font-semibold text-red-900">Danger Zone</div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-red-900">Delete Event</div>
              <div className="text-sm text-red-700">Once you delete an event, there is no going back. Please be certain.</div>
            </div>
            <button
              onClick={handleDeleteEvent}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              Delete Event
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
