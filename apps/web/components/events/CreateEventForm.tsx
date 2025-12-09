"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { createEventRequest, CreateEventRequest } from "@/lib/api/events"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const CATEGORY_OPTIONS = [
  'Art & Photos',
  'Automotive',
  'Business',
  'Career',
  'Data & Analytics',
  'Design',
  'Devices & Hardware',
  'Economy & Finance',
  'Education',
  'Engineering',
  'Entertainment & Humor',
  'Environment',
  'Food',
  'Government & Nonprofit',
  'Health & Medicine',
  'Healthcare',
  'Internet',
  'Investor Relations',
  'Law',
  'Leadership & Management',
  'Lifestyle',
  'Marketing',
  'Mobile',
  'News & Politics',
  'Presentations & Public Speaking',
  'Real Estate',
  'Recruiting & HR',
  'Retail',
  'Sales',
  'Science',
  'Self Improvement',
  'Services',
  'Seminar',
  'Small Business & Entrepreneurship',
  'Social Media',
  'Software',
  'Spiritual',
  'Sports',
  'Technology',
  'Travel',
  'User Conference',
  'Workshop',
  'Webinar',
  'Others',
]

const schema = z.object({
  name: z.string().min(1, "Event name is required").max(100),
  category: z.enum([ ...CATEGORY_OPTIONS ] as [string, ...string[]], {
    required_error: 'Category is required',
  }),
  venue: z.string().max(200).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  city: z.string().min(1, "City is required").max(100),
  startDate: z.string().min(1, "Start date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endDate: z.string().min(1, "End date is required"),
  endTime: z.string().min(1, "End time is required"),
  priceInr: z.string().min(1, "Price is required"),
  description: z.string().max(1000).optional().or(z.literal("")),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  budgetInr: z.string().optional().or(z.literal("")),
  expectedAttendees: z.string().optional().or(z.literal("")),
})

export type CreateEventFormValues = z.infer<typeof schema>

export default function CreateEventForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()
  const accessToken = (session as any)?.accessToken as string | undefined
  const [mode, setMode] = useState<'IN_PERSON' | 'VIRTUAL' | 'HYBRID'>('IN_PERSON')
  const [placeQuery, setPlaceQuery] = useState("")
  const [placeOpen, setPlaceOpen] = useState(false)
  const [placeItems, setPlaceItems] = useState<Array<{ id: string; name: string; displayName: string; lat?: number; lon?: number }>>([])
  const [selectedPlace, setSelectedPlace] = useState<{ id: string; name: string; displayName: string; lat?: number; lon?: number } | null>(null)
  const [loadingPlaces, setLoadingPlaces] = useState(false)
  const placeAbortRef = useRef<AbortController | null>(null)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [selectedThemeHex, setSelectedThemeHex] = useState<string | null>(null)
  const [selectedPalette, setSelectedPalette] = useState<string[] | null>(null)
  const [sessions, setSessions] = useState<Array<{ title: string; description?: string; startTime: string; endTime: string; room?: string; track?: string; capacity?: number }>>([])
  const [sTitle, setSTitle] = useState('')
  const [sDesc, setSDesc] = useState('')
  const [sStart, setSStart] = useState('')
  const [sEnd, setSEnd] = useState('')
  const [sRoom, setSRoom] = useState('')
  const [sTrack, setSTrack] = useState('')
  const [sCap, setSCap] = useState('')

  // Stepper (lightweight, non-breaking)
  const steps = ['Basics','Schedule','Location','Planning','Banner','Sessions','Review'] as const
  const searchParams = useSearchParams()
  const [step, setStep] = useState<number>(() => {
    const s = searchParams?.get('step')
    if (s && s.toLowerCase() === 'sessions') return 5
    return 0
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateEventFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'Art & Photos',
      priceInr: "0",
      budgetInr: "",
      expectedAttendees: "",
    },
  })

  const cityValue = watch('city')
  const bannerValue = watch('bannerUrl')

  // When city changes, clear venue suggestions and selection; do NOT auto-open
  useEffect(() => {
    // Clear any stale venue suggestions when city changes
    setPlaceItems([])
    setSelectedPlace(null)
    setPlaceQuery('')
    setPlaceOpen(false)
  }, [cityValue])

  function BannerAssistant({ open, onClose, onSelectImage, onApplyTagline, onSelectTheme, onSelectPalette }: { open: boolean; onClose: () => void; onSelectImage: (url: string) => void; onApplyTagline: (text: string) => void; onSelectTheme: (hex: string) => void; onSelectPalette: (arr: string[]) => void }) {
  const [tab, setTab] = useState<'images' | 'themes' | 'taglines' | 'language'>('images')
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<Array<{ id: string; download_url: string; author: string }>>([])
  const [palettes, setPalettes] = useState<string[][]>([])
  const [tagline, setTagline] = useState<string>('')
  const [lang, setLang] = useState<string>('en')
  const [translating, setTranslating] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch('https://picsum.photos/v2/list?page=2&limit=18')
        const data = await res.json().catch(() => [])
        if (Array.isArray(data)) setImages(data)
      } catch {}
      setLoading(false)
    })()
  }, [open])

  useEffect(() => {
    if (!open) return
    ;(async () => {
      try {
        const seeds = ['0047AB', 'D97706', '16A34A', '7C3AED']
        const out: string[][] = []
        for (const s of seeds) {
          const u = `https://www.thecolorapi.com/scheme?hex=${s}&mode=analogic&count=5`
          const res = await fetch(u)
          const json = await res.json().catch(() => null)
          const cols = Array.isArray(json?.colors) ? json.colors.map((c: any) => c?.hex?.value).filter(Boolean) : []
          if (cols.length) out.push(cols)
        }
        setPalettes(out)
      } catch {}
    })()
  }, [open])

  useEffect(() => {
    if (!open) return
    ;(async () => {
      try {
        const res = await fetch('https://api.quotable.io/random?tags=success|inspirational|technology')
        const q = await res.json().catch(() => null)
        if (q?.content) setTagline(q.content)
      } catch {}
    })()
  }, [open])

  const translateTagline = async (target: string) => {
    setTranslating(true)
    try {
      const res = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: tagline, source: 'en', target, format: 'text' }),
      })
      if (res.ok) {
        const j = await res.json().catch(() => null)
        const out = j?.translatedText || tagline
        setTagline(out)
        setLang(target)
      }
    } catch {}
    setTranslating(false)
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-lg border bg-white shadow-lg" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-semibold">Banner assistant</div>
          <button className="text-sm px-2 py-1 rounded border hover:bg-slate-50" onClick={onClose}>Close</button>
        </div>
        <div className="px-4 pt-3 border-b">
          <div className="flex items-center gap-3 text-sm">
            <button className={`px-3 py-2 rounded ${tab==='images'?'bg-indigo-600 text-white':'border'}`} onClick={()=>setTab('images')}>Images</button>
            <button className={`px-3 py-2 rounded ${tab==='themes'?'bg-indigo-600 text-white':'border'}`} onClick={()=>setTab('themes')}>Themes</button>
            <button className={`px-3 py-2 rounded ${tab==='taglines'?'bg-indigo-600 text-white':'border'}`} onClick={()=>setTab('taglines')}>Taglines</button>
            <button className={`px-3 py-2 rounded ${tab==='language'?'bg-indigo-600 text-white':'border'}`} onClick={()=>setTab('language')}>Language</button>
          </div>
        </div>
        <div className="p-4 max-h-[70vh] overflow-auto">
          {tab === 'images' && (
            <div>
              <div className="mb-3 text-sm text-muted-foreground">Pick a free banner image (Picsum). Selecting will fill your Banner URL.</div>
              {loading ? (
                <div className="text-sm text-slate-500">Loading images…</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map(img => {
                    const url = `https://picsum.photos/id/${img.id}/1200/600`
                    return (
                      <button key={img.id} className="relative group rounded-md overflow-hidden border" onClick={()=> onSelectImage(url)}>
                        <img src={`https://picsum.photos/id/${img.id}/400/200`} alt={img.author} className="w-full h-28 object-cover" loading="lazy" />
                        <span className="absolute bottom-0 left-0 right-0 text-[10px] bg-black/40 text-white px-2 py-1 truncate">{img.author}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
          {tab === 'themes' && (
            <div>
              <div className="mb-3 text-sm text-muted-foreground">Color ideas from The Color API. Click to copy a hex code to clipboard.</div>
              <div className="space-y-3">
                {palettes.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {row.map((hex) => (
                      <button
                        key={hex}
                        className="h-10 flex-1 rounded-md border"
                        style={{ backgroundColor: hex }}
                        title={hex}
                        onClick={() => {
                          onSelectTheme(hex)
                          onSelectPalette(row)
                          navigator.clipboard?.writeText(hex).catch(()=>{})
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'taglines' && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Inspirational line from Quotable. Edit if you like and apply to Description.</div>
              <textarea className="w-full rounded-md border p-2 text-sm" rows={3} value={tagline} onChange={(e)=> setTagline(e.target.value)} />
              <div className="flex items-center gap-2">
                <button className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50" onClick={async()=>{ try { const r = await fetch('https://api.quotable.io/random?tags=success|inspirational|technology'); const q = await r.json(); if (q?.content) setTagline(q.content) } catch {} }}>Randomize</button>
                <button className="rounded-md bg-indigo-600 text-white px-3 py-2 text-sm" onClick={()=> onApplyTagline(tagline)}>Apply to Description</button>
              </div>
            </div>
          )}
          {tab === 'language' && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Translate the current tagline using LibreTranslate.</div>
              <div className="flex items-center gap-2">
                <select className="rounded-md border px-2 py-1 text-sm" value={lang} onChange={(e)=> setLang(e.target.value)}>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
                <button className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50" onClick={() => translateTagline(lang)} disabled={translating}>{translating ? 'Translating…' : 'Translate'}</button>
                <button className="rounded-md bg-indigo-600 text-white px-3 py-2 text-sm" onClick={()=> onApplyTagline(tagline)}>Apply to Description</button>
              </div>
              <textarea className="w-full rounded-md border p-2 text-sm" rows={3} value={tagline} onChange={(e)=> setTagline(e.target.value)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

  // Load venue suggestions when user types and city is provided
  useEffect(() => {
    const q = (placeQuery || '').trim()
    const city = (cityValue || '').trim()
    if (!city) {
      setPlaceItems([])
      setLoadingPlaces(false)
      return
    }
    // If user hasn't typed 2+ chars yet, only fetch when dropdown is open (seeded list)
    if (q.length < 2 && !placeOpen) {
      setPlaceItems([])
      setLoadingPlaces(false)
      return
    }
    // debounce + abort
    if (placeAbortRef.current) {
      try { placeAbortRef.current.abort() } catch {}
    }
    const controller = new AbortController()
    placeAbortRef.current = controller
    setLoadingPlaces(true)
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ city, q, limit: '7' })
        const res = await fetch(`/api/geo/places?${params.toString()}`, { signal: controller.signal })
        if (!res.ok) {
          setPlaceItems([])
          setLoadingPlaces(false)
          return
        }
        const data = await res.json().catch(() => ({ items: [] }))
        const items = Array.isArray(data.items) ? data.items : []
        setPlaceItems(items)
        setLoadingPlaces(false)
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setPlaceItems([])
          setLoadingPlaces(false)
        }
      }
    }, 300)
    return () => { clearTimeout(t); controller.abort() }
  }, [placeQuery, cityValue, placeOpen])

  const onSubmit = async (values: CreateEventFormValues) => {
    setError(null)
    setSubmitting(true)
    try {
      const startsAt = new Date(`${values.startDate}T${values.startTime}`)
      const endsAt = new Date(`${values.endDate}T${values.endTime}`)

      const payload: CreateEventRequest = {
        name: values.name,
        venue: values.venue || undefined,
        address: values.address || undefined,
        city: values.city,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        priceInr: parseInt(values.priceInr, 10),
        description: values.description || undefined,
        bannerUrl: values.bannerUrl || undefined,
        category: values.category,
        eventMode: mode,
        budgetInr: values.budgetInr ? parseInt(values.budgetInr, 10) : undefined,
        expectedAttendees: values.expectedAttendees ? parseInt(values.expectedAttendees, 10) : undefined,
      }

      const created = await createEventRequest(payload, accessToken)

      // If we have a selected place or typed venue, create/find a Location and attach planning
      try {
        let locationId: number | undefined = undefined
        const cityVal = values.city
        if (selectedPlace || values.venue) {
          const locPayload = {
            placeId: selectedPlace?.id || undefined,
            name: selectedPlace?.name || values.venue || 'Venue',
            displayName: selectedPlace?.displayName || values.address || '',
            address: values.address || '',
            city: cityVal || '',
            state: '',
            country: '',
            lat: selectedPlace?.lat,
            lon: selectedPlace?.lon,
            timezone: '',
            venueType: undefined as any,
          }
          const locRes = await fetch('/api/locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(locPayload) })
          if (locRes.ok) {
            const loc = await locRes.json().catch(()=>null)
            locationId = loc?.id
          }
        }

        const planningBody: any = {
          budgetInr: values.budgetInr ? Number(values.budgetInr) : undefined,
          expectedAttendees: values.expectedAttendees ? Number(values.expectedAttendees) : undefined,
          locationId: locationId,
          themePrimaryHex: selectedThemeHex || undefined,
          themePalette: selectedPalette || undefined,
        }
        // Create or update planning (POST will upsert in service)
        await fetch(`/api/events/${created?.id}/planning`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(planningBody) }).catch(()=>{})
      } catch {}

      // Create sessions if provided
      try {
        if (created?.id && sessions.length > 0) {
          const failures: string[] = []
          for (const s of sessions) {
            // Basic validation: end must be after start
            const st = new Date(s.startTime)
            const et = new Date(s.endTime)
            if (!(st instanceof Date) || !(et instanceof Date) || isNaN(st.getTime()) || isNaN(et.getTime()) || et <= st) {
              failures.push(`Session "${s.title}" has invalid time range`)
              continue
            }
            const body = {
              title: s.title,
              description: s.description || undefined,
              startTime: st.toISOString(),
              endTime: et.toISOString(),
              room: s.room || undefined,
              track: s.track || undefined,
              capacity: s.capacity && s.capacity > 0 ? s.capacity : undefined,
            }
            const resp = await fetch(`/api/events/${created.id}/sessions`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            if (!resp.ok) {
              const t = await resp.text().catch(()=> '')
              failures.push(t || `Failed to create session "${s.title}"`)
            }
          }
          if (failures.length > 0) {
            setError(failures.join('\n'))
            throw new Error('Some sessions failed to create')
          }
        }
      } catch {}

      // Notify organizer via email (best-effort, non-blocking)
      try {
        if (created?.id) {
          await fetch('/api/notifications/event-created', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: created.id,
              name: values.name,
              startsAt: new Date(`${values.startDate}T${values.startTime}`).toISOString(),
              endsAt: new Date(`${values.endDate}T${values.endTime}`).toISOString(),
              city: values.city,
              venue: values.venue || selectedPlace?.name || '',
            }),
          }).catch(()=>{})
        }
      } catch {}

      // Redirect to home and show created banner (only if no errors)
      if (!error) router.push("/?created=1")
    } catch (e: any) {
      setError(e?.message || "Failed to create event")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Stepper header */}
      <div className="rounded-xl border bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          {steps.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(i)}
              className={`text-sm rounded-full border px-3 py-1.5 ${step===i? 'bg-indigo-600 text-white border-indigo-600':'hover:bg-slate-50'}`}
              title={`Step ${i+1}: ${label}`}
            >{i+1}. {label}</button>
          ))}
        </div>
        <div className="mt-2 text-xs text-slate-500">Step {step+1} of {steps.length}: <span className="font-medium">{steps[step]}</span></div>
      </div>
      {/* Event Mode */}
      <div>
        <Label className="mb-2 block">Event Mode</Label>
        <div className="grid grid-cols-3 gap-3">
          {([
            { key: 'IN_PERSON', title: 'In-person', desc: 'Physical venue' },
            { key: 'VIRTUAL', title: 'Virtual', desc: 'Remote participants' },
            { key: 'HYBRID', title: 'Hybrid', desc: 'In-person + virtual' },
          ] as const).map((opt) => (
            <button
              type="button"
              key={opt.key}
              onClick={() => setMode(opt.key)}
              className={`text-left rounded-xl border p-4 transition-colors ${
                mode === opt.key
                  ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400/60 dark:bg-indigo-950/20'
                  : 'border-border hover:bg-slate-50 dark:border-white/10 dark:hover:bg-slate-900'
              }`}
            >
              <div className="font-semibold">{opt.title}</div>
              <p className="text-sm text-muted-foreground">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <Label htmlFor="name">Event Name</Label>
        <Input id="name" placeholder="e.g., Annual Tech Summit" {...register("name")} />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          className="mt-1 block w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
          {...register('category')}
        >
          {CATEGORY_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
        )}
      </div>

      {/* Schedule */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
          {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>}
        </div>
        <div>
          <Label htmlFor="startTime">Start Time</Label>
          <Input id="startTime" type="time" {...register("startTime")} />
          {errors.startTime && <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>}
        </div>
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input id="endDate" type="date" {...register("endDate")} />
          {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>}
        </div>
        <div>
          <Label htmlFor="endTime">End Time</Label>
          <Input id="endTime" type="time" {...register("endTime")} />
          {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>}
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" placeholder="City" {...register("city")} />
          {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
        </div>
        <div>
          <Label htmlFor="venue">Venue</Label>
          <div className="relative">
            <Input
              id="venue"
              placeholder={cityValue ? "Start typing a venue" : "Enter city first"}
              {...register("venue")}
              onChange={(e) => { setPlaceQuery(e.target.value); (register("venue").onChange as any)?.(e); setPlaceOpen(true) }}
              onFocus={() => cityValue && setPlaceOpen(true)}
              autoComplete="off"
              disabled={!cityValue}
            />
            {placeOpen && (loadingPlaces || placeItems.length > 0) && (
              <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow">
                {loadingPlaces ? (
                  <div className="px-3 py-4 text-sm text-slate-500 text-center">
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                    <span className="ml-2">Loading venues...</span>
                  </div>
                ) : (
                  <ul className="max-h-60 overflow-auto no-scrollbar text-sm">
                    {placeItems.map((p) => (
                      <li
                        key={p.id}
                        className="px-3 py-2 hover:bg-slate-50 cursor-pointer"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          const v = document.getElementById('venue') as HTMLInputElement | null
                          const addr = document.getElementById('address') as HTMLInputElement | null
                          if (v) v.value = p.name
                          if (addr) addr.value = p.displayName
                          setSelectedPlace(p)
                          setPlaceOpen(false)
                        }}
                      >
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-slate-500 truncate">{p.displayName}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" placeholder="Street, Area, Landmark" {...register("address")} />
        </div>
      </div>

      {/* Planning extras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="budgetInr">Budget (INR)</Label>
          <Input id="budgetInr" type="number" min={0} step="1" placeholder="e.g., 50000" {...register('budgetInr')} />
        </div>
        <div>
          <Label htmlFor="expectedAttendees">Expected Attendees</Label>
          <Input id="expectedAttendees" type="number" min={0} step="1" placeholder="e.g., 250" {...register('expectedAttendees')} />
        </div>
      </div>

      {/* Price */}
      <div>
        <Label htmlFor="priceInr">Ticket Price (INR)</Label>
        <Input id="priceInr" type="number" min={0} step="1" {...register("priceInr")} />
        {errors.priceInr && <p className="mt-1 text-sm text-red-600">{errors.priceInr.message}</p>}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={4} placeholder="Tell attendees what your event is about" {...register("description")} />
      </div>

      {/* Banner */}
      <div>
        <Label htmlFor="bannerUrl">Banner URL</Label>
        <div className="flex items-center gap-2">
          <Input
            id="bannerUrl"
            type="url"
            placeholder="https://..."
            {...register("bannerUrl")}
            onFocus={() => setAssistantOpen(true)}
          />
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50"
            onClick={() => setAssistantOpen(true)}
          >
            Open assistant
          </button>
        </div>
        {bannerValue ? (
          <div className="mt-2 rounded-md overflow-hidden" style={{ border: `2px solid ${selectedThemeHex || '#e5e7eb'}` }}>
            <img src={bannerValue} alt="Banner preview" className="w-full h-40 object-cover" />
          </div>
        ) : null}
        {selectedThemeHex && (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-block h-4 w-4 rounded" style={{ backgroundColor: selectedThemeHex }} />
            <span>Theme: {selectedThemeHex}</span>
          </div>
        )}
        <BannerAssistant
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          onSelectImage={(url) => {
            const el = document.getElementById('bannerUrl') as HTMLInputElement | null
            if (el) el.value = url
            ;(register('bannerUrl').onChange as any)?.({ target: { value: url, name: 'bannerUrl' } })
          }}
          onApplyTagline={(text) => {
            const el = document.getElementById('description') as HTMLTextAreaElement | null
            if (el) el.value = text
            ;(register('description').onChange as any)?.({ target: { value: text, name: 'description' } })
          }}
          onSelectTheme={(hex) => setSelectedThemeHex(hex)}
          onSelectPalette={(arr) => setSelectedPalette(arr)}
        />
      </div>

      {/* Sessions (optional) */}
      {step === 5 && (
      <div className="rounded-md border p-4 space-y-3 bg-white">
        <h2 className="text-sm font-semibold">Add Session</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Title</label>
            <Input placeholder="e.g., Opening Keynote" value={sTitle} onChange={(e)=> setSTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Track</label>
            <Input placeholder="e.g., Main" value={sTrack} onChange={(e)=> setSTrack(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Room</label>
            <Input placeholder="e.g., Hall A" value={sRoom} onChange={(e)=> setSRoom(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Capacity</label>
            <Input type="number" placeholder="e.g., 200" value={sCap} onChange={(e)=> setSCap(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Starts</label>
            <Input type="datetime-local" value={sStart} onChange={(e)=> setSStart(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Ends</label>
            <Input type="datetime-local" value={sEnd} onChange={(e)=> setSEnd(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Description</label>
            <Textarea rows={3} placeholder="Session details" value={sDesc} onChange={(e)=> setSDesc(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" disabled={!sTitle.trim() || !sStart || !sEnd} onClick={()=>{
            if (!sTitle.trim() || !sStart || !sEnd) return
            const cap = sCap ? Number(sCap) : undefined
            setSessions(prev => [...prev, { title: sTitle.trim(), description: sDesc || undefined, startTime: sStart, endTime: sEnd, room: sRoom || undefined, track: sTrack || undefined, capacity: cap }])
            setSTitle(''); setSDesc(''); setSStart(''); setSEnd(''); setSRoom(''); setSTrack(''); setSCap('')
          }}>Add Session</Button>
        </div>
        {sessions.length > 0 && (
          <div className="mt-3 rounded-md border bg-white">
            <div className="px-3 py-2 text-sm font-medium border-b">Sessions to be created</div>
            <ul className="divide-y">
              {sessions.map((s, idx)=> (
                <li key={idx} className="px-3 py-2 text-sm flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{s.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{new Date(s.startTime).toLocaleString()} → {new Date(s.endTime).toLocaleString()} {s.room ? `· ${s.room}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50" onClick={()=> setSessions(prev => prev.filter((_,i)=> i!==idx))}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      )}

      {/* Actions */}
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20">{error}</div>}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setStep((s)=> Math.max(0, s-1))}>Back</Button>
          <Button type="button" variant="outline" onClick={() => setStep((s)=> Math.min(steps.length-1, s+1))}>Next</Button>
        </div>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  )
}
