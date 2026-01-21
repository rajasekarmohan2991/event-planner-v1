'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ManageTabs from '@/components/events/ManageTabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, Users, Building2, Handshake, CheckCircle2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

type DonorType = 'VENDOR' | 'SPONSOR' | 'EXHIBITOR'

interface QuickFormData {
    donorType: DonorType | ''
    companyName: string
    individualName: string
    phoneNumber: string
    emailId: string
    requirementsDescription: string
    website: string
    address: string
    gstNumber: string
    amount: string
    tier: string
    category: string
    boothType: string
}

const initialFormData: QuickFormData = {
    donorType: '',
    companyName: '',
    individualName: '',
    phoneNumber: '',
    emailId: '',
    requirementsDescription: '',
    website: '',
    address: '',
    gstNumber: '',
    amount: '',
    tier: 'BRONZE',
    category: 'CATERING',
    boothType: 'Standard'
}

const SPONSOR_TIERS = ['PLATINUM', 'GOLD', 'SILVER', 'BRONZE'] as const
const VENDOR_CATEGORIES = ['CATERING', 'VENUE', 'PHOTOGRAPHY', 'ENTERTAINMENT', 'DECORATION', 'OTHER'] as const
const BOOTH_TYPES = ['Standard', 'Premium', 'VIP', 'Corner'] as const

export default function QuickPartnerFormPage() {
    const params = useParams()
    const router = useRouter()
    const eventId = params?.id as string

    const [activeTab, setActiveTab] = useState<'quick' | 'sponsors' | 'vendors' | 'exhibitors'>('quick')
    const [formData, setFormData] = useState<QuickFormData>(initialFormData)
    const [loading, setLoading] = useState(false)
    const [recentAdditions, setRecentAdditions] = useState<Array<{ type: string; name: string; time: Date }>>([])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.donorType) {
            toast({ title: 'Error', description: 'Please select a donor type', variant: 'destructive' as any })
            return
        }

        if (!formData.companyName && !formData.individualName) {
            toast({ title: 'Error', description: 'Please enter company or individual name', variant: 'destructive' as any })
            return
        }

        if (!formData.emailId) {
            toast({ title: 'Error', description: 'Email is required', variant: 'destructive' as any })
            return
        }

        setLoading(true)

        try {
            let endpoint = ''
            let body: any = {}

            switch (formData.donorType) {
                case 'SPONSOR':
                    endpoint = `/api/events/${eventId}/sponsors`
                    body = {
                        name: formData.companyName || formData.individualName,
                        tier: formData.tier,
                        amount: formData.amount ? Number(formData.amount) : 0,
                        website: formData.website || undefined,
                        contactData: {
                            name: formData.individualName,
                            email: formData.emailId,
                            phone: formData.phoneNumber
                        },
                        notes: formData.requirementsDescription
                    }
                    break

                case 'VENDOR':
                    endpoint = `/api/events/${eventId}/vendors`
                    body = {
                        name: formData.companyName || formData.individualName,
                        category: formData.category,
                        contactName: formData.individualName,
                        contactEmail: formData.emailId,
                        contactPhone: formData.phoneNumber,
                        contractAmount: formData.amount ? Number(formData.amount) : 0,
                        notes: formData.requirementsDescription,
                        status: 'ACTIVE'
                    }
                    break

                case 'EXHIBITOR':
                    endpoint = `/api/events/${eventId}/exhibitors`
                    body = {
                        name: formData.individualName || formData.companyName,
                        company: formData.companyName,
                        contactName: formData.individualName,
                        contactEmail: formData.emailId,
                        contactPhone: formData.phoneNumber,
                        boothType: formData.boothType,
                        notes: formData.requirementsDescription
                    }
                    break
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.message || 'Failed to add')
            }

            // Success
            toast({
                title: '✅ Added Successfully!',
                description: `${formData.donorType} "${formData.companyName || formData.individualName}" has been added.`
            })

            // Add to recent
            setRecentAdditions(prev => [
                { type: formData.donorType, name: formData.companyName || formData.individualName, time: new Date() },
                ...prev.slice(0, 4)
            ])

            // Reset form but keep donor type
            const keepType = formData.donorType
            setFormData({ ...initialFormData, donorType: keepType })

        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to add',
                variant: 'destructive' as any
            })
        } finally {
            setLoading(false)
        }
    }

    const getDonorTypeIcon = (type: DonorType | '') => {
        switch (type) {
            case 'SPONSOR': return <Handshake className="w-5 h-5" />
            case 'VENDOR': return <Building2 className="w-5 h-5" />
            case 'EXHIBITOR': return <Users className="w-5 h-5" />
            default: return <Zap className="w-5 h-5" />
        }
    }

    const getDonorTypeColor = (type: DonorType | '') => {
        switch (type) {
            case 'SPONSOR': return 'bg-purple-100 text-purple-700 border-purple-300'
            case 'VENDOR': return 'bg-blue-100 text-blue-700 border-blue-300'
            case 'EXHIBITOR': return 'bg-green-100 text-green-700 border-green-300'
            default: return 'bg-gray-100 text-gray-700 border-gray-300'
        }
    }

    return (
        <div className="space-y-6">
            <ManageTabs eventId={eventId} />

            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        Partners & Donors
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Quickly add sponsors, vendors, and exhibitors
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b">
                <div className="flex items-center gap-6">
                    <button
                        className={`relative pb-2 text-sm font-medium transition-colors ${activeTab === 'quick'
                                ? 'text-indigo-600'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        onClick={() => setActiveTab('quick')}
                    >
                        <span className="flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Quick Form
                        </span>
                        <span className={`pointer-events-none absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-indigo-600 transition-transform ${activeTab === 'quick' ? 'scale-x-100' : 'scale-x-0'
                            }`} />
                    </button>
                    <button
                        className={`relative pb-2 text-sm font-medium transition-colors ${activeTab === 'sponsors'
                                ? 'text-purple-600'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        onClick={() => router.push(`/events/${eventId}/sponsors`)}
                    >
                        <span className="flex items-center gap-2">
                            <Handshake className="w-4 h-4" />
                            Sponsors
                        </span>
                    </button>
                    <button
                        className={`relative pb-2 text-sm font-medium transition-colors ${activeTab === 'vendors'
                                ? 'text-blue-600'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        onClick={() => router.push(`/events/${eventId}/vendors`)}
                    >
                        <span className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Vendors
                        </span>
                    </button>
                    <button
                        className={`relative pb-2 text-sm font-medium transition-colors ${activeTab === 'exhibitors'
                                ? 'text-green-600'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        onClick={() => router.push(`/events/${eventId}/exhibitors`)}
                    >
                        <span className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Exhibitors
                        </span>
                    </button>
                </div>
            </div>

            {/* Quick Form Content */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500" />
                                Quick Add Partner
                            </CardTitle>
                            <CardDescription>
                                Quickly add a sponsor, vendor, or exhibitor with minimal fields
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Donor Type Selection */}
                                <div className="space-y-2">
                                    <Label className="text-base font-semibold">Donor Type *</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['SPONSOR', 'VENDOR', 'EXHIBITOR'] as DonorType[]).map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, donorType: type })}
                                                className={`p-4 rounded-lg border-2 transition-all text-center ${formData.donorType === type
                                                        ? getDonorTypeColor(type) + ' ring-2 ring-offset-2 ring-indigo-500'
                                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    }`}
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    {getDonorTypeIcon(type)}
                                                    <span className="font-medium text-sm">{type}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Basic Info */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="companyName">Company Name *</Label>
                                        <Input
                                            id="companyName"
                                            value={formData.companyName}
                                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                            placeholder="ABC Corporation"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="individualName">Contact Person Name</Label>
                                        <Input
                                            id="individualName"
                                            value={formData.individualName}
                                            onChange={(e) => setFormData({ ...formData, individualName: e.target.value })}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phoneNumber">Phone Number</Label>
                                        <Input
                                            id="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="emailId">Email ID *</Label>
                                        <Input
                                            id="emailId"
                                            type="email"
                                            value={formData.emailId}
                                            onChange={(e) => setFormData({ ...formData, emailId: e.target.value })}
                                            placeholder="contact@company.com"
                                        />
                                    </div>
                                </div>

                                {/* Type-specific fields */}
                                {formData.donorType === 'SPONSOR' && (
                                    <div className="grid md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                        <div className="space-y-2">
                                            <Label htmlFor="tier">Sponsorship Tier</Label>
                                            <Select value={formData.tier} onValueChange={(v) => setFormData({ ...formData, tier: v })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {SPONSOR_TIERS.map(t => (
                                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="amount">Sponsorship Amount (₹)</Label>
                                            <Input
                                                id="amount"
                                                type="number"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                placeholder="50000"
                                            />
                                        </div>
                                    </div>
                                )}

                                {formData.donorType === 'VENDOR' && (
                                    <div className="grid md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Vendor Category</Label>
                                            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {VENDOR_CATEGORIES.map(c => (
                                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contractAmount">Contract Amount (₹)</Label>
                                            <Input
                                                id="contractAmount"
                                                type="number"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                placeholder="25000"
                                            />
                                        </div>
                                    </div>
                                )}

                                {formData.donorType === 'EXHIBITOR' && (
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                        <div className="space-y-2">
                                            <Label htmlFor="boothType">Booth Type</Label>
                                            <Select value={formData.boothType} onValueChange={(v) => setFormData({ ...formData, boothType: v })}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {BOOTH_TYPES.map(b => (
                                                        <SelectItem key={b} value={b}>{b}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                {/* Requirements */}
                                <div className="space-y-2">
                                    <Label htmlFor="requirements">Requirements / Description</Label>
                                    <Textarea
                                        id="requirements"
                                        value={formData.requirementsDescription}
                                        onChange={(e) => setFormData({ ...formData, requirementsDescription: e.target.value })}
                                        placeholder="Describe any special requirements, notes, or additional information..."
                                        rows={4}
                                    />
                                </div>

                                {/* Website */}
                                <div className="space-y-2">
                                    <Label htmlFor="website">Website (Optional)</Label>
                                    <Input
                                        id="website"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="https://www.company.com"
                                    />
                                </div>

                                {/* Submit */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={loading || !formData.donorType}
                                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                    >
                                        {loading ? 'Adding...' : `Add ${formData.donorType || 'Partner'}`}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setFormData(initialFormData)}
                                    >
                                        Clear
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Recent Additions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                Recently Added
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recentAdditions.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No partners added yet. Use the form to add one!
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {recentAdditions.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                            <Badge className={getDonorTypeColor(item.type as DonorType)}>
                                                {item.type}
                                            </Badge>
                                            <span className="text-sm font-medium truncate flex-1">{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Links */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">View All Partners</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2"
                                onClick={() => router.push(`/events/${eventId}/sponsors`)}
                            >
                                <Handshake className="w-4 h-4 text-purple-600" />
                                View All Sponsors
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2"
                                onClick={() => router.push(`/events/${eventId}/vendors`)}
                            >
                                <Building2 className="w-4 h-4 text-blue-600" />
                                View All Vendors
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2"
                                onClick={() => router.push(`/events/${eventId}/exhibitors`)}
                            >
                                <Users className="w-4 h-4 text-green-600" />
                                View All Exhibitors
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Info Card */}
                    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                        <CardContent className="pt-6">
                            <h3 className="font-semibold text-indigo-900 mb-2">💡 Quick Tips</h3>
                            <ul className="text-sm text-indigo-800 space-y-2">
                                <li>• <strong>Sponsors</strong>: Financial supporters with tier levels</li>
                                <li>• <strong>Vendors</strong>: Service providers (catering, photography, etc.)</li>
                                <li>• <strong>Exhibitors</strong>: Companies showcasing products at booths</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
