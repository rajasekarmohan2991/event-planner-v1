'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus, X, FileText, FileCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import ManageTabs from '@/components/events/ManageTabs'


const CATEGORIES = ['CATERING', 'VENUE', 'PHOTOGRAPHY', 'ENTERTAINMENT', 'DECORATION', 'OTHER'] as const

interface Vendor {
    id?: string
    name: string
    category: string
    status: 'BOOKED' | 'ACTIVE' | 'CANCELLED'
    contractAmount: number
    paidAmount?: number
    isTemporary?: boolean
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    contractUrl?: string
    invoiceUrl?: string
}

interface Budget {
    category: string
    budgeted: number
    spent: number
    remaining: number
    vendors: Vendor[]
}

export default function EventVendorsPage() {
    const params = useParams()
    const eventId = params?.id as string

    const [budgets, setBudgets] = useState<Budget[]>([])
    const [tempVendors, setTempVendors] = useState<Vendor[]>([])
    const [isAddingVendor, setIsAddingVendor] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>('')
    const [loading, setLoading] = useState(false)

    const [vendorForm, setVendorForm] = useState({
        name: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        contractAmount: 0,
        paidAmount: 0,
        paymentStatus: 'PENDING',
        paymentDueDate: '',
        status: 'ACTIVE',
        notes: '',
        requirements: ''
    })

    const [contractFile, setContractFile] = useState<File | null>(null)
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null)

    // Fetch budgets and vendors
    useEffect(() => {
        if (eventId) {
            fetchBudgetsAndVendors()
        }
    }, [eventId])

    const fetchBudgetsAndVendors = async () => {
        try {
            setLoading(true)

            // Fetch vendors
            const vendorRes = await fetch(`/api/events/${eventId}/vendors`)
            const vendorData = await vendorRes.json()

            // Create budgets for each category
            const categoryBudgets: Budget[] = CATEGORIES.map(category => {
                const categoryVendors = (vendorData.vendors || []).filter(
                    (v: Vendor) => v.category === category && v.status !== 'CANCELLED'
                )

                const spent = categoryVendors.reduce((sum: number, v: Vendor) =>
                    sum + Number(v.contractAmount || 0), 0
                )

                return {
                    category,
                    budgeted: 100000, // Default budget, can be customized
                    spent,
                    remaining: 100000 - spent,
                    vendors: categoryVendors
                }
            })

            setBudgets(categoryBudgets)
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Handle vendor name change - show as BOOKED
    const handleVendorNameChange = (name: string) => {
        setVendorForm(prev => ({ ...prev, name }))

        if (name.trim() && selectedCategory) {
            const existingIndex = tempVendors.findIndex(
                v => v.category === selectedCategory && v.isTemporary
            )

            if (existingIndex >= 0) {
                setTempVendors(prev => prev.map((v, i) =>
                    i === existingIndex ? { ...v, name } : v
                ))
            } else {
                setTempVendors(prev => [...prev, {
                    name,
                    category: selectedCategory,
                    status: 'BOOKED',
                    contractAmount: 0,
                    isTemporary: true
                }])
            }
        }
    }

    // Cancel temp vendor
    const handleCancelTempVendor = (vendor: Vendor) => {
        setTempVendors(prev => prev.filter(v => v !== vendor))

        if (vendorForm.name === vendor.name && selectedCategory === vendor.category) {
            setVendorForm({
                name: '',
                contactName: '',
                contactEmail: '',
                contactPhone: '',
                contractAmount: 0,
                paidAmount: 0,
                paymentStatus: 'PENDING',
                paymentDueDate: '',
                status: 'ACTIVE',
                notes: '',
                requirements: ''
            })
        }
    }

    // Save vendor
    const handleSaveVendor = async () => {
        try {
            setLoading(true)

            let contractUrl = '';
            let invoiceUrl = '';

            // Upload files via API (Bypasses RLS)
            if (contractFile) {
                const formData = new FormData()
                formData.append('file', contractFile)
                const res = await fetch('/api/uploads', { method: 'POST', body: formData })
                if (res.ok) {
                    const data = await res.json()
                    contractUrl = data.url
                } else {
                    console.error('Contract upload failed')
                }
            }

            if (invoiceFile) {
                const formData = new FormData()
                formData.append('file', invoiceFile)
                const res = await fetch('/api/uploads', { method: 'POST', body: formData })
                if (res.ok) {
                    const data = await res.json()
                    invoiceUrl = data.url
                } else {
                    console.error('Invoice upload failed')
                }
            }

            const response = await fetch(`/api/events/${eventId}/vendors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: vendorForm.name,
                    category: selectedCategory,
                    contactName: vendorForm.contactName,
                    contactEmail: vendorForm.contactEmail,
                    contactPhone: vendorForm.contactPhone,
                    contractAmount: vendorForm.contractAmount,
                    paidAmount: vendorForm.paidAmount,
                    paymentStatus: vendorForm.paymentStatus,
                    paymentDueDate: vendorForm.paymentDueDate || null,
                    status: vendorForm.status,
                    contractUrl,
                    invoiceUrl,
                    notes: `${vendorForm.notes || ''}${vendorForm.requirements ? '\n\nRequirements:\n' + vendorForm.requirements : ''}`
                })
            })

            if (response.ok) {
                // Clear temp vendors for this category
                setTempVendors(prev => prev.filter(v => v.category !== selectedCategory))

                // Reset form
                setVendorForm({
                    name: '',
                    contactName: '',
                    contactEmail: '',
                    contactPhone: '',
                    contractAmount: 0,
                    paidAmount: 0,
                    paymentStatus: 'PENDING',
                    paymentDueDate: '',
                    status: 'ACTIVE',
                    notes: '',
                    requirements: ''
                })
                setContractFile(null)
                setInvoiceFile(null)
                setSelectedCategory('')
                setIsAddingVendor(false)

                // Refresh data
                await fetchBudgetsAndVendors()

                alert('Vendor added successfully!')
            } else {
                const error = await response.json()
                alert(`Failed to save vendor: ${error.message || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Failed to save vendor:', error)
            alert('Failed to save vendor')
        } finally {
            setLoading(false)
        }
    }

    // Budget Card Component
    const BudgetCard = ({ budget }: { budget: Budget }) => {
        const allVendors = [
            ...budget.vendors,
            ...tempVendors.filter(v => v.category === budget.category)
        ]

        return (
            <Card className="bg-white">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">{budget.category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="space-y-1 text-sm">
                        <p>Budget: <span className="font-medium">₹{budget.budgeted.toLocaleString()}</span></p>
                        <p>Spent: <span className="font-medium">₹{budget.spent.toLocaleString()}</span></p>
                        <p className="text-green-600 font-semibold">
                            Remaining: ₹{budget.remaining.toLocaleString()}
                        </p>
                    </div>

                    {allVendors.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <p className="text-xs font-semibold text-gray-600">Vendors:</p>
                            {allVendors.map((vendor, index) => (
                                <div
                                    key={vendor.id || `temp-${index}`}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{vendor.name}</p>
                                        {vendor.contractAmount > 0 && (
                                            <p className="text-xs text-gray-500">
                                                ₹{vendor.contractAmount.toLocaleString()}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 ml-2">
                                        {vendor.contractUrl && (
                                            <a href={vendor.contractUrl} target="_blank" rel="noopener noreferrer" title="View Contract" className="text-blue-600 hover:text-blue-800">
                                                <FileText className="h-4 w-4" />
                                            </a>
                                        )}
                                        {vendor.invoiceUrl && (
                                            <a href={vendor.invoiceUrl} target="_blank" rel="noopener noreferrer" title="View Invoice" className="text-green-600 hover:text-green-800">
                                                <FileCheck className="h-4 w-4" />
                                            </a>
                                        )}
                                        <Badge
                                            variant={
                                                vendor.status === 'BOOKED' ? 'secondary' :
                                                    vendor.status === 'ACTIVE' ? 'default' :
                                                        'destructive'
                                            }
                                            className={
                                                vendor.status === 'BOOKED' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                                                    vendor.status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                                        ''
                                            }
                                        >
                                            {vendor.status}
                                        </Badge>

                                        {vendor.isTemporary ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCancelTempVendor(vendor)}
                                                className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={async () => {
                                                    if (confirm(`Delete vendor "${vendor.name}"?`)) {
                                                        try {
                                                            const res = await fetch(`/api/events/${eventId}/vendors/${vendor.id}`, { method: 'DELETE' })
                                                            if (res.ok) {
                                                                await fetchBudgetsAndVendors()
                                                                alert('Vendor deleted successfully')
                                                            } else {
                                                                alert('Failed to delete vendor')
                                                            }
                                                        } catch (error) {
                                                            console.error('Delete failed:', error)
                                                            alert('Failed to delete vendor')
                                                        }
                                                    }
                                                }}
                                                className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    if (loading && budgets.length === 0) {
        return (
            <div className="space-y-6">
                <ManageTabs eventId={eventId} />
                <div className="p-6">Loading...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <ManageTabs eventId={eventId} />

            {/* Header Section with explicit spacing and z-index */}
            <div className="relative z-10 flex flex-wrap justify-between items-center gap-4 mt-6 mb-6">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">Budgets & Vendors</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage event vendors and track expenses</p>
                </div>
                <Button onClick={() => setIsAddingVendor(true)} className="shadow-md hover:shadow-lg transition-all">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vendor
                </Button>
            </div>

            {/* Budget Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {budgets.map((budget) => (
                    <BudgetCard key={budget.category} budget={budget} />
                ))}
            </div>

            {/* Add Vendor Dialog */}
            <Dialog open={isAddingVendor} onOpenChange={setIsAddingVendor}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col" aria-describedby={undefined}>
                    <DialogHeader>
                        <DialogTitle>Add Vendor</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4 overflow-y-auto flex-1">
                        {/* Category Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Select value={selectedCategory || ''} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Vendor Name - This triggers BOOKED status */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Vendor Name *</Label>
                            <Input
                                id="name"
                                value={vendorForm.name}
                                onChange={(e) => handleVendorNameChange(e.target.value)}
                                placeholder="Enter vendor name"
                                disabled={!selectedCategory}
                            />
                            {!selectedCategory && (
                                <p className="text-xs text-gray-500">Select a category first</p>
                            )}
                        </div>

                        {/* Contact Details */}
                        <div className="space-y-2">
                            <Label htmlFor="contactName">Contact Name</Label>
                            <Input
                                id="contactName"
                                value={vendorForm.contactName}
                                onChange={(e) => setVendorForm(prev => ({ ...prev, contactName: e.target.value }))}
                                placeholder="Contact person name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contactEmail">Contact Email</Label>
                            <Input
                                id="contactEmail"
                                type="email"
                                value={vendorForm.contactEmail}
                                onChange={(e) => setVendorForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                                placeholder="email@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contactPhone">Contact Phone</Label>
                            <Input
                                id="contactPhone"
                                value={vendorForm.contactPhone}
                                onChange={(e) => setVendorForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                                placeholder="+1234567890"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contractAmount">Contract Amount *</Label>
                            <Input
                                id="contractAmount"
                                type="number"
                                value={vendorForm.contractAmount}
                                onChange={(e) => setVendorForm(prev => ({ ...prev, contractAmount: Number(e.target.value) }))}
                                placeholder="0"
                            />
                        </div>

                        {/* Payment Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="paidAmount">Paid Amount</Label>
                                <Input
                                    id="paidAmount"
                                    type="number"
                                    value={vendorForm.paidAmount}
                                    onChange={(e) => setVendorForm(prev => ({ ...prev, paidAmount: Number(e.target.value) }))}
                                    placeholder="0"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="paymentStatus">Payment Status</Label>
                                <Select value={vendorForm.paymentStatus || 'PENDING'} onValueChange={(value) => setVendorForm(prev => ({ ...prev, paymentStatus: value }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PENDING">Pending</SelectItem>
                                        <SelectItem value="PARTIAL">Partial</SelectItem>
                                        <SelectItem value="PAID">Paid</SelectItem>
                                        <SelectItem value="OVERDUE">Overdue</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="paymentDueDate">Payment Due Date</Label>
                            <Input
                                id="paymentDueDate"
                                type="date"
                                value={vendorForm.paymentDueDate}
                                onChange={(e) => setVendorForm(prev => ({ ...prev, paymentDueDate: e.target.value }))}
                            />
                        </div>

                        {/* File Uploads */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contractFile">Contract File</Label>
                                <Input
                                    id="contractFile"
                                    type="file"
                                    onChange={(e) => setContractFile(e.target.files?.[0] || null)}
                                />
                                {contractFile && <p className="text-xs text-green-600">Selected: {contractFile.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invoiceFile">Invoice File</Label>
                                <Input
                                    id="invoiceFile"
                                    type="file"
                                    onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                                />
                                {invoiceFile && <p className="text-xs text-green-600">Selected: {invoiceFile.name}</p>}
                            </div>
                        </div>

                        {/* Vendor Status */}
                        <div className="space-y-2">
                            <Label htmlFor="status">Vendor Status</Label>
                            <Select value={vendorForm.status || 'ACTIVE'} onValueChange={(value) => setVendorForm(prev => ({ ...prev, status: value }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Requirements/What customer asked */}
                        <div className="space-y-2">
                            <Label htmlFor="requirements">Requirements / What Customer Asked</Label>
                            <textarea
                                id="requirements"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={vendorForm.requirements}
                                onChange={(e) => setVendorForm(prev => ({ ...prev, requirements: e.target.value }))}
                                placeholder="Describe what the customer has asked the vendor to do..."
                            />
                        </div>

                        {/* Additional Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Additional Notes</Label>
                            <textarea
                                id="notes"
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={vendorForm.notes}
                                onChange={(e) => setVendorForm(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Any additional notes or comments..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAddingVendor(false)
                                const tempVendor = tempVendors.find(v => v.category === selectedCategory)
                                if (tempVendor) handleCancelTempVendor(tempVendor)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveVendor}
                            disabled={!vendorForm.name || !selectedCategory || loading}
                        >
                            {loading ? 'Saving...' : 'Save Vendor'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
