"use client"

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getEventById, updateEvent, deleteEvent, type CreateEventRequest } from '@/lib/api/events'
import ManageTabs from '@/components/events/ManageTabs'
import AvatarIcon from '@/components/ui/AvatarIcon'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { EventTermsAndManager } from '@/components/events/EventTermsAndManager'

export default function EventInfoPage({ params }: { params: { id: string } }) {
  const { status, data } = useSession()
  const accessToken = (data as any)?.accessToken as string | undefined
  const router = useRouter()

  // Debug: Log session data
  useEffect(() => {
    if (status === 'authenticated') {
      console.log('Session data:', data)
      console.log('Access token present:', !!accessToken)
      if (!accessToken) {
        console.warn('⚠️ Access token is missing from session. You may need to log out and log back in.')
      }
    }
  }, [status, data, accessToken])
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)

  // form state
  const [name, setName] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [city, setCity] = useState('')
  const [venue, setVenue] = useState('')
  const [venueQuery, setVenueQuery] = useState('')
  const [venueOpts, setVenueOpts] = useState<Array<{ id: string | number; name: string; displayName: string }>>([])
  const [venueLoading, setVenueLoading] = useState(false)
  const [showVenueList, setShowVenueList] = useState(false)
  const [address, setAddress] = useState('')
  const [priceInr, setPriceInr] = useState<string>('')
  const [description, setDescription] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [category, setCategory] = useState('')
  const [eventMode, setEventMode] = useState<'IN_PERSON' | 'VIRTUAL' | 'HYBRID' | ''>('')
  const [budgetInr, setBudgetInr] = useState<string>('')
  const [expectedAttendees, setExpectedAttendees] = useState<string>('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [termsAndConditions, setTermsAndConditions] = useState('')
  const [disclaimer, setDisclaimer] = useState('')
  const [eventManagerName, setEventManagerName] = useState('')
  const [eventManagerContact, setEventManagerContact] = useState('')
  const [eventManagerEmail, setEventManagerEmail] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const ev = await getEventById(params?.id || '', accessToken)
        if (mounted) {
          const e: any = ev as any
          setEvent(e)
          setName(e.name || '')
          setStartsAt(e.startsAt ? new Date(e.startsAt).toISOString().slice(0, 16) : '')
          setEndsAt(e.endsAt ? new Date(e.endsAt).toISOString().slice(0, 16) : '')
          setCity(e.city || '')
          setVenue(e.venue || '')
          setAddress(e.address || '')
          setPriceInr(typeof e.priceInr === 'number' ? String(e.priceInr) : '')
          setDescription(e.description || '')
          setBannerUrl(e.bannerUrl || '')
          setCategory(e.category || '')
          setEventMode(e.eventMode || '')
          setBudgetInr(typeof e.budgetInr === 'number' ? String(e.budgetInr) : '')
          setExpectedAttendees(typeof e.expectedAttendees === 'number' ? String(e.expectedAttendees) : '')
          setLatitude(e.latitude || null)
          setLongitude(e.longitude || null)
          setTermsAndConditions(e.termsAndConditions || '')
          setDisclaimer(e.disclaimer || '')
          setEventManagerName(e.eventManagerName || '')
          setEventManagerContact(e.eventManagerContact || '')
          setEventManagerEmail(e.eventManagerEmail || '')
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load event')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    // Load as soon as the session status is resolved (authenticated or unauthenticated)
    if (status !== 'loading') load()
    return () => { mounted = false }
  }, [status, params?.id, accessToken])

  // Auto-fetch coordinates when address changes
  useEffect(() => {
    if (!address.trim()) return

    const fetchCoordinates = async () => {
      try {
        const response = await fetch(`/api/geo/coordinates?address=${encodeURIComponent(address)}`)
        if (response.ok) {
          const data = await response.json()
          if (data.latitude && data.longitude) {
            setLatitude(data.latitude)
            setLongitude(data.longitude)
          }
        }
      } catch (error) {
        console.error('Error fetching coordinates:', error)
      }
    }

    const timeoutId = setTimeout(fetchCoordinates, 1000) // Debounce for 1 second
    return () => clearTimeout(timeoutId)
  }, [address])

  // Auto-suggest venues when city is present and user types venue
  useEffect(() => {
    if (!city || venueQuery.trim().length < 2) {
      setVenueOpts([]); setShowVenueList(false); return
    }
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        setVenueLoading(true)
        const res = await fetch(`/api/geo/venues?city=${encodeURIComponent(city)}&q=${encodeURIComponent(venueQuery)}&limit=10`, { signal: ctrl.signal, cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setVenueOpts(Array.isArray(data) ? data.slice(0, 10) : [])
          setShowVenueList(true)
        } else { setVenueOpts([]); setShowVenueList(false) }
      } catch {
        if (!ctrl.signal.aborted) { setVenueOpts([]); setShowVenueList(false) }
      } finally { setVenueLoading(false) }
    }, 250)
    return () => { ctrl.abort(); clearTimeout(t) }
  }, [city, venueQuery])

  const [mapFailed, setMapFailed] = useState(false)
  const MT_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY as string | undefined
  const MT_STYLE = (process.env.NEXT_PUBLIC_MAPTILER_STYLE as string | undefined) || 'streets'

  const mapSrc = useMemo(() => {
    if (!event) return null
    if (typeof event.latitude === 'number' && typeof event.longitude === 'number') {
      const lat = event.latitude
      const lon = event.longitude
      if (MT_KEY) {
        return `https://api.maptiler.com/maps/${encodeURIComponent(MT_STYLE)}/static/${lon},${lat},12/640x360.png?key=${encodeURIComponent(MT_KEY)}`
      }
      return `/api/map/static?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&zoom=12&w=640&h=360`
    }
    return event.bannerUrl || null
  }, [event, MT_KEY, MT_STYLE])

  const mapHref = useMemo(() => {
    if (!event) return null
    if (typeof event.latitude === 'number' && typeof event.longitude === 'number') {
      const lat = event.latitude
      const lon = event.longitude
      return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`
    }
    return event.city ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(event.city)}` : null
  }, [event])

  // Live Google Maps preview based on typed City/Venue/Address (or coordinates if present)
  const gmapsQuery = useMemo(() => {
    if (typeof event?.latitude === 'number' && typeof event?.longitude === 'number') {
      return `${event.latitude},${event.longitude}`
    }
    const parts = [venue, address, city].map(s => (s || '').trim()).filter(Boolean)
    return parts.length ? parts.join(', ') : ''
  }, [event, venue, address, city])

  const gmapsEmbedUrl = useMemo(() => {
    return gmapsQuery ? `https://www.google.com/maps?q=${encodeURIComponent(gmapsQuery)}&output=embed` : null
  }, [gmapsQuery])

  const gmapsOpenUrl = useMemo(() => {
    return gmapsQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gmapsQuery)}` : null
  }, [gmapsQuery])

  if (status === 'loading' || loading) return <div className="p-6">Loading...</div>
  if (!event) return <div className="p-6">No event found.</div>

  return (
    <div className="space-y-6">
      <ManageTabs eventId={params?.id || ''} />
      <header className="sticky top-32 z-60 bg-white/95 backdrop-blur-sm shadow-sm rounded-lg px-4 py-3 flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-2">
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-xs inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-slate-50">
            <span className={`inline-block h-2 w-2 rounded-full ${event.status === 'LIVE' ? 'bg-emerald-500' : event.status === 'CANCELLED' ? 'bg-rose-500' : event.status === 'TRASHED' ? 'bg-zinc-400' : 'bg-indigo-500'}`} />
            <span className="font-medium">{event.status || 'DRAFT'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm disabled:opacity-60"
            onClick={async () => {
              try {
                setSaving(true)
                const payload: CreateEventRequest = {
                  name,
                  venue: venue || undefined,
                  address: address || undefined,
                  city,
                  startsAt: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
                  endsAt: endsAt ? new Date(endsAt).toISOString() : new Date().toISOString(),
                  priceInr: Number(priceInr || 0),
                  description: description || undefined,
                  bannerUrl: bannerUrl || undefined,
                  category: category || undefined,
                  eventMode: (eventMode || 'IN_PERSON') as any,
                  budgetInr: budgetInr ? Number(budgetInr) : undefined,
                  expectedAttendees: expectedAttendees ? Number(expectedAttendees) : undefined,
                  latitude: latitude || undefined,
                  longitude: longitude || undefined,
                  termsAndConditions: termsAndConditions || undefined,
                  disclaimer: disclaimer || undefined,
                  eventManagerName: eventManagerName || undefined,
                  eventManagerContact: eventManagerContact || undefined,
                  eventManagerEmail: eventManagerEmail || undefined,
                }
                await updateEvent(params.id, payload, accessToken)
                setBanner('Changes saved successfully')
                setTimeout(() => setBanner(null), 3000)
              } catch (e: any) {
                setError(e.message || 'Save failed')
              } finally {
                setSaving(false)
              }
            }}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            className="rounded-md border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            onClick={async () => {
              if (confirm('Permanently delete this event? This cannot be undone.')) {
                try {
                  await deleteEvent(params.id, accessToken)
                  router.push('/dashboard')
                } catch (e: any) {
                  setError(e.message || 'Delete failed')
                }
              }
            }}
          >
            Delete
          </button>
        </div>
      </header>

      {banner && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 px-3 py-2 text-sm">{banner}</div>
      )}
      {error && (
        <div className="rounded-md border border-rose-300 bg-rose-50 text-rose-800 px-3 py-2 text-sm">{error}</div>
      )}
      {status === 'authenticated' && !accessToken && (
        <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-800 px-3 py-2 text-sm">
          ⚠️ Your session is missing authentication credentials. Some features may not work. Please <button onClick={() => router.push('/auth/login')} className="underline font-medium">log out and log back in</button>.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          onClick={async () => {
            try {
              setSaving(true)
              const payload: CreateEventRequest = {
                name,
                venue: venue || undefined,
                address: address || undefined,
                city,
                startsAt: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
                endsAt: endsAt ? new Date(endsAt).toISOString() : new Date().toISOString(),
                priceInr: Number(priceInr || 0),
                description: description || undefined,
                bannerUrl: bannerUrl || undefined,
                category: category || undefined,
                eventMode: (eventMode || 'IN_PERSON') as any,
                budgetInr: budgetInr ? Number(budgetInr) : undefined,
                expectedAttendees: expectedAttendees ? Number(expectedAttendees) : undefined,
                latitude: latitude || undefined,
                longitude: longitude || undefined,
                termsAndConditions: termsAndConditions || undefined,
                disclaimer: disclaimer || undefined,
                eventManagerName: eventManagerName || undefined,
                eventManagerContact: eventManagerContact || undefined,
                eventManagerEmail: eventManagerEmail || undefined,
              } as any
              const updated = await updateEvent(String(event.id), payload, accessToken)
              setEvent(updated)
              setBanner('Event saved')
              setTimeout(() => setBanner(null), 3000)
            } catch (e: any) {
              setError(e?.message || 'Failed to save')
              setTimeout(() => setError(null), 4000)
            } finally {
              setSaving(false)
            }
          }}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        {/* Delete button - Only show for SUPER_ADMIN and ADMIN */}
        {((data as any)?.user?.role === 'SUPER_ADMIN') || ((data as any)?.user?.role === 'ADMIN') ? (
          <button
            className="rounded-md border border-rose-300 text-rose-700 px-3 py-1.5 text-sm hover:bg-rose-50"
            onClick={async () => {
              // Check if user is authenticated
              if (status !== 'authenticated') {
                setError('You must be logged in to delete an event')
                setTimeout(() => setError(null), 4000)
                return
              }
              if (!confirm('Delete this event permanently?')) return
              try {
                await deleteEvent(String(event.id), accessToken)
                router.push('/events')
              } catch (e: any) {
                console.error('Delete event error:', e)
                setError(e?.message || 'Failed to delete event')
                setTimeout(() => setError(null), 4000)
              }
            }}
          >
            Delete
          </button>
        ) : null}
      </div>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="rounded-md border p-4 space-y-2">
          <h2 className="text-sm font-semibold">Schedule</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <label className="block text-xs text-slate-500">Starts</label>
            <input type="datetime-local" className="w-full rounded-md border px-3 py-2 text-sm" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
            <label className="block text-xs text-slate-500">Ends</label>
            <input type="datetime-local" className="w-full rounded-md border px-3 py-2 text-sm" value={endsAt} onChange={e => setEndsAt(e.target.value)} />
          </div>
        </div>
        <div className="rounded-md border p-4 space-y-2">
          <h2 className="text-sm font-semibold">Location</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <label className="block text-xs text-slate-500">City</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm" value={city} onChange={e => setCity(e.target.value)} />
            <label className="block text-xs text-slate-500">Venue</label>
            <div className="relative">
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={venue}
                onChange={e => { setVenue(e.target.value); setVenueQuery(e.target.value) }}
                onFocus={() => { if (venueOpts.length > 0) setShowVenueList(true) }}
                onBlur={() => setTimeout(() => setShowVenueList(false), 150)}
                placeholder={city ? `Type a venue in ${city}` : 'Enter venue'}
              />
              {showVenueList && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-sm max-h-56 overflow-auto">
                  {venueLoading && (
                    <div className="px-3 py-2 text-xs text-slate-500">Searching…</div>
                  )}
                  {!venueLoading && venueOpts.length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-500">No suggestions</div>
                  )}
                  {venueOpts.map(opt => (
                    <button
                      key={String(opt.id)}
                      type="button"
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                      onClick={() => { setVenue(opt.name); setVenueQuery(opt.name); setShowVenueList(false) }}
                    >
                      {opt.name}
                      <div className="text-[11px] text-slate-500 truncate">{opt.displayName}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <label className="block text-xs text-slate-500">Address</label>
            <AddressAutocomplete
              value={address}
              onChange={(newAddress, coordinates) => {
                setAddress(newAddress)
                if (coordinates) {
                  setLatitude(coordinates.lat)
                  setLongitude(coordinates.lng)
                }
              }}
              placeholder="Enter venue address"
              className="text-sm"
            />
            {latitude && longitude && (
              <div className="text-xs text-slate-500 mt-1">
                📍 Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </div>
            )}
            <div className="pt-2">
              {gmapsEmbedUrl ? (
                <div className="rounded-md overflow-hidden border">
                  <iframe
                    title="Google Maps preview"
                    src={gmapsEmbedUrl}
                    width="100%"
                    height="220"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div className="flex items-center justify-between p-2 text-xs bg-slate-50 border-t">
                    <div className="text-slate-600 truncate">{gmapsQuery}</div>
                    {gmapsOpenUrl && (
                      <a href={gmapsOpenUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Open in Google Maps</a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-56 rounded-md border bg-slate-50 flex items-center justify-center text-xs text-slate-500">
                  Start typing City/Venue/Address to preview the location map
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-md border p-4 space-y-2">
          <h2 className="text-sm font-semibold">Details</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <label className="block text-xs text-slate-500">Name</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm" value={name} onChange={e => setName(e.target.value)} />
            <label className="block text-xs text-slate-500">Category</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm" value={category} onChange={e => setCategory(e.target.value)} />
            <label className="block text-xs text-slate-500">Price (INR)</label>
            <input type="number" className="w-full rounded-md border px-3 py-2 text-sm" value={priceInr} onChange={e => setPriceInr(e.target.value)} />
            <label className="block text-xs text-slate-500">Mode</label>
            <select className="w-full rounded-md border px-3 py-2 text-sm" value={eventMode} onChange={e => setEventMode(e.target.value as any)}>
              <option value="IN_PERSON">In Person</option>
              <option value="VIRTUAL">Virtual</option>
              <option value="HYBRID">Hybrid</option>
            </select>
            <label className="block text-xs text-slate-500">Banner URL</label>
            <input className="w-full rounded-md border px-3 py-2 text-sm" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} />
            <label className="block text-xs text-slate-500">Budget (INR)</label>
            <input type="number" className="w-full rounded-md border px-3 py-2 text-sm" value={budgetInr} onChange={e => setBudgetInr(e.target.value)} placeholder="e.g. 6000" />
            <label className="block text-xs text-slate-500">Expected Attendees</label>
            <input type="number" className="w-full rounded-md border px-3 py-2 text-sm" value={expectedAttendees} onChange={e => setExpectedAttendees(e.target.value)} placeholder="e.g. 19" />
          </div>
        </div>
      </section>

      <section className="rounded-md border p-4 space-y-2">
        <h2 className="text-sm font-semibold">Description</h2>
        <textarea className="w-full rounded-md border px-3 py-2 text-sm min-h-28" value={description} onChange={e => setDescription(e.target.value)} />
      </section>

      {/* Legal & Manager Information Section */}
      <section className="rounded-md border p-4 space-y-4">
        <h2 className="text-sm font-semibold">Legal & Event Manager Information</h2>

        {/* Event Manager Fields */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-slate-700">Event Manager Contact</h3>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Manager Name</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={eventManagerName}
                onChange={e => setEventManagerName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Contact Number</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={eventManagerContact}
                onChange={e => setEventManagerContact(e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Email Address</label>
              <input
                type="email"
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={eventManagerEmail}
                onChange={e => setEventManagerEmail(e.target.value)}
                placeholder="manager@example.com"
              />
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">Terms & Conditions</label>
          <textarea
            className="w-full rounded-md border px-3 py-2 text-sm min-h-32"
            value={termsAndConditions}
            onChange={e => setTermsAndConditions(e.target.value)}
            placeholder="Enter event terms and conditions..."
          />
        </div>

        {/* Disclaimer */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">Disclaimer</label>
          <textarea
            className="w-full rounded-md border px-3 py-2 text-sm min-h-24"
            value={disclaimer}
            onChange={e => setDisclaimer(e.target.value)}
            placeholder="Enter event disclaimers or liability statements..."
          />
        </div>
      </section>

      {/* Preview Section */}
      {(termsAndConditions || disclaimer || eventManagerName || eventManagerContact || eventManagerEmail) && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Preview (How it will appear to attendees)</h2>
          <EventTermsAndManager
            termsAndConditions={termsAndConditions}
            disclaimer={disclaimer}
            eventManagerName={eventManagerName}
            eventManagerContact={eventManagerContact}
            eventManagerEmail={eventManagerEmail}
          />
        </section>
      )}
    </div>
  )
}
