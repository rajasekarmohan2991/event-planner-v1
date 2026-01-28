"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { getEvents, cancelEvent, trashEvent, restoreEvent, purgeEvent } from "@/lib/api/events"
import { toast } from "@/components/ui/use-toast"
import { PlayCircle, Radio, FileClock, Archive, CheckCircle, Ban, LayoutGrid, List as ListIcon, Pencil, Trash2, ArrowUp, ArrowDown, X, Filter } from "lucide-react"
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
  const userRole = (session as any)?.user?.role as string | undefined
  const isAdmin = ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'OWNER', 'EVENT_MANAGER'].includes(userRole || '')
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
        return { cls: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500', Icon: CheckCircle }
      case 'CANCELLED':
        return { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', Icon: Ban }
      case 'TRASHED':
        return { cls: 'bg-zinc-50 text-zinc-700 border-zinc-200', dot: 'bg-zinc-400', Icon: Archive }
      default:
        return { cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', Icon: PlayCircle }
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
      ; (async () => {
        const updates: Record<string, { lat: number; lon: number }> = {}

        await Promise.all(missing.map(async (city) => {
          try {
            // Check database cache first
            const cacheRes = await fetch(`/api/geocoding-cache?city=${encodeURIComponent(city)}`)
            if (cacheRes.ok) {
              const cached = await cacheRes.json()
              updates[city.toLowerCase()] = { lat: cached.lat, lon: cached.lon }
              return
            }

            // Fetch from external API
            const res = await fetch(`/api/geo/city?q=${encodeURIComponent(city)}`)
            if (res.ok) {
              const data = await res.json()
              const coords = { lat: Number(data.lat), lon: Number(data.lon) }
              updates[city.toLowerCase()] = coords

              // Save to database cache (fire and forget)
              fetch('/api/geocoding-cache', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city, ...coords })
              }).catch(() => { })
            }
          } catch { }
        }))

        if (!aborted && Object.keys(updates).length) {
          setCityCoords(prev => ({ ...prev, ...updates }))
        }
      })()
    return () => { aborted = true }
  }, [filtered, cityCoords])

  if (!events || loading) return <div className="animate-pulse h-24 bg-rose-50/50 rounded-2xl" />

  return (
    <div className="w-full space-y-6">
      {/* Controls + list */}
      <section className="space-y-6">
        {/* Sticky search + controls */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-rose-100 py-4">
          {/* Row 1: search (left) and filters/sort (right) */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-full md:w-80">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events"
                className="w-full rounded-2xl border border-slate-200 bg-white pr-10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
              />
              {search.trim().length > 0 && (
                <button
                  type="button"
                  aria-label="Clear search"
                  title="Clear"
                  onClick={() => { setSearch(''); load(1) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm flex-1 justify-end">
              {/* Mode filter */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider hidden sm:block">Mode</span>
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer hover:border-rose-300 transition-colors"
                  value={modeFilter}
                  onChange={(e) => { setModeFilter(e.target.value as any); setPage(1); load(1); }}
                >
                  <option value="ALL">All Modes</option>
                  <option value="IN_PERSON">In-person</option>
                  <option value="VIRTUAL">Virtual</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>
              {/* Sort controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all"
                  aria-label={`Toggle sort direction (currently ${sortDir})`}
                  onClick={() => { const next = sortDir === 'ASC' ? 'DESC' : 'ASC'; setSortDir(next); setPage(1); load(1); }}
                >
                  {sortDir === 'ASC' ? (
                    <ArrowUp className="h-4 w-4 text-rose-500" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-rose-500" />
                  )}
                </button>
                <select
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer hover:border-rose-300 transition-colors"
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as any); setPage(1); load(1); }}
                >
                  <option value="startsAt">Date</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>
          </div>
          {/* Row 2: status tabs full-width */}
          <div className="mt-4 flex items-center gap-2 text-sm overflow-x-auto pb-1">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.key}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === tab.key 
                  ? 'bg-rose-50 text-rose-700 shadow-sm ring-1 ring-rose-200' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                onClick={() => { setActiveTab(tab.key); setPage(1); }}
                type="button"
              >
                {tab.icon ? <tab.icon className={`h-4 w-4 ${activeTab === tab.key ? 'text-rose-500' : 'text-slate-400'}`} /> : null}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {banner && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 shadow-sm flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            {banner}
          </div>
        )}

        <div id="events-list" className={viewMode === 'grid' ? "grid sm:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"} tabIndex={-1}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-[2rem] border border-slate-100 p-12 bg-white text-center shadow-sm">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-2">
                <Filter className="w-10 h-10 text-rose-300" />
              </div>
              <div>
                <div className="font-bold text-lg text-slate-900">No events found</div>
                <div className="text-slate-500 mt-1">Try adjusting your filters or create a new event.</div>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            filtered.map((x: any) => (
              <ModernEventCard
                key={x.id}
                event={x}
                onEdit={isAdmin ? (id) => router.push(`/events/${id}/info`) : undefined}
                onDelete={isAdmin ? (event) => setConfirm({ open: true, type: event.status === 'TRASHED' ? 'delete' as any : 'trash', target: event }) : undefined}
              />
            ))
          ) : (
            filtered.map((x: any) => (
              <div
                key={x.id}
                className="group p-4 border rounded-xl bg-white hover:border-rose-200 hover:shadow-lg hover:shadow-rose-100/50 transition-all cursor-pointer"
                onClick={() => router.push(`/events/${x.id}`)}
              >
                {/* List view logic preserved but styled updated */}
                <div className="flex items-start gap-6">
                  {/* Thumbnail */}
                  <div className="w-48 h-32 rounded-lg overflow-hidden border bg-slate-50 flex items-center justify-center relative shrink-0">
                    {(() => {
                      const src = getThumbSrc(x)
                      const failed = thumbFailed[x.id]
                      const shouldAnimate = failed || !src
                      if (shouldAnimate) {
                        return (
                          <div className="w-full h-full grid place-items-center">
                            <div className="w-full h-full">
                              <AvatarIcon seed={getEventBadgeSeed(x)} query={getEventBadgeQuery(x)} size={160} className="!w-full !h-full object-cover" squared />
                            </div>
                          </div>
                        )
                      }
                      const mapHref = getMapLink(x)
                      return (
                        <a href={mapHref} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="block w-full h-full">
                          <img
                            src={src}
                            alt={x.city ? `Map of ${x.city}` : 'Event banner'}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                            onError={() => setThumbFailed(prev => ({ ...prev, [x.id]: true }))}
                          />
                        </a>
                      )
                    })()}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <Link href={`/events/${x.id}`} className="text-lg font-bold text-slate-900 hover:text-rose-600 truncate block transition-colors">
                          {x.name || "Untitled Event"}
                        </Link>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5"><FileClock className="w-4 h-4 text-rose-400"/> {formatDateRange(x.startsAt, x.endsAt) || 'Dates TBA'}</span>
                          <span className="flex items-center gap-1.5"><Radio className="w-4 h-4 text-purple-400"/> {x.eventMode === 'IN_PERSON' ? 'In-Person' : x.eventMode === 'VIRTUAL' ? 'Virtual' : 'Hybrid'}</span>
                          <span className="flex items-center gap-1.5 text-slate-400">|</span>
                          <span className="font-medium text-emerald-600">{x.registrationCount || 0} Registered</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <div className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                          {formatPrice(x.priceInr)}
                        </div>
                        {(() => {
                          const s = statusStyle(x.status); const I = s.Icon; return (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${s.cls}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${s.dot} animate-pulse`} />
                              {x.status}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          <div className="text-sm font-medium text-slate-500">Page {page} of {totalPages}</div>
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 text-sm font-bold rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              disabled={page <= 1}
              onClick={() => load(page - 1)}
            >
              Previous
            </button>
            <button
              className="px-4 py-2 text-sm font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all"
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
            >
              Next Page
            </button>
          </div>
        </div>
      </section>

      {/* Confirmation Dialog */}
      {confirm.open && confirm.target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {confirm.type === 'cancel' ? 'Cancel Event?' : confirm.type === 'delete' ? 'Delete Permanently?' : 'Move to Trash?'}
            </h3>
            <p className="text-slate-500 mb-6 leading-relaxed">
              {confirm.type === 'cancel'
                ? `Are you sure you want to cancel "${confirm.target.name}"? This will mark the event as cancelled.`
                : confirm.type === 'delete'
                  ? `This will permanently delete "${confirm.target.name}". This action cannot be undone.`
                  : `Are you sure you want to move "${confirm.target.name}" to trash? You can restore it later.`}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirm({ open: false, type: null, target: null })}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Keep Event
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
                className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 ${confirm.type === 'cancel' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  }`}
              >
                {confirm.type === 'cancel' ? 'Yes, Cancel Event' : 'Yes, Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
