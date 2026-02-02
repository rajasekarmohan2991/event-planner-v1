'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Package } from 'lucide-react'

const VENDOR_CATEGORIES = [
    'Catering', 'Audio/Visual', 'Photography', 'Videography', 'Decoration',
    'Security', 'Transportation', 'Entertainment', 'Printing', 'Furniture Rental',
    'Lighting', 'Stage Setup', 'Cleaning', 'Technical Support', 'Other'
]

export default function AddCompanyVendorPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        email: '',
        phone: '',
        website: '',
        description: '',
        logo: '',
        establishedYear: '',
        serviceCapacity: ''
    })

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.category) {
            toast({ title: 'Please fill required fields', variant: 'destructive' })
            return
        }

        setSaving(true)
        try {
            const res = await fetch('/api/admin/service-management/vendors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                toast({ title: 'Vendor added successfully!' })
                router.push('/admin/service-management/vendors')
            } else {
                const data = await res.json()
                toast({ title: data.error || 'Failed to add vendor', variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'Failed to add vendor', variant: 'destructive' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="p-6 space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                        <Package className="h-6 w-6 text-blue-600" />
                        Add New Vendor
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Add a vendor to your company's vendor list
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Vendor Information</CardTitle>
                        <CardDescription>Basic details about the vendor</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Vendor Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="Enter vendor name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {VENDOR_CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="vendor@company.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="+91 98765 43210"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                value={formData.website}
                                onChange={(e) => handleChange('website', e.target.value)}
                                placeholder="https://www.vendor.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="serviceCapacity">Max Capacity (guests)</Label>
                            <Input
                                id="serviceCapacity"
                                type="number"
                                value={formData.serviceCapacity}
                                onChange={(e) => handleChange('serviceCapacity', e.target.value)}
                                placeholder="500"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Brief description of the vendor..."
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Adding...' : 'Add Vendor'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
