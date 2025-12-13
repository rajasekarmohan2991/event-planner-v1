'use client'

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Search, IndianRupee, FileText, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const CATEGORIES = ['Catering','Venue','Photography','Entertainment','Decoration','Other'] as const
const STATUSES = ['booked','pending'] as const

type VendorFormValues = {
  eventId: string
  name: string
  category: (typeof CATEGORIES)[number]
  contactName?: string
  email?: string
  phone?: string
  costInr?: number
  contract?: boolean
  status: (typeof STATUSES)[number]
  notes?: string
}

const vendorSchema = z.object({
  eventId: z.string().min(1, 'Event is required'),
  name: z.string().min(2, 'Name is required'),
  category: z.enum(CATEGORIES),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  costInr: z.coerce.number().min(0).optional(),
  contract: z.boolean().optional(),
  status: z.enum(STATUSES),
  notes: z.string().optional(),
})

type Vendor = {
  id: string
  eventId: string
  name: string
  category: string
  contactName?: string
  email?: string
  phone?: string
  costInr?: number
  contract?: boolean
  status: 'booked'|'pending'|'cancelled'
  notes?: string
  createdAt: string
  updatedAt: string
}

type Stats = { total: number; booked: number; totalCost: number }

type EventLite = { id: string; name: string }

export default function CompanyVendorsPage() {
  const [events, setEvents] = useState<EventLite[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, booked: 0, totalCost: 0 })
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('')

  const loadEvents = async () => {
    try {
      const res = await fetch('/api/company/dashboard', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      const evts: EventLite[] = (data?.events || []).map((e: any) => ({ id: String(e.id), name: e.name }))
      setEvents(evts)
      if (!selectedEvent && evts[0]) setSelectedEvent(evts[0].id)
    } catch {}
  }

  const loadVendors = async (eventId: string) => {
    if (!eventId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/vendors`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setVendors(data.vendors || [])
        setStats(data.stats || { total: 0, booked: 0, totalCost: 0 })
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { loadEvents() }, [])
  useEffect(() => { if (selectedEvent) loadVendors(selectedEvent) }, [selectedEvent])

  const filtered = useMemo(() => {
    let list = vendors
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(v => v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q) || (v.contactName||'').toLowerCase().includes(q))
    }
    if (category) list = list.filter(v => v.category === category)
    return list
  }, [vendors, search, category])

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: { eventId: '', name: '', category: 'Other', status: 'pending', contract: false, costInr: 0 }
  })

  const [open, setOpen] = useState(false)

  const onSubmit = async (values: VendorFormValues) => {
    try {
      const res = await fetch(`/api/events/${values.eventId}/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to add vendor')
      setOpen(false)
      form.reset()
      if (values.eventId === selectedEvent) loadVendors(selectedEvent)
    } catch (e: any) {
      alert(e?.message || 'Error adding vendor')
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendor Management</h1>
          <p className="text-sm text-gray-600">Manage vendors and service providers</p>
        </div>
        <Dialog open={open} onOpenChange={(o)=>{ setOpen(o); if (o) form.setValue('eventId', selectedEvent || events[0]?.id || '') }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4"/> Add Vendor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Vendor</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField control={form.control} name="eventId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select event"/></SelectTrigger>
                      <SelectContent>
                        {events.map(e => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Elegant Catering Co." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select"/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="booked">Booked</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="contactName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl><Input placeholder="Maria Rodriguez" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl><Input placeholder="+1-555-0201" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input placeholder="maria@vendor.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="costInr" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost (₹)</FormLabel>
                      <FormControl><Input type="number" min={0} step="100" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contract" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract</FormLabel>
                      <Select value={String(field.value||'false')} onValueChange={(v)=>field.onChange(v==='true')}>
                        <SelectTrigger><SelectValue placeholder="No"/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl><Input placeholder="Special requirements, timings, etc." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <DialogFooter>
                  <Button type="submit">Save Vendor</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><div className="text-xs text-gray-500">Total Vendors</div><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card className="bg-green-50 border-green-200"><CardContent className="p-4"><div className="text-xs text-green-700">Booked/Paid</div><div className="text-2xl font-bold text-green-900">{stats.booked}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-gray-500">Total Cost</div><div className="text-2xl font-bold flex items-center gap-1"><IndianRupee className="w-5 h-5"/>{stats.totalCost}</div></CardContent></Card>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex-1 flex items-center gap-2 border rounded px-3">
          <Search className="w-4 h-4 text-gray-500"/>
          <input className="flex-1 h-10 outline-none" placeholder="Search vendors..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Categories"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {CATEGORIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger className="w-56"><SelectValue placeholder="All Events"/></SelectTrigger>
          <SelectContent>
            {events.map(e => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(v => (
          <Card key={v.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-lg">{v.name}</div>
                  <div className="text-sm text-gray-600">{v.category}</div>
                </div>
                <Badge variant="secondary" className={v.status==='booked' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                  {v.status}
                </Badge>
              </div>

              <div className="text-sm space-y-1">
                {v.contactName && <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-500"/>{v.contactName}</div>}
                {v.email && <div className="flex items-center gap-2"><span className="text-gray-500">✉️</span>{v.email}</div>}
                {v.phone && <div className="flex items-center gap-2"><span className="text-gray-500">📞</span>{v.phone}</div>}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm">
                  <div className="text-gray-500">Cost</div>
                  <div className="font-semibold">₹{Number(v.costInr || 0)}</div>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {v.contract ? (
                    <span className="flex items-center gap-1 text-green-700"><FileText className="w-4 h-4"/> Contract</span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-500"><FileText className="w-4 h-4"/> No Contract</span>
                  )}
                </div>
              </div>

              <div>
                <Button variant="secondary" className="w-full">View Details</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="text-sm text-gray-600 p-6">No vendors found.</div>
        )}
      </div>
    </div>
  )
}
