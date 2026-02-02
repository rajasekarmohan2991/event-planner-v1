'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const CATEGORIES = ['Catering', 'Venue', 'Photography', 'Entertainment', 'Decoration', 'Other'] as const
const STATUSES = ['booked', 'pending', 'cancelled'] as const

const schema = z.object({
  name: z.string().min(2),
  category: z.enum(CATEGORIES),
  status: z.enum(STATUSES),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  costInr: z.coerce.number().min(0).optional(),
  contract: z.boolean().optional(),
  contractUrl: z.string().url().optional().or(z.literal('')),
  reason: z.string().optional(),
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
  contractUrl?: string
  attachments?: { id: string; url: string; name?: string; kind?: string; uploadedAt: string }[]
  status: 'booked' | 'pending' | 'cancelled'
  notes?: string
  createdAt: string
  updatedAt: string
}

type Log = { t: string; type: string; by?: string | null;[k: string]: any }

export default function VendorDetailsPage() {
  const params = useParams<{ eventId: string; vendorId: string }>()
  const router = useRouter()
  const eventId = String(params?.eventId || '')
  const vendorId = String(params?.vendorId || '')

  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [originalStatus, setOriginalStatus] = useState<'booked' | 'pending' | 'cancelled'>('pending')
  const [attUploading, setAttUploading] = useState(false)
  const [attUploadError, setAttUploadError] = useState<string | null>(null)
  const [attName, setAttName] = useState('')
  const [attKind, setAttKind] = useState('invoice')

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', category: 'Other', status: 'pending', contract: false, costInr: 0, contractUrl: '', reason: '' }
  })

  const onRemoveContract = async () => {
    if (!confirm('Remove contract for this vendor?')) return
    const res = await fetch(`/api/events/${eventId}/vendors`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ vendorId, contract: false, contractUrl: '' })
    })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(d?.error || 'Failed to remove contract')
      return
    }
    await load()
  }

  const onUploadAttachment = async (file: File) => {
    try {
      setAttUploadError(null)
      setAttUploading(true)
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/uploads', { method: 'POST', body: fd })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message || 'Upload failed')
      const url = data?.url
      if (!url) throw new Error('No URL returned')
      const patch = await fetch(`/api/events/${eventId}/vendors`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ vendorId, addAttachment: { url, name: attName || file.name, kind: attKind } })
      })
      const pd = await patch.json().catch(() => null)
      if (!patch.ok) throw new Error(pd?.error || 'Failed to add attachment')
      setAttName('')
      setAttKind('invoice')
      await load()
    } catch (e: any) {
      setAttUploadError(e?.message || 'Upload failed')
    } finally {
      setAttUploading(false)
    }
  }

  const onRemoveAttachment = async (id: string) => {
    if (!confirm('Remove this attachment?')) return
    const res = await fetch(`/api/events/${eventId}/vendors`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ vendorId, removeAttachmentId: id })
    })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(d?.error || 'Failed to remove attachment')
      return
    }
    await load()
  }

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/events/${eventId}/vendors`, { credentials: 'include' })
      const data = await res.json()
      const found: Vendor | undefined = (data.vendors || []).find((v: Vendor) => v.id === vendorId)
      if (found) {
        setVendor(found)
        form.reset({
          name: found.name,
          category: (found.category as any) || 'Other',
          status: found.status,
          contactName: found.contactName || '',
          email: found.email || '',
          phone: found.phone || '',
          costInr: Number(found.costInr || 0),
          contract: Boolean(found.contract),
          contractUrl: found.contractUrl || '',
          reason: '',
          notes: found.notes || ''
        })
        setOriginalStatus(found.status)
      }

      const lr = await fetch(`/api/events/${eventId}/vendors/${vendorId}/logs`, { credentials: 'include' })
      const ld = await lr.json()
      setLogs(Array.isArray(ld.logs) ? ld.logs : [])
    } finally { setLoading(false) }
  }

  useEffect(() => { if (eventId && vendorId) load() }, [eventId, vendorId])

  const onSave = async (values: z.infer<typeof schema>) => {
    const reasonToSend = values.status !== originalStatus ? (values.reason || '') : undefined
    const res = await fetch(`/api/events/${eventId}/vendors`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ vendorId, ...values, reason: reasonToSend })
    })
    const d = await res.json()
    if (!res.ok) {
      alert(d?.error || 'Failed to save vendor')
      return
    }
    await load()
  }

  const onDelete = async () => {
    if (!confirm('Delete this vendor?')) return
    const res = await fetch(`/api/events/${eventId}/vendors`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ vendorId })
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d?.error || 'Failed to delete vendor')
      return
    }
    router.push('/company/vendors')
  }

  if (loading) return <div className="p-6">Loading vendor...</div>
  if (!vendor) return <div className="p-6">Vendor not found</div>

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/company/vendors" className="text-sm text-blue-600">← Back to Vendors</Link>
          <h1 className="text-2xl font-bold mt-1">{vendor.name}</h1>
          <div className="text-sm text-gray-600">{vendor.category}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={vendor.status === 'booked' ? 'bg-green-100 text-green-700' : vendor.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>{vendor.status}</Badge>
          <Button variant="secondary" onClick={onRemoveContract} disabled={!vendor.contract && !vendor.contractUrl}>Remove Contract</Button>
          <Button variant="destructive" onClick={onDelete}>Delete</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Edit Vendor</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSave)}>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                {(form.watch('status') !== originalStatus) && (
                  <FormField control={form.control} name="reason" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason (for status change)</FormLabel>
                      <FormControl><Input placeholder="e.g., Negotiation delay, scope change, vendor unavailable" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                <FormField control={form.control} name="contract" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract</FormLabel>
                    <Select value={String(field.value || 'false')} onValueChange={(v) => field.onChange(v === 'true')}>
                      <SelectTrigger><SelectValue placeholder="No" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
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
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
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
                <FormField control={form.control} name="contractUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract File URL</FormLabel>
                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Upload Contract</div>
                <input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      setUploadError(null)
                      setUploading(true)
                      const fd = new FormData()
                      fd.append('file', file)
                      const res = await fetch('/api/uploads', { method: 'POST', body: fd })
                      const data = await res.json().catch(() => null)
                      if (!res.ok) throw new Error(data?.message || 'Upload failed')
                      if (data?.url) {
                        form.setValue('contractUrl', data.url)
                        form.setValue('contract', true)
                      }
                    } catch (err: any) {
                      setUploadError(err?.message || 'Upload failed')
                    } finally {
                      setUploading(false)
                    }
                  }}
                />
                {uploading ? <div className="mt-1 text-xs text-slate-500">Uploading...</div> : null}
                {uploadError ? <div className="mt-1 text-xs text-rose-600">{uploadError}</div> : null}
                {form.watch('contractUrl') ? (
                  <div className="mt-2 text-xs">
                    <a href={form.watch('contractUrl') || '#'} target="_blank" className="text-blue-600 underline">View uploaded contract</a>
                  </div>
                ) : null}
              </div>

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex gap-2">
                <Button type="submit">Save Changes</Button>
                <Link href={`/company/vendors`} className="ml-auto"><Button variant="secondary">Back</Button></Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Activity Timeline</CardTitle></CardHeader>
        <CardContent>
          {logs.length === 0 && <div className="text-sm text-gray-600">No activity yet.</div>}
          <div className="space-y-3">
            {logs.slice().reverse().map((log, idx) => (
              <div key={idx} className="border rounded p-3 text-sm">
                <div className="flex justify-between">
                  <div className="font-semibold">{log.type}</div>
                  <div className="text-gray-500">{new Date(log.t).toLocaleString()}</div>
                </div>
                {log.by && <div className="text-gray-600 text-xs">By: {log.by}</div>}
                {log.changes && (
                  <div className="mt-2 text-xs">
                    {Object.entries(log.changes).map(([k, v]: any) => (
                      <div key={k}>{k}: {String(v.from)} → {String(v.to)}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Attachments</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <div className="text-xs text-slate-500 mb-1">Attachment Name</div>
                <Input value={attName} onChange={e => setAttName(e.target.value)} placeholder="e.g., Advance Invoice" />
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Type</div>
                <Select value={attKind} onValueChange={setAttKind}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Upload File</div>
                <input type="file" onChange={e => { const f = e.target.files?.[0]; if (f) onUploadAttachment(f) }} />
                {attUploading ? <div className="mt-1 text-xs text-slate-500">Uploading...</div> : null}
                {attUploadError ? <div className="mt-1 text-xs text-rose-600">{attUploadError}</div> : null}
              </div>
            </div>

            <div className="space-y-2">
              {(vendor.attachments || []).length === 0 ? (
                <div className="text-sm text-gray-600">No attachments.</div>
              ) : (
                (vendor.attachments || []).map(a => (
                  <div key={a.id} className="flex items-center justify-between border rounded p-2 text-sm">
                    <div className="truncate">
                      <div className="font-medium">{a.name || 'Attachment'}</div>
                      <div className="text-xs text-gray-500">{a.kind || 'file'} • {new Date(a.uploadedAt).toLocaleString()}</div>
                      <a href={a.url} target="_blank" className="text-blue-600 underline break-all">{a.url}</a>
                    </div>
                    <div>
                      <Button variant="outline" onClick={() => onRemoveAttachment(a.id)}>Remove</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
