
'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Building2, Globe, Mail, Phone, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Vendor {
    id: string
    name: string
    eventId: string
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    website?: string
    companyDescription?: string
    boothOption?: string
    tenantId?: string
}

interface Event {
    id: string
    name: string
}

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        fetchVendors()
    }, [])

    const fetchVendors = async () => {
        try {
            const res = await fetch('/api/company/vendors')
            if (res.ok) {
                const data = await res.json()
                setVendors(Array.isArray(data.vendors) ? data.vendors : [])
                setEvents(Array.isArray(data.events) ? data.events : [])
            }
        } catch (error) {
            console.error('Failed to load vendors')
        } finally {
            setLoading(false)
        }
    }

    const addNewVendor = async (vendorData: any) => {
        try {
            const res = await fetch('/api/company/vendors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vendorData)
            })
            if (res.ok) {
                fetchVendors()
                setShowModal(false)
            } else {
                alert('Failed to add vendor')
            }
        } catch (e) {
            alert('Error saving vendor')
        }
    }

    const filteredVendors = vendors.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.contactEmail?.toLowerCase().includes(search.toLowerCase())
    )

    const getEventName = (id: string) => {
        const ev = events.find(e => String(e.id) === String(id))
        return ev ? ev.name : 'Unknown Event'
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading vendors...</div>
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
                    <p className="text-sm text-gray-500">Manage your event exhibitors and partners</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Add Vendor
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search vendors..."
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4 text-left">Vendor Details</th>
                                <th className="px-6 py-4 text-left">Event</th>
                                <th className="px-6 py-4 text-left">Contact</th>
                                <th className="px-6 py-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredVendors.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        No vendors found. Add one to get started.
                                    </td>
                                </tr>
                            ) : (
                                filteredVendors.map(vendor => (
                                    <tr key={vendor.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg">
                                                    {vendor.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{vendor.name}</div>
                                                    {vendor.website && (
                                                        <a href={vendor.website} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                            {vendor.website.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                {getEventName(vendor.eventId)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 space-y-1">
                                            {vendor.contactName && <div className="font-medium text-gray-900">{vendor.contactName}</div>}
                                            {vendor.contactEmail && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Mail className="w-3 h-3" /> {vendor.contactEmail}
                                                </div>
                                            )}
                                            {vendor.contactPhone && (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Phone className="w-3 h-3" /> {vendor.contactPhone}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-gray-400 hover:text-gray-600 text-sm font-medium">Edit</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-semibold text-lg">Add New Vendor</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <AddVendorForm
                            events={events}
                            onSubmit={addNewVendor}
                            onCancel={() => setShowModal(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

function AddVendorForm({ events, onSubmit, onCancel }: { events: Event[], onSubmit: (data: any) => void, onCancel: () => void }) {
    const [formData, setFormData] = useState({
        name: '',
        eventId: events[0]?.id || '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        website: '',
        companyDescription: ''
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Associate with Event</label>
                <select
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                    value={formData.eventId}
                    onChange={e => setFormData({ ...formData, eventId: e.target.value })}
                >
                    <option value="">Select an Event</option>
                    {events.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.name} (ID: {ev.id})</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Vendors are currently specific to an event.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                    placeholder="ACME Corporation"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        value={formData.contactName}
                        onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                        type="url"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        placeholder="https://"
                        value={formData.website}
                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        value={formData.contactEmail}
                        onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                        type="tel"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                        value={formData.contactPhone}
                        onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                    />
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                    Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800">
                    Create Vendor
                </button>
            </div>
        </form>
    )
}
