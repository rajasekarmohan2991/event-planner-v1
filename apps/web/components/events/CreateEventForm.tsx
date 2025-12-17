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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { BannerAssistant } from './BannerAssistant'

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
  category: z.enum([...CATEGORY_OPTIONS] as [string, ...string[]], {
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
  const steps = ['Basics', 'Schedule', 'Location', 'Planning', 'Banner', 'Sessions', 'Review'] as const
  const searchParams = useSearchParams()
  const [step, setStep] = useState<number>(() => {
    const s = searchParams?.get('step')
    if (s && s.toLowerCase() === 'sessions') return 5
    return 0
  })

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'Art & Photos',
      priceInr: "0",
      budgetInr: "",
      expectedAttendees: "",
      name: "",
      venue: "",
      address: "",
      city: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      description: "",
      bannerUrl: "",
    },
  })

  const { formState: { errors }, setValue, watch } = form
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
      try { placeAbortRef.current.abort() } catch { }
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
            const loc = await locRes.json().catch(() => null)
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
        await fetch(`/api/events/${created?.id}/planning`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(planningBody) }).catch(() => { })
      } catch { }

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
              const t = await resp.text().catch(() => '')
              failures.push(t || `Failed to create session "${s.title}"`)
            }
          }
          if (failures.length > 0) {
            setError(failures.join('\n'))
            throw new Error('Some sessions failed to create')
          }
        }
      } catch { }

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
          }).catch(() => { })
        }
      } catch { }

      // Redirect to home and show created banner (only if no errors)
      if (!error) router.push("/?created=1")
    } catch (e: any) {
      setError(e?.message || "Failed to create event")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Stepper header */}
        <div className="rounded-xl border bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            {steps.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(i)}
                className={`text-sm rounded-full border px-3 py-1.5 ${step === i ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-slate-50'}`}
                title={`Step ${i + 1}: ${label}`}
              >{i + 1}. {label}</button>
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-500">Step {step + 1} of {steps.length}: <span className="font-medium">{steps[step]}</span></div>
        </div>

        {/* Event Mode */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Event Mode</Label>
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
                    className={`text-left rounded-xl border p-4 transition-colors ${mode === opt.key
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

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Annual Tech Summit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Schedule */}
        {step === 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Location */}
        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Venue</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        placeholder={cityValue ? "Start typing a venue" : "Enter city first"}
                        {...field}
                        onChange={(e) => {
                          setPlaceQuery(e.target.value)
                          field.onChange(e)
                          setPlaceOpen(true)
                        }}
                        onFocus={() => cityValue && setPlaceOpen(true)}
                        autoComplete="off"
                        disabled={!cityValue}
                      />
                    </FormControl>
                    {placeOpen && (loadingPlaces || placeItems.length > 0) && (
                      <div className="absolute z-20 mt-1 w-full rounded-md border bg-white shadow-lg">
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
                                  setValue('venue', p.name)
                                  // Also try to help fill address if available, though form doesn't strictly depend on it for location creation
                                  // Actually better to let user fill address, but we set display name hint
                                  const addrField = document.getElementById('address') as HTMLInputElement
                                  if (addrField) addrField.value = p.displayName
                                  setValue('address', p.displayName)

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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input id="address" placeholder="Street, Area, Landmark" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Planning extras */}
        {step === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="budgetInr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (INR)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="1" placeholder="e.g., 50000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expectedAttendees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Attendees</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="1" placeholder="e.g., 250" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priceInr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Price (INR)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Tell attendees what your event is about" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* Banner */}
        {step === 4 && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="bannerUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner URL</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="https://..."
                        {...field}
                        onFocus={() => setAssistantOpen(true)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAssistantOpen(true)}
                      >
                        Assistant
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                setValue('bannerUrl', url)
              }}
              onApplyTagline={(text) => {
                setValue('description', text)
              }}
              onSelectTheme={(hex) => setSelectedThemeHex(hex)}
              onSelectPalette={(arr) => setSelectedPalette(arr)}
            />
          </div>
        )}

        {/* Sessions (optional) */}
        {step === 5 && (
          <div className="rounded-md border p-4 space-y-3 bg-white">
            <h2 className="text-sm font-semibold">Add Session</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Title</label>
                <Input placeholder="e.g., Opening Keynote" value={sTitle} onChange={(e) => setSTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Track</label>
                <Input placeholder="e.g., Main" value={sTrack} onChange={(e) => setSTrack(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Room</label>
                <Input placeholder="e.g., Hall A" value={sRoom} onChange={(e) => setSRoom(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Capacity</label>
                <Input type="number" placeholder="e.g., 200" value={sCap} onChange={(e) => setSCap(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Starts</label>
                <Input type="datetime-local" value={sStart} onChange={(e) => setSStart(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Ends</label>
                <Input type="datetime-local" value={sEnd} onChange={(e) => setSEnd(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-500 mb-1">Description</label>
                <Textarea rows={3} placeholder="Session details" value={sDesc} onChange={(e) => setSDesc(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" disabled={!sTitle.trim() || !sStart || !sEnd} onClick={() => {
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
                  {sessions.map((s, idx) => (
                    <li key={idx} className="px-3 py-2 text-sm flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{s.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{new Date(s.startTime).toLocaleString()} → {new Date(s.endTime).toLocaleString()} {s.room ? `· ${s.room}` : ''}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50" onClick={() => setSessions(prev => prev.filter((_, i) => i !== idx))}>Remove</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Review Step (6) - optional summary could go here, for now just create button is visible in actions */}
        {step === 6 && (
          <div className="text-center py-10">
            <h3 className="text-lg font-medium">Ready to create?</h3>
            <p className="text-gray-500 mb-6">Review your details and click Create.</p>
          </div>
        )}

        {/* Actions */}
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20">{error}</div>}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Back</Button>
            <Button type="button" variant="outline" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1}>Next</Button>
          </div>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
