'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getEventById } from '@/lib/api/events'
import { Calendar, MapPin, Users, Ticket } from 'lucide-react'

export default function PublicEventPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<any | null>(null)
  const [site, setSite] = useState<any | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        // Use public endpoint (no auth required)
        const eventRes = await fetch(`/api/events/${id}/public`, { cache: 'no-store' })
        if (!eventRes.ok) throw new Error('Event not found')
        const data = await eventRes.json()
        if (!cancelled) setEvent(data)
        // Also load published design
        const designRes = await fetch(`/api/events/${id}/design/published`, { cache: 'no-store' })
        if (designRes.ok) {
          const pub = await designRes.json()
          if (!cancelled) setSite(pub?.site || null)
        }
      } catch {
        if (!cancelled) setEvent(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  if (!id) return null

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      {loading ? (
        <div className="h-64 rounded-xl border animate-pulse bg-slate-50" />
      ) : !event ? (
        <div className="rounded-lg border p-6">Event not found.</div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl overflow-hidden border bg-white">
            <div className="h-60 flex items-center justify-center" style={{ background: site?.colors?.primary || '#eef2ff' }}>
              <lottie-player autoplay loop mode="normal" background="transparent" src="https://assets6.lottiefiles.com/packages/lf20_j1adxtyb.json" style={{ width: 320, height: 200 }} />
            </div>
            <div className="p-5 space-y-2">
              <h1 className="text-2xl font-bold">{site?.sections?.find((s:any)=>s.type==='hero')?.title || event.name || 'Untitled Event'}</h1>
              <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> {event.startsAt ? new Date(event.startsAt).toLocaleString() : 'TBA'}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.city || 'TBA'}</span>
                <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {event.eventMode || 'IN_PERSON'}</span>
              </div>
              {site?.sections?.find((s:any)=>s.type==='hero')?.subtitle ? (
                <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{site.sections.find((s:any)=>s.type==='hero').subtitle}</p>
              ) : event.description ? (
                <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{event.description}</p>
              ) : null}
              <div className="pt-3">
                <Link href={`/events/${id}/attend`} className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-white text-sm hover:opacity-90" style={{ background: site?.colors?.primary || '#4f46e5' }}>
                  <Ticket className="h-4 w-4" /> Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
