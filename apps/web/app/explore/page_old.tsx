'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getEvents } from '@/lib/api/events'
import { Calendar, MapPin, Ticket, Users, Filter, ExternalLink } from 'lucide-react'
import { eventbriteAPI, EVENTBRITE_CATEGORIES, CITY_COORDINATES } from '@/lib/eventbrite-api'

export default function ExplorePage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [eventbriteEvents, setEventbriteEvents] = useState<any[]>([])
  const [selectedCity, setSelectedCity] = useState('Mumbai')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')
  const [showEventbrite, setShowEventbrite] = useState(true)
  const [eventbriteLoading, setEventbriteLoading] = useState(false)
  const [eventbriteError, setEventbriteError] = useState('')
  const router = useRouter()

  const currentUserId = useMemo(() => (session?.user as any)?.id || (session as any)?.userId || null, [session])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await getEvents({ status: 'LIVE', limit: 12, sortBy: 'startsAt', sortDir: 'ASC' } as any)
        const all = res.events || []
        // Exclude events created by the current user
        const filtered = currentUserId
          ? all.filter((e: any) => {
              const ownerId = e.organizerId || e.ownerId || e.createdBy || e?.organizer?.id
              return !ownerId || String(ownerId) !== String(currentUserId)
            })
          : all
        if (!cancelled) setEvents(filtered)
      } catch {
        if (!cancelled) setEvents([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [currentUserId, status])

  // Load user's selected city
  useEffect(() => {
    fetch('/api/user/city')
      .then(res => res.json())
      .then(data => {
        if (data.city) {
          const firstCity = data.city.split(',')[0]
          setSelectedCity(firstCity)
        }
      })
      .catch(console.error)
  }, [])

  // Load Eventbrite events
  useEffect(() => {
    if (!showEventbrite) return

    const loadEventbriteEvents = async () => {
      setEventbriteLoading(true)
      setEventbriteError('')
      
      try {
        const coords = CITY_COORDINATES[selectedCity as keyof typeof CITY_COORDINATES]
        const options: any = {}
        
        if (selectedCategory !== 'all') {
          options.category = EVENTBRITE_CATEGORIES[selectedCategory as keyof typeof EVENTBRITE_CATEGORIES]
        }
        
        if (priceFilter !== 'all') {
          options.price = priceFilter
        }

        let fetchedEvents
        if (coords) {
          fetchedEvents = await eventbriteAPI.searchEventsByLocation(coords.lat, coords.lng, options)
        } else {
          fetchedEvents = await eventbriteAPI.searchEventsByCity(selectedCity, options)
        }
        
        setEventbriteEvents(fetchedEvents)
      } catch (error: any) {
        console.error('Eventbrite Error:', error)
        if (error.message.includes('401')) {
          setEventbriteError('Invalid Eventbrite API token. Please configure NEXT_PUBLIC_EVENTBRITE_TOKEN.')
        } else if (error.message.includes('429')) {
          setEventbriteError('Rate limit exceeded. Please wait a moment.')
        } else {
          setEventbriteError('Failed to load Eventbrite events.')
        }
        setEventbriteEvents([])
      } finally {
        setEventbriteLoading(false)
      }
    }

    loadEventbriteEvents()
  }, [selectedCity, selectedCategory, priceFilter, showEventbrite])

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Explore events</h1>
        <p className="text-muted-foreground mt-1">Find something you like and register as an attendee.</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-lg border animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-md border p-6">No events available right now.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((e: any) => (
            <div key={e.id} className="group rounded-xl border bg-white overflow-hidden hover:shadow transition">
              <div className="h-40 bg-slate-100 flex items-center justify-center">
                <lottie-player autoplay loop mode="normal" background="transparent" src="https://assets6.lottiefiles.com/packages/lf20_j1adxtyb.json" style={{ width: 220, height: 140 }} />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold truncate" title={e.name}>{e.name || 'Untitled Event'}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">LIVE</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-3">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(e.startsAt).toLocaleDateString()}</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {e.city || 'TBA'}</span>
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                    onClick={() => router.push(`/events/${e.id}/attend`)}
                  >
                    <Ticket className="h-4 w-4" /> Register
                  </button>
                  <Link
                    href={`/events/${e.id}/public`}
                    className="text-sm px-3 py-2 rounded border hover:bg-slate-50"
                  >
                    View details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Organizer promo removed per request */}
    </main>
  )
}
