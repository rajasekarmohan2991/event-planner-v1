"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { getEvents, cancelEvent, trashEvent, restoreEvent, purgeEvent } from "@/lib/api/events"
import { toast } from "@/components/ui/use-toast"
import { PlayCircle, Radio, FileClock, Archive, CheckCircle, Ban, LayoutGrid, List as ListIcon, Pencil, Trash2, ArrowUp, ArrowDown, X } from "lucide-react"
import AvatarIcon from '@/components/ui/AvatarIcon'
import { getEventBadgeQuery, getEventBadgeSeed } from '@/lib/media/eventBadge'
import ModernEventCard from '@/components/events/ModernEventCard'

type EventItem = {
  id: string | number
  name?: string
  status?: "DRAFT" | "LIVE" | "COMPLETED" | "CANCELLED" | "TRASHED" | string
  startsAt?: string
  endsAt?: string
  city?: string
  eventMode?: "IN_PERSON" | "VIRTUAL" | "HYBRID" | string
  latitude?: number
  longitude?: number
  bannerUrl?: string
  priceInr?: number
}

const STATUS_TABS = [
  { key: "ALL", label: "All", apiStatus: "ALL", icon: CheckCircle },
  { key: "LIVE", label: "Live", apiStatus: "LIVE", icon: Radio },
  { key: "DRAFTS", label: "Drafts", apiStatus: "DRAFT", icon: FileClock },
  { key: "PAST", label: "Past", apiStatus: "COMPLETED", icon: CheckCircle },
  { key: "CANCELLED", label: "Cancelled", apiStatus: "CANCELLED", icon: Ban },
  { key: "TRASH", label: "Trash", apiStatus: "TRASHED", icon: Archive },
] as const

export default function EventList() {
  const { data: session } = useSession()
  const accessToken = (session as any)?.accessToken as string | undefined
  const [events, setEvents] = useState<EventItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [page, setPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [activeTab, setActiveTab] = useState<typeof STATUS_TABS[number]["key"]>("ALL")
  const [search, setSearch] = useState("")
  const [modeFilter, setModeFilter] = useState<"ALL" | "IN_PERSON" | "VIRTUAL" | "HYBRID">("ALL")
  const [sortBy, setSortBy] = useState<"startsAt" | "name">("startsAt")
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC")
  const [cityCoords, setCityCoords] = useState<Record<string, { lat: number; lon: number }>>({})
  const [confirm, setConfirm] = useState<{ open: boolean; type: 'cancel' | 'trash' | 'delete' | null; target: EventItem | null }>({ open: false, type: null, target: null })
  // Track which thumbnails failed to load so we can show animation instead
  const [thumbFailed, setThumbFailed] = useState<Record<string | number, boolean>>({})
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
  // Preview modal state
  const [previewTarget, setPreviewTarget] = useState<EventItem | null>(null)
  const searchParams = useSearchParams()
  const sp = searchParams ?? new URLSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const apiStatus = useMemo(() => STATUS_TABS.find(t => t.key === activeTab)?.apiStatus ?? "ALL", [activeTab])

  const load = useCallback(async (pageNum: number = 1) => {
    setLoading(true)
    try {
      const res = await getEvents({
        status: apiStatus === 'ALL' ? undefined : (apiStatus as any),
        page: pageNum,
        limit: 10,
        eventMode: modeFilter === 'ALL' ? undefined : modeFilter,
        sortBy,
        sortDir,
        search: search.trim() || undefined,
      }, accessToken)
      const incoming = res.events as any
      const cleaned = activeTab === 'ALL' ? incoming.filter((e: any) => e.status !== 'TRASHED') : incoming
      setEvents(cleaned)
      setPage(res.page)
      setTotalPages(res.totalPages)
    } catch {
      setEvents([])
      setPage(1)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [accessToken, apiStatus, modeFilter, sortBy, sortDir, search])

  useEffect(() => {
    if (sp.get('created') === '1') {
      setBanner('Event created successfully!')
      toast({ title: 'Event created', description: 'Your event has been created successfully.' })
      const qp = new URLSearchParams(sp.toString())
      qp.delete('created')
      router.replace(`${pathname}?${qp.toString()}`)
    }
    const t = setTimeout(() => load(1), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, apiStatus, search, modeFilter, sortBy, sortDir])

  const formatDateRange = (start?: string, end?: string) => {
    try {
      if (!start || !end) return null
      const s = new Date(start)
      const e = new Date(end)
      const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
      const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      const fmtNoYear = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      return sameMonth ? `${fmtNoYear(s)} to ${fmt(e)}` : `${fmt(s)} to ${fmt(e)}`
    } catch {
      return null
    }
  }

  const filtered = events || []

  const formatPrice = (amount?: number) => {
    if (amount === undefined || amount === null || isNaN(amount) || amount <= 0) return 'Free'
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
    } catch {
      return `₹${Math.round(amount).toLocaleString('en-IN')}`
    }
  }

  const statusStyle = (status?: string) => {
    switch (status) {
      case 'LIVE':
        return { cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500', Icon: Radio }
      case 'DRAFT':
        return { cls: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400', Icon: FileClock }
      case 'COMPLETED':
        return { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', Icon: CheckCircle }
      case 'CANCELLED':
        return { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', Icon: Ban }
      case 'TRASHED':
        return { cls: 'bg-zinc-50 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400', Icon: Archive }
      default:
        return { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500', Icon: PlayCircle }
    }
  }

  const MT_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY as string | undefined
  const MT_STYLE = (process.env.NEXT_PUBLIC_MAPTILER_STYLE as string | undefined) || 'streets'

  const getThumbSrc = (x: EventItem) => {
    // Prefer server-provided coords
    if (typeof x.latitude === 'number' && typeof x.longitude === 'number') {
      const lat = x.latitude
      const lon = x.longitude
      if (MT_KEY) {
        // MapTiler Static Maps (no marker to keep URL simple and reliable)
        return `https://api.maptiler.com/maps/${encodeURIComponent(MT_STYLE)}/static/${lon},${lat},12/384x256.png?key=${encodeURIComponent(MT_KEY)}`
      }
      // Internal proxy to OSM static map
      return `/api/map/static?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&zoom=12&w=384&h=256`
    }
    // Fallback: city-based coords from client cache/API
    if (x.city && x.city.trim().length > 0) {
      const key = x.city.trim().toLowerCase()
      const coords = cityCoords[key]
      if (coords) {
        const { lat, lon } = coords
        if (MT_KEY) {
          return `https://api.maptiler.com/maps/${encodeURIComponent(MT_STYLE)}/static/${lon},${lat},12/384x256.png?key=${encodeURIComponent(MT_KEY)}`
        }
        return `/api/map/static?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&zoom=12&w=384&h=256`
      }
    }
    if (x.bannerUrl) return x.bannerUrl
    // No deterministic image available -> return empty to trigger animation path
    return ''
  }

  const getMapLink = (x: EventItem) => {
    // Prefer precise coordinates when available
    if (typeof x.latitude === 'number' && typeof x.longitude === 'number') {
      const lat = x.latitude
      const lon = x.longitude
      // Google Maps exact coordinates
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
    }
    // Else, use cached geocoded city coordinates if present
    if (x.city && x.city.trim().length > 0) {
      const key = x.city.trim().toLowerCase()
      const coords = cityCoords[key]
      if (coords) {
        const { lat, lon } = coords
        return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
      }
      // Fallback to a Google Maps text search
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.city)}`
    }
    // Last resort: open Google Maps home
    return 'https://www.google.com/maps'
  }

  // Geocode unique city names via our API (server-side cached) and cache in state
  useEffect(() => {
    const cities = Array.from(new Set(
      (filtered || [])
        .filter(e => (typeof e.latitude !== 'number' || typeof e.longitude !== 'number'))
        .map(e => (e.city || '').trim())
        .filter(Boolean)
    ))
    const missing = cities.filter(c => !cityCoords[c.toLowerCase()])
    if (missing.length === 0) return
    let aborted = false
    ;(async () => {
      const updates: Record<string, { lat: number; lon: number }> = {}
      for (const city of missing) {
        try {
          // Check database cache first
          const cacheRes = await fetch(`/api/geocoding-cache?city=${encodeURIComponent(city)}`)
          if (cacheRes.ok) {
            const cached = await cacheRes.json()
            updates[city.toLowerCase()] = { lat: cached.lat, lon: cached.lon }
            continue
          }
          
          // Fetch from external API
          const res = await fetch(`/api/geo/city?q=${encodeURIComponent(city)}`)
          if (res.ok) {
            const data = await res.json()
            const coords = { lat: Number(data.lat), lon: Number(data.lon) }
            updates[city.toLowerCase()] = coords
            
            // Save to database cache
            try {
              await fetch('/api/geocoding-cache', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city, ...coords })
              })
            } catch {}
          }
        } catch {}
      }
      if (!aborted && Object.keys(updates).length) {
        setCityCoords(prev => ({ ...prev, ...updates }))
      }
    })()
    return () => { aborted = true }
  }, [filtered, cityCoords])

  if (!events || loading) return <div className="animate-pulse h-24 bg-gray-100 dark:bg-slate-800 rounded" />

  return (
    <div className="w-full space-y-4">
      {/* Controls + list */}
      <section className="space-y-4">
        {/* Sticky search + controls */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b py-3">
          {/* Row 1: search (left) and filters/sort (right) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-56 md:w-72">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events"
                className="w-full rounded-md border bg-background pr-9 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              {search.trim().length > 0 && (
                <button
                  type="button"
                  aria-label="Clear search"
                  title="Clear"
                  onClick={() => { setSearch(''); load(1) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-slate-100 text-slate-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm">
              {/* Mode filter */}
              <div className="flex items-center gap-2">
                <label className="text-foreground font-medium">Event Mode</label>
                <select
                  className="rounded-md border bg-background px-3 py-1.5 text-sm"
                  value={modeFilter}
                  onChange={(e) => { setModeFilter(e.target.value as any); setPage(1); load(1); }}
                >
                  <option value="ALL">All</option>
                  <option value="IN_PERSON">In-person</option>
                  <option value="VIRTUAL">Virtual</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>
              {/* Sort controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1.5 text-sm hover:bg-slate-50"
                  aria-label={`Toggle sort direction (currently ${sortDir})`}
                  onClick={() => { const next = sortDir === 'ASC' ? 'DESC' : 'ASC'; setSortDir(next); setPage(1); load(1); }}
                >
                  <span className="text-foreground font-medium">Sort</span>
                  {sortDir === 'ASC' ? (
                    <ArrowUp className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDown className="h-3.5 w-3.5" />
                  )}
                </button>
                <select
                  className="rounded-md border bg-background px-3 py-1.5 text-sm"
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as any); setPage(1); load(1); }}
                >
                  <option value="startsAt">Date</option>
                  <option value="name">Name</option>
                </select>
              </div>
              {/* Spacer */}
              <div className="grow" />
            </div>
          </div>
          {/* Row 2: status tabs full-width */}
          <div className="mt-3 flex items-center gap-4 text-sm overflow-x-auto">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.key}
                className={`pb-2 border-b-2 -mb-0.5 whitespace-nowrap transition-colors inline-flex items-center gap-1 ${activeTab === tab.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                onClick={() => { setActiveTab(tab.key); setPage(1); /* load will run via useEffect on apiStatus change */ }}
                type="button"
              >
                {tab.icon ? <tab.icon className="h-3.5 w-3.5" /> : null}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {banner && (
          <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20">
            {banner}
          </div>
        )}

        <div id="events-list" className={viewMode==='grid' ? "grid sm:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"} tabIndex={-1}>
          {filtered.length === 0 ? (
            <div className="flex items-center gap-4 rounded-md border p-6 bg-white dark:bg-slate-900">
              <div className="shrink-0">
                <lottie-player
                  autoplay
                  loop
                  mode="normal"
                  background="transparent"
                  src="https://assets6.lottiefiles.com/packages/lf20_uqfbsoei.json"
                  style={{ width: 96, height: 96 }}
                />
              </div>
              <div>
                <div className="font-medium">No events yet</div>
                <div className="text-sm text-muted-foreground">Create your first event to get started.</div>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            filtered.map((x: any) => (
              <ModernEventCard
                key={x.id}
                event={x}
                onEdit={(id) => router.push(`/events/${id}/info`)}
                onDelete={(event) => setConfirm({ open: true, type: event.status === 'TRASHED' ? 'delete' as any : 'trash', target: event })}
              />
            ))
          ) : (
            filtered.map((x: any) => (
              <div
                key={x.id}
                className="group p-4 border rounded-lg dark:border-slate-700 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors"
                onClick={() => router.push(`/events/${x.id}`)}
              >
                <div className="flex items-start gap-4">
                    {/* Thumbnail: static OSM map if city exists, else banner/placeholder */}
                    <div className="w-64 h-40 rounded-md overflow-hidden border bg-slate-50 flex items-center justify-center relative">
                      {(() => {
                        const src = getThumbSrc(x)
                        const failed = thumbFailed[x.id]
                        const shouldAnimate = failed || !src
                        if (shouldAnimate) {
                          return (
                            <div className="w-full h-full grid place-items-center">
                              <div className="w-full h-full">
                                <AvatarIcon seed={getEventBadgeSeed(x)} query={getEventBadgeQuery(x)} size={160} className="!w-full !h-full object-cover rounded-md" squared />
                              </div>
                            </div>
                          )
                        }
                        const mapHref = getMapLink(x)
                        return (
                          <a href={mapHref} target="_blank" rel="noreferrer" onClick={(e)=> e.stopPropagation()} className="block w-full h-full">
                            <img
                              src={src}
                              alt={x.city ? `Map of ${x.city}` : 'Event banner'}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                              loading="lazy"
                              onError={() => setThumbFailed(prev => ({ ...prev, [x.id]: true }))}
                            />
                            {/* Hover shine */}
                            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                          </a>
                        )
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/events/${x.id}`} className="text-base font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 truncate block flex items-center gap-2">
                            <AvatarIcon seed={getEventBadgeSeed(x)} size={24} query={getEventBadgeQuery(x)} />
                            {x.name || "Untitled Event"}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>📅 {formatDateRange(x.startsAt, x.endsAt) || 'Dates TBA'}</span>
                            <span>🪪 {x.eventMode === 'IN_PERSON' ? 'In-Person Event' : x.eventMode === 'VIRTUAL' ? 'Virtual Event' : 'Hybrid Event'}</span>
                            <a
                              href={getMapLink(x)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e)=> { e.preventDefault(); e.stopPropagation() }}
                              className="underline decoration-dotted hover:decoration-solid"
                              title={x.city ? `Open ${x.city} in Google Maps` : 'Open location in Google Maps'}
                            >
                              📍 {x.city || 'Location not added'}
                            </a>
                            <span>👥 1 Organizers</span>
                            <span>👤 0 Attendees</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200" title="Starting price">
                            {formatPrice(x.priceInr)}
                          </div>
                          {(() => { const s = statusStyle(x.status); const I = s.Icon; return (
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${s.cls}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${s.dot} animate-pulse`} />
                              <I className="h-3.5 w-3.5" />
                              {x.status}
                            </span>
                          )})()}
                          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                            {/* Edit icon button */}
                            <button
                              className="inline-flex items-center justify-center h-9 w-9 rounded-md border text-indigo-600 hover:bg-indigo-50"
                              title="Edit"
                              aria-label="Edit"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const url = `/events/${x.id}/info`
                                router.push(url)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {x.status !== 'LIVE' && (
                              <button
                                className="inline-flex items-center justify-center h-9 w-9 rounded-md border text-rose-600 hover:bg-rose-50"
                                title={x.status === 'TRASHED' ? 'Delete permanently' : 'Move to Trash'}
                                aria-label="Delete"
                                onClick={(e) => {
                                  e.preventDefault(); e.stopPropagation()
                                  setConfirm({ open: true, type: x.status === 'TRASHED' ? 'delete' as any : 'trash', target: x })
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            <span className="text-slate-400">|</span>
                            <button 
                              className="text-indigo-600 hover:underline" 
                              onClick={(e) => { 
                                e.preventDefault()
                                e.stopPropagation()
                                setPreviewTarget(x)
                              }}
                            >
                              Preview
                            </button>
                            <a
                              className="text-indigo-600 hover:underline"
                              href={process.env.NEXT_PUBLIC_EVENT_MICROSITES_BASE ? `${process.env.NEXT_PUBLIC_EVENT_MICROSITES_BASE}/${x.id}` : '#'}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => { if (!process.env.NEXT_PUBLIC_EVENT_MICROSITES_BASE) { e.preventDefault() } }}
                            >
                              View Website
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">RA • Last modified a day ago</div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Page {page} of {totalPages}</div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 text-sm rounded border disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => load(page - 1)}
            >
              Previous
            </button>
            <button
              className="px-3 py-1.5 text-sm rounded border disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* Confirmation Dialog */}
      {confirm.open && confirm.target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-lg dark:bg-slate-900">
            <h3 className="text-lg font-semibold mb-2">
              {confirm.type === 'cancel' ? 'Cancel Event?' : confirm.type === 'delete' ? 'Delete Permanently?' : 'Move to Trash?'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {confirm.type === 'cancel' 
                ? `Are you sure you want to cancel "${confirm.target.name}"? This will mark the event as cancelled.`
                : confirm.type === 'delete'
                  ? `This will permanently delete "${confirm.target.name}". This action cannot be undone.`
                  : `Are you sure you want to move "${confirm.target.name}" to trash? You can restore it later.`}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirm({ open: false, type: null, target: null })}
                className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!confirm.target) return
                  
                  // Check authentication
                  if (!accessToken) {
                    toast({ 
                      title: 'Authentication required', 
                      description: 'Please log out and log back in to refresh your session.', 
                      variant: 'destructive' as any 
                    })
                    setConfirm({ open: false, type: null, target: null })
                    return
                  }
                  
                  try {
                    if (confirm.type === 'cancel') {
                      await cancelEvent(String(confirm.target.id), accessToken)
                      toast({ title: 'Event cancelled' })
                    } else if (confirm.type === 'trash') {
                      await trashEvent(String(confirm.target.id), accessToken)
                      toast({ title: 'Event moved to trash' })
                    } else if (confirm.type === 'delete') {
                      await purgeEvent(String(confirm.target.id), accessToken)
                      toast({ title: 'Event deleted permanently' })
                    }
                    setConfirm({ open: false, type: null, target: null })
                    load(page)
                  } catch (err: any) {
                    toast({ 
                      title: confirm.type === 'cancel' ? 'Cancel failed' : 'Trash failed', 
                      description: err?.message || 'Operation failed', 
                      variant: 'destructive' as any 
                    })
                  }
                }}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
                  confirm.type === 'cancel' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {confirm.type === 'cancel' ? 'Cancel Event' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Preview Modal overlay
// Renders at the bottom of the component file to keep JSX simple above
// Uses a free Lottie animation as a playful placeholder for event preview
function PreviewModal({ target, onClose }: { target: any, onClose: () => void }) {
  if (!target) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl border bg-white shadow-xl dark:bg-slate-900" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-semibold">Preview • {target?.name || 'Untitled Event'}</div>
          <button className="text-sm px-2 py-1 rounded border hover:bg-slate-50" onClick={onClose}>Close</button>
        </div>
        <div className="p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="w-full md:w-2/3 flex items-center justify-center">
            <lottie-player
              autoplay
              loop
              mode="normal"
              background="transparent"
              src="https://assets2.lottiefiles.com/packages/lf20_lk80fpsm.json"
              style={{ width: 480, height: 320 }}
            />
          </div>
          <div className="w-full md:w-1/3 space-y-3 text-sm">
            <div className="text-muted-foreground">This is a quick visual preview. Use “View Website” to open the public microsite.</div>
            <div className="rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 p-3">
              <div className="font-medium">Tip</div>
              <div>Set a banner or city to replace placeholders in list and preview.</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 rounded border text-sm" onClick={onClose}>Back</button>
              <a
                className="px-3 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                href={process.env.NEXT_PUBLIC_EVENT_MICROSITES_BASE ? `${process.env.NEXT_PUBLIC_EVENT_MICROSITES_BASE}/${target?.id}` : '#'}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => { if (!process.env.NEXT_PUBLIC_EVENT_MICROSITES_BASE) { e.preventDefault() } }}
              >
                Open Microsite
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
