"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'

type FormState = {
  name: string
  color: string
  quantity: number
  isFree: boolean
  price: number
  status: 'Open' | 'Closed'
  requiresApproval: boolean
  minBuyingLimit: number
  maxBuyingLimit: number
  salesStartDate: string
  salesStartNow: boolean
  salesStartTime: string
  salesEndDate: string
  salesEndAtEventEnd: boolean
  salesEndTime: string
  description: string
  groupId: string
  // Offer fields (UI only)
  offerName: string
  offerType: 'FIXED' | 'PERCENT'
  offerAmount: number
  offerStartDate: string
  offerStartTime: string
  offerEndsBasedOn: 'TIME' | 'QUANTITY'
  offerEndDate: string
  offerEndTime: string
  offerQtyLimit: number
  offerStatus: 'Open' | 'Closed'
}

export default function TicketClassPage({ params }: { params: { id: string } }) {
  const [showModal, setShowModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [groupNameInput, setGroupNameInput] = useState('')
  const [activeTab, setActiveTab] = useState<'General' | 'Offers'>('General')
  const searchParams = useSearchParams()
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([
    { id: 'g-1', name: 'VIP' },
    { id: 'g-2', name: 'General Admission' },
    { id: 'g-3', name: 'Early Bird' },
    { id: 'g-4', name: 'Student' },
    { id: 'g-5', name: 'Corporate' },
  ])
  const [tickets, setTickets] = useState<Array<{
    id: string
    groupId: string
    name: string
    price: number
    quantity: number
    sold: number
    status: 'Open' | 'Closed' | 'YetToStart'
    requiresApproval: boolean
    salesEndDate: string
  }>>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  const [eventDetails, setEventDetails] = useState<{ capacity: number, price: number } | null>(null)

  // Load tickets, groups and event details
  useEffect(() => {
    let aborted = false
    const load = async () => {
      try {
        const [resTickets, resEvent, resGroups] = await Promise.all([
          fetch(`/api/events/${params.id}/tickets`, { cache: 'no-store' }),
          fetch(`/api/events/${params.id}`, { cache: 'no-store' }),
          fetch(`/api/events/${params.id}/ticket-groups`, { cache: 'no-store' })
        ])

        if (resGroups.ok) {
          const data = await resGroups.json()
          if (!aborted && Array.isArray(data) && data.length > 0) {
            setGroups(data)
          }
        }

        if (resTickets.ok) {
          const data = await resTickets.json()
          if (!aborted) {
            const mapped = (Array.isArray(data) ? data : []).map((t: any) => ({
              id: String(t.id),
              groupId: String(t.groupId || 'g-1'),
              name: String(t.name || ''),
              price: typeof t.priceInMinor === 'number' ? Math.max(0, t.priceInMinor) / 100 : 0,
              quantity: Number(t.quantity || 0),
              sold: Number(t.sold || 0),
              status: (t.status as any) || 'Open',
              requiresApproval: !!t.requiresApproval,
              salesEndDate: t.salesEndAt ? String(t.salesEndAt).slice(0, 10) : ''
            }))
            setTickets(mapped)
          }
        }

        if (resEvent.ok) {
          const data = await resEvent.json()
          if (!aborted) {
            setEventDetails({
              capacity: Number(data.expectedAttendees || 0),
              price: Number(data.priceInr || 0)
            })
          }
        }
      } catch { }
    }
    load()
    return () => { aborted = true }
  }, [params.id])

  const deleteGroup = async (groupId: string) => {
    // Disallow deleting the last remaining group
    if (groups.length <= 1) {
      alert('At least one ticket group is required. Create another group before deleting this one.')
      return
    }

    // Check if tickets exist in this group
    const affected = tickets.filter(t => t.groupId === groupId).length
    if (affected > 0) {
      alert(`Cannot delete group that contains ${affected} tickets. Please move or delete the tickets first.`)
      return
    }

    const group = groups.find(g => g.id === groupId)
    const ok = window.confirm(
      `Delete group "${group?.name ?? ''}"? This action cannot be undone.`
    )
    if (!ok) return

    // If it's a temp/hardcoded group (starts with g-), just remove from state
    if (groupId.startsWith('g-')) {
      const remainingGroups = groups.filter(g => g.id !== groupId)
      setGroups(remainingGroups)
      if (form.groupId === groupId) {
        setForm(f => ({ ...f, groupId: remainingGroups[0]?.id ?? 'g-1' }))
      }
      return
    }

    try {
      const res = await fetch(`/api/events/${params.id}/ticket-groups/${groupId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to delete group')
      }

      // Remove group locally
      const remainingGroups = groups.filter(g => g.id !== groupId)
      setGroups(remainingGroups)

      // If current form selection points to deleted group, switch to first remaining
      if (form.groupId === groupId) {
        setForm(f => ({ ...f, groupId: remainingGroups[0]?.id ?? f.groupId }))
      }
    } catch (e: any) {
      alert(e.message)
    }
  }
  const makeInitialForm = (): FormState => ({
    name: '',
    color: '#ff5c8a',
    quantity: 25,
    isFree: true,
    price: 0,
    status: 'Open',
    requiresApproval: false,
    minBuyingLimit: 1,
    maxBuyingLimit: 10,
    salesStartDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    salesStartNow: false,
    salesStartTime: '00:00',
    salesEndDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    salesEndAtEventEnd: false,
    salesEndTime: '17:00',
    description: '',
    groupId: groups[0]?.id ?? 'g-1',
    // Offer defaults
    offerName: '',
    offerType: 'FIXED',
    offerAmount: 0,
    offerStartDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    offerStartTime: '00:00',
    offerEndsBasedOn: 'TIME',
    offerEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    offerEndTime: '00:00',
    offerQtyLimit: 0,
    offerStatus: 'Open'
  })

  const [form, setForm] = useState<FormState>(makeInitialForm())

  const nameCount = useMemo(() => `${form.name.length} / 50`, [form.name])
  const totalCapacity = useMemo(() => tickets.reduce((s, t) => s + t.quantity, 0), [tickets])
  const offerDiscount = useMemo(() => {
    const base = form.isFree ? 0 : Math.max(0, form.price)
    if (form.offerType === 'FIXED') return Math.max(0, Math.min(form.offerAmount || 0, base))
    // percent
    return Math.max(0, Math.min(base, ((form.offerAmount || 0) / 100) * base))
  }, [form.isFree, form.price, form.offerType, form.offerAmount])
  const offerPrice = useMemo(() => {
    const base = form.isFree ? 0 : Math.max(0, form.price)
    return Math.max(0, base - offerDiscount)
  }, [form.isFree, form.price, offerDiscount])

  const fmtInr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n)
  const fmtDate = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })
    } catch { return iso }
  }

  // Open drawer only when explicitly requested via URL (?new=1)
  useEffect(() => {
    if (searchParams?.get('new') === '1') {
      setShowModal(true)
    }
  }, [searchParams])

  const nameInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (showModal) {
      // Delay to ensure element is in DOM
      setTimeout(() => nameInputRef.current?.focus(), 0)
    }
  }, [showModal])

  const startEdit = (t: typeof tickets[0]) => {
    setEditingId(t.id)
    setForm(f => ({
      ...f,
      name: t.name,
      quantity: t.quantity,
      isFree: t.price === 0,
      price: t.price,
      status: t.status === 'YetToStart' ? 'Open' : t.status,
      requiresApproval: t.requiresApproval,
      salesEndDate: t.salesEndDate || f.salesEndDate,
      groupId: t.groupId,
    }))
    setShowModal(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Ticket Class</h1>
          <p className="text-sm text-slate-500">Event ID: {params.id}</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          onClick={() => setShowModal(true)}
        >
          + New Ticket Class
        </button>
      </div>

      {/* Header summary bar */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Ticket Class ({tickets.length})</div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-600">Event Capacity : <span className="font-semibold">{tickets.reduce((s, t) => s + t.sold, 0)} / {eventDetails?.capacity || 'UNLIMITED'}</span></div>
          <button className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700" onClick={() => { setGroupNameInput(''); setShowGroupModal(true) }}>+ Add Ticket Group</button>
        </div>
      </div>

      {/* Groups list */}
      {groups.map((g) => {
        const items = tickets.filter(t => t.groupId === g.id)
        return (
          <div key={g.id} className="mt-4">
            {/* Group header */}
            <div className="flex items-center justify-between text-sm">
              <div className="font-semibold">{g.name} ({items.length})</div>
              <div className="flex items-center gap-4">
                <button className="text-indigo-600 hover:underline">Edit Group</button>
                <button className="text-red-600 hover:underline" onClick={() => deleteGroup(g.id)}>Delete Group</button>
              </div>
            </div>
            {/* Table */}
            <div className="mt-2 rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-3 w-1/3">Name</th>
                    <th className="text-left px-4 py-3">Price</th>
                    <th className="text-left px-4 py-3">Sales</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">End Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr className="border-t">
                      <td colSpan={6} className="px-4 py-6 text-slate-500">No tickets in this group.</td>
                    </tr>
                  ) : items.map(t => (
                    <tr key={t.id} className="border-t">
                      <td className="px-4 py-4 align-top">
                        <div className="font-medium">{t.name}</div>
                        {t.requiresApproval && (
                          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-700 text-[11px] px-2 py-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-slate-700"></span>
                            Approval required
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top">{fmtInr(t.price)}</td>
                      <td className="px-4 py-4 align-top">{t.sold}/{t.quantity}</td>
                      <td className="px-4 py-4 align-top">
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-700 text-[11px] px-2 py-1">
                          <span className="inline-block h-2 w-2 rounded-full bg-slate-700"></span>
                          {t.status === 'YetToStart' ? 'Yet to Start' : t.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">{fmtDate(t.salesEndDate)}</td>
                      <td className="px-4 py-4 text-right align-top space-x-2">
                        <button
                          className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
                          onClick={() => startEdit(t)}
                        >Edit</button>
                        <button
                          className="rounded-md border px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                          onClick={async () => {
                            const ok = window.confirm(`Delete ticket "${t.name}"?`)
                            if (!ok) return
                            try {
                              const res = await fetch(`/api/events/${params.id}/tickets/${t.id}`, { method: 'DELETE' })
                              if (!res.ok) throw new Error('Failed to delete ticket')
                              setTickets(prev => prev.filter(x => x.id !== t.id))
                            } catch (e) {
                              alert((e as any)?.message || 'Failed to delete ticket')
                            }
                          }}
                        >Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="ml-auto flex h-full w-full max-w-[720px] flex-col bg-white shadow-xl border-l">
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b px-6 py-4 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">{editingId ? 'Edit Ticket Class' : 'Add Ticket Class'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-500 hover:text-slate-700" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer scrollable content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium">Ticket Name <span className="text-red-500">*</span></label>
                  <div className="mt-1 relative">
                    <input
                      ref={nameInputRef}
                      value={form.name}
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value.slice(0, 50) }))}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      placeholder="Name your ticket"
                    />
                    <div className="absolute right-3 top-1.5 text-xs text-slate-400">{nameCount}</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium">Color <span className="text-slate-400 text-xs align-middle">i</span></label>
                  <div className="mt-1 flex items-center gap-3">
                    <input type="color" value={form.color} onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))} className="h-9 w-16 rounded-md border p-1" />
                    <div className="h-8 w-20 rounded-md border" style={{ background: form.color }}></div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium">Group</label>
                  <select
                    value={form.groupId}
                    onChange={(e) => setForm(f => ({ ...f, groupId: e.target.value }))}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Quantity <span className="text-red-500">*</span></label>
                  <input type="number" value={form.quantity} onChange={(e) => setForm(f => ({ ...f, quantity: Math.max(0, parseInt(e.target.value) || 0) }))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium">Price <span className="text-slate-400 text-xs align-middle">i</span></label>
                  <div className="mt-1 flex items-center gap-4">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        checked={!form.isFree}
                        onChange={() => setForm(f => ({
                          ...f,
                          isFree: false,
                          price: f.price || (eventDetails?.price || 0)
                        }))}
                      />
                      <span className="text-sm">Paid</span>
                    </label>
                    <div className={`flex items-center gap-2 ${form.isFree ? 'opacity-50 pointer-events-none' : ''}`}>
                      <span className="text-sm">₹</span>
                      <input type="number" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: Math.max(0, parseFloat(e.target.value) || 0) }))} className="w-40 rounded-md border px-3 py-2 text-sm" />
                    </div>
                    <label className="ml-4 inline-flex items-center gap-2">
                      <input type="radio" checked={form.isFree} onChange={() => setForm(f => ({ ...f, isFree: true, price: 0 }))} />
                      <span className="text-sm">Free</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-6 border-b">
                <div className="flex gap-6 text-sm">
                  {(['General', 'Offers'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2 -mb-px border-b-2 ${activeTab === tab ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{tab}</button>
                  ))}
                </div>
              </div>

              {activeTab === 'General' && (
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium">Status</label>
                    <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value as FormState['status'] }))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm max-w-xs">
                      <option value="Open">Open</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">Registration approval</div>
                        <p className="text-xs text-slate-500 mt-1">You can pre-screen order requests and manually approve or deny them before issuing tickets.</p>
                      </div>
                      <label className="inline-flex cursor-pointer items-center">
                        <input type="checkbox" className="sr-only" checked={form.requiresApproval} onChange={(e) => setForm(f => ({ ...f, requiresApproval: e.target.checked }))} />
                        <span className={`h-6 w-10 rounded-full transition-colors ${form.requiresApproval ? 'bg-indigo-600' : 'bg-slate-300'} relative`}>
                          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${form.requiresApproval ? 'translate-x-4' : ''}`}></span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium">Minimum Buying Limit <span className="text-red-500">*</span></label>
                      <input type="number" value={form.minBuyingLimit} onChange={(e) => setForm(f => ({ ...f, minBuyingLimit: Math.max(1, parseInt(e.target.value) || 1) }))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Maximum Buying Limit <span className="text-red-500">*</span></label>
                      <input type="number" value={form.maxBuyingLimit} onChange={(e) => setForm(f => ({ ...f, maxBuyingLimit: Math.max(form.minBuyingLimit, parseInt(e.target.value) || form.minBuyingLimit) }))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium">Sales Start Date</label>
                      <input type="date" value={form.salesStartDate} onChange={(e) => setForm(f => ({ ...f, salesStartDate: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
                      <label className="mt-2 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.salesStartNow} onChange={(e) => setForm(f => ({ ...f, salesStartNow: e.target.checked }))} /> Now</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Time</label>
                      <input type="time" value={form.salesStartTime} onChange={(e) => setForm(f => ({ ...f, salesStartTime: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm max-w-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium">Sales End Date</label>
                      <input type="date" value={form.salesEndDate} onChange={(e) => setForm(f => ({ ...f, salesEndDate: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
                      <label className="mt-2 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.salesEndAtEventEnd} onChange={(e) => setForm(f => ({ ...f, salesEndAtEventEnd: e.target.checked }))} /> Event End Date</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Time</label>
                      <input type="time" value={form.salesEndTime} onChange={(e) => setForm(f => ({ ...f, salesEndTime: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm max-w-xs" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Description</label>
                    <div className="mt-1">
                      <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value.slice(0, 1000) }))} rows={6} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Write a short description (max 1000 chars)" />
                      <div className="text-right text-xs text-slate-400">{form.description.length}/1000</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Offers' && (
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium">Offer Name <span className="text-red-500">*</span> <span className="text-slate-400 text-xs align-middle">i</span></label>
                    <input
                      value={form.offerName}
                      onChange={(e) => setForm(f => ({ ...f, offerName: e.target.value }))}
                      className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                      placeholder="Early bird"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium">Offer Amount <span className="text-red-500">*</span></label>
                      <div className="mt-1 flex items-center gap-3">
                        <select
                          value={form.offerType}
                          onChange={(e) => setForm(f => ({ ...f, offerType: e.target.value as FormState['offerType'] }))}
                          className="rounded-md border bg-white px-3 py-2 text-sm"
                        >
                          <option value="FIXED">Fixed (₹)</option>
                          <option value="PERCENT">Percentage (%)</option>
                        </select>
                        <input
                          type="number"
                          value={form.offerAmount}
                          onChange={(e) => setForm(f => ({ ...f, offerAmount: Math.max(0, parseFloat(e.target.value) || 0) }))}
                          className="w-40 rounded-md border px-3 py-2 text-sm"
                          placeholder={form.offerType === 'PERCENT' ? '0-100' : 'amount'}
                        />
                        <div className="ml-auto text-sm">
                          <span className="text-slate-500 mr-1">Discount :</span>
                          <span className="text-red-600">- {fmtInr(offerDiscount)}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="text-slate-500 mr-1">Offer Price :</span>
                        <span className="text-emerald-600 font-semibold">{fmtInr(offerPrice)}</span>
                        {!form.isFree && form.price > 0 && (
                          <span className="ml-2 text-slate-400 line-through">{fmtInr(form.price)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium">Start Date</label>
                      <input type="date" value={form.offerStartDate} onChange={(e) => setForm(f => ({ ...f, offerStartDate: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Time</label>
                      <input type="time" value={form.offerStartTime} onChange={(e) => setForm(f => ({ ...f, offerStartTime: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm max-w-xs" />
                    </div>
                  </div>

                  <div>
                    <div className="rounded-md border-2 border-dashed p-3">
                      <div className="flex items-center gap-6 text-sm">
                        <label className="inline-flex items-center gap-2">
                          <input type="radio" checked={form.offerEndsBasedOn === 'TIME'} onChange={() => setForm(f => ({ ...f, offerEndsBasedOn: 'TIME' }))} />
                          Date & time
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input type="radio" checked={form.offerEndsBasedOn === 'QUANTITY'} onChange={() => setForm(f => ({ ...f, offerEndsBasedOn: 'QUANTITY' }))} />
                          Ticket quantity
                        </label>
                      </div>
                      {form.offerEndsBasedOn === 'TIME' ? (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium">End Date</label>
                            <input type="date" value={form.offerEndDate} onChange={(e) => setForm(f => ({ ...f, offerEndDate: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium">Time</label>
                            <input type="time" value={form.offerEndTime} onChange={(e) => setForm(f => ({ ...f, offerEndTime: e.target.value }))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm max-w-xs" />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4">
                          <label className="block text-sm font-medium">Quantity Limit</label>
                          <input type="number" value={form.offerQtyLimit} onChange={(e) => setForm(f => ({ ...f, offerQtyLimit: Math.max(0, parseInt(e.target.value) || 0) }))} className="mt-1 w-60 rounded-md border px-3 py-2 text-sm" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Offer Status <span className="text-red-500">*</span></label>
                    <select value={form.offerStatus} onChange={(e) => setForm(f => ({ ...f, offerStatus: e.target.value as FormState['offerStatus'] }))} className="mt-1 w-full rounded-md border px-3 py-2 text-sm max-w-xs">
                      <option value="Open">Open</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button type="button" onClick={() => setActiveTab('General')} className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50">Back</button>
                    <button type="button" onClick={() => setActiveTab('General')} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Done</button>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer footer */}
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4 sticky bottom-0 bg-white z-10">
              <button onClick={() => { setForm(makeInitialForm()); setEditingId(null); }} className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={() => { setShowModal(false); setEditingId(null); }} className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50">Close</button>
              <button
                onClick={async () => {
                  if (!form.name.trim()) { setShowModal(false); return }

                  // Validate capacity
                  if (eventDetails) {
                    const allocated = tickets.reduce((sum, t) => t.id === editingId ? sum : sum + t.quantity, 0)
                    if (allocated + form.quantity > eventDetails.capacity) {
                      alert(`Total tickets (${allocated + form.quantity}) exceeds event capacity (${eventDetails.capacity}). Remaining: ${Math.max(0, eventDetails.capacity - allocated)}`)
                      return
                    }
                  }

                  try {
                    // Compose sales times
                    const toIso = (d: string, t: string) => {
                      try { return new Date(`${d}T${t || '00:00'}`).toISOString() } catch { return null }
                    }
                    const salesStartAt = form.salesStartNow ? new Date().toISOString() : toIso(form.salesStartDate, form.salesStartTime)
                    const salesEndAt = form.salesEndAtEventEnd ? null : toIso(form.salesEndDate, form.salesEndTime)

                    // Build DTO aligning with backend expectations
                    const dto: any = {
                      name: form.name.trim(),
                      free: !!form.isFree,
                      priceInMinor: form.isFree ? 0 : Math.round(Math.max(0, form.price) * 100),
                      currency: 'INR',
                      quantity: Math.max(0, form.quantity),
                      requiresApproval: !!form.requiresApproval,
                      status: form.status,
                      salesStartAt: salesStartAt,
                      salesEndAt: salesEndAt,
                    }
                    // Omit placeholder group id like 'g-1'
                    if (form.groupId && !form.groupId.startsWith('g-')) {
                      dto.groupId = form.groupId
                    }

                    let t: any
                    if (editingId) {
                      const res = await fetch(`/api/events/${params.id}/tickets/${editingId}`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto)
                      })
                      if (!res.ok) {
                        const text = await res.text(); let msg = 'Failed to update ticket';
                        try { const j = JSON.parse(text); msg = j?.message || msg } catch { }
                        throw new Error(msg)
                      }
                      t = await res.json()
                      const updated = {
                        id: String(t.id),
                        groupId: String(t.groupId || form.groupId),
                        name: String(t.name || form.name.trim()),
                        price: typeof t.priceInMinor === 'number' ? Math.max(0, t.priceInMinor) / 100 : (form.isFree ? 0 : form.price),
                        quantity: Number(t.quantity ?? form.quantity),
                        sold: Number(t.sold ?? 0),
                        status: (t.status as any) || 'YetToStart',
                        requiresApproval: !!(t.requiresApproval ?? form.requiresApproval),
                        salesEndDate: t.salesEndAt ? String(t.salesEndAt).slice(0, 10) : form.salesEndDate,
                      }
                      setTickets(prev => prev.map(x => x.id === updated.id ? updated : x))
                    } else {
                      const res = await fetch(`/api/events/${params.id}/tickets`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto)
                      })
                      if (!res.ok) {
                        const text = await res.text(); let msg = 'Failed to save ticket';
                        try { const j = JSON.parse(text); msg = j?.message || msg } catch { }
                        throw new Error(msg)
                      }
                      t = await res.json()
                      const newItem = {
                        id: String(t.id),
                        groupId: String(t.groupId || form.groupId),
                        name: String(t.name || form.name.trim()),
                        price: typeof t.priceInMinor === 'number' ? Math.max(0, t.priceInMinor) / 100 : (form.isFree ? 0 : form.price),
                        quantity: Number(t.quantity ?? form.quantity),
                        sold: Number(t.sold ?? 0),
                        status: (t.status as any) || 'YetToStart',
                        requiresApproval: !!(t.requiresApproval ?? form.requiresApproval),
                        salesEndDate: t.salesEndAt ? String(t.salesEndAt).slice(0, 10) : form.salesEndDate,
                      }
                      setTickets(prev => [...prev, newItem])
                    }
                  } catch (e) {
                    alert((e as any)?.message || 'Failed to save ticket')
                  } finally {
                    setEditingId(null)
                    setShowModal(false)
                  }
                }}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold">Add Ticket Group</h3>
              <button onClick={() => setShowGroupModal(false)} className="p-1 text-slate-500 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium">Group Name <span className="text-red-500">*</span></label>
                <input value={groupNameInput} onChange={(e) => setGroupNameInput(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Enter group name" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <button onClick={() => setShowGroupModal(false)} className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50">Close</button>
              <button
                onClick={async () => {
                  const name = groupNameInput.trim()
                  if (!name) { setShowGroupModal(false); return }

                  try {
                    const res = await fetch(`/api/events/${params.id}/ticket-groups`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name })
                    })

                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}))
                      throw new Error(err.message || 'Failed to create group')
                    }

                    const newGroup = await res.json()
                    setGroups(prev => [...prev, newGroup])
                    // If ticket modal is open, default selection to the newly added group
                    setForm(f => ({ ...f, groupId: newGroup.id }))
                    setShowGroupModal(false)
                    setGroupNameInput('')
                  } catch (e: any) {
                    alert(e.message)
                  }
                }}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
