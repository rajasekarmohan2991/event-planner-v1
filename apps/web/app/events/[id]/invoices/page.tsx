'use client'

import React, { useState, useEffect } from 'react'
import {
    FileText,
    Download,
    Search,
    Filter,
    RefreshCcw,
    AlertCircle,
    CheckCircle2,
    Clock,
    Printer,
    Mail
} from 'lucide-react'
import { useParams } from 'next/navigation'

interface Invoice {
    id: string
    entityId: string
    number: string
    name: string
    type: 'EXHIBITOR' | 'SPONSOR' | 'VENDOR'
    amount: number
    status: string
    date: string
    paidAt?: string
    dueDate?: string
}

export default function InvoicesPage() {
    const params = useParams()
    const eventId = params.id as string

    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('ALL') // ALL, EXHIBITOR, SPONSOR, VENDOR
    const [statusFilter, setStatusFilter] = useState('ALL') // ALL, PAID, PENDING
    const [searchQuery, setSearchQuery] = useState('')

    const fetchInvoices = async () => {
        setLoading(true)
        try {
            // Build query params
            const queryParams = new URLSearchParams()
            if (activeTab !== 'ALL') queryParams.append('type', activeTab)
            if (statusFilter !== 'ALL') queryParams.append('status', statusFilter)

            const res = await fetch(`/api/events/${eventId}/invoices?${queryParams.toString()}`)
            if (!res.ok) throw new Error('Failed to fetch')

            const data = await res.json()
            setInvoices(data.data || [])
        } catch (error) {
            console.error(error)
            // toast.error('Failed to load invoices')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInvoices()
    }, [eventId, activeTab, statusFilter])

    // Filter in memory for search query (simple search)
    const filteredInvoices = invoices.filter(inv =>
        inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.number.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Stats
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)
    const receivedAmount = invoices
        .filter(inv => inv.status === 'PAID')
        .reduce((sum, inv) => sum + inv.amount, 0)
    const pendingAmount = totalAmount - receivedAmount

    const downloadInvoice = (inv: Invoice) => {
        let url = ''
        switch (inv.type) {
            case 'EXHIBITOR':
                url = `/api/events/${eventId}/exhibitors/${inv.entityId}/download-invoice`
                break
            case 'SPONSOR':
                url = `/api/events/${eventId}/sponsors/${inv.entityId}/download-invoice`
                break
            case 'VENDOR':
                url = `/api/events/${eventId}/vendors/${inv.entityId}/download-invoice`
                break
        }
        if (url) window.open(url, '_blank')
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Financial Documents</h1>
                    <p className="text-gray-500 mt-2">Manage invoices, receipts, and payments for all stakeholders.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchInvoices}
                        className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Invoiced</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{totalAmount.toLocaleString()}</h3>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-indigo-50 to-transparent pointer-events-none" />
                    <FileText className="absolute right-6 top-6 w-8 h-8 text-indigo-100" />
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Payment Received</p>
                        <h3 className="text-2xl font-bold text-emerald-600 mt-1">₹{receivedAmount.toLocaleString()}</h3>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-emerald-50 to-transparent pointer-events-none" />
                    <CheckCircle2 className="absolute right-6 top-6 w-8 h-8 text-emerald-100" />
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending / Due</p>
                        <h3 className="text-2xl font-bold text-amber-600 mt-1">₹{pendingAmount.toLocaleString()}</h3>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-amber-50 to-transparent pointer-events-none" />
                    <Clock className="absolute right-6 top-6 w-8 h-8 text-amber-100" />
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">

                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['ALL', 'EXHIBITOR', 'SPONSOR', 'VENDOR'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === tab
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.charAt(0) + tab.slice(1).toLowerCase() + (tab === 'ALL' ? '' : 's')}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                            >
                                <option value="ALL">All Status</option>
                                <option value="PAID">Paid</option>
                                <option value="PENDING">Pending</option>
                            </select>
                            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Search */}
                        <div className="relative flex-1 sm:w-64">
                            <input
                                type="text"
                                placeholder="Search invoices..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Document</th>
                                <th className="px-6 py-4">Payee</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-gray-700">
                            {loading ? (
                                // Loading Skeleton
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-20 mx-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-8 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="w-12 h-12 text-gray-300 mb-3" />
                                            <p className="text-lg font-medium">No invoices found</p>
                                            <p className="text-sm">Try adjusting your filters or search query.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {inv.number}
                                        </td>
                                        <td className="px-6 py-4">
                                            {inv.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide
                        ${inv.type === 'EXHIBITOR' ? 'bg-blue-100 text-blue-800' :
                                                    inv.type === 'SPONSOR' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-orange-100 text-orange-800'}
                      `}>
                                                {inv.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(inv.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold">
                                            ₹{inv.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {inv.status === 'PAID' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Paid
                                                </span>
                                            ) : inv.status === 'OVERDUE' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                    Overdue
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* Download Button */}
                                                <button
                                                    onClick={() => downloadInvoice(inv)}
                                                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors group"
                                                    title={inv.status === 'PAID' ? "Download Receipt" : "Download Invoice"}
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>

                                                {/* Email Button (Mock) */}
                                                <button
                                                    onClick={() => alert('Email functionality coming in next update')}
                                                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Email Document"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer info */}
                <div className="p-4 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
                    <span>Showing {filteredInvoices.length} records</span>
                    <span>Generated invoices are valid for checking purposes</span>
                </div>
            </div>
        </div>
    )
}
