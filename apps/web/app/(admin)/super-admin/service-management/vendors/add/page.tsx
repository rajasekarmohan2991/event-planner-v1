'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Package, Plus, Trash2, Link2, Building2 } from 'lucide-react'

const VENDOR_CATEGORIES = [
  'Catering', 'Audio/Visual', 'Photography', 'Videography', 'Decoration',
  'Security', 'Transportation', 'Entertainment', 'Printing', 'Furniture Rental',
  'Lighting', 'Stage Setup', 'Cleaning', 'Technical Support', 'Other'
]

interface Tenant {
  id: string
  name: string
  slug: string
}

export default function AddVendorPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loadingTenants, setLoadingTenants] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    category: '',
    description: '',
    logo: '',
    coverImage: '',
    establishedYear: '',
    serviceCapacity: '',
    tenantId: '' // Link to Event Management Company
  })

  // Fetch Event Management Companies (Tenants)
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await fetch('/api/super-admin/companies')
        if (res.ok) {
          const data = await res.json()
          // Filter out super-admin tenants
          const companies = (data.companies || []).filter(
            (c: any) => c.slug !== 'super-admin' && c.slug !== 'default-tenant'
          )
          setTenants(companies)
        }
      } catch (error) {
        console.error('Failed to fetch tenants:', error)
      } finally {
        setLoadingTenants(false)
      }
    }
    fetchTenants()
  }, [])

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
      const tenantId = formData.tenantId === 'none' ? null : (formData.tenantId || null)
      const res = await fetch('/api/super-admin/service-management/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          description: formData.description || null,
          email: formData.email || null,
          phone: formData.phone || null,
          website: formData.website || null,
          logo: formData.logo || null,
          coverImage: formData.coverImage || null,
          establishedYear: formData.establishedYear || null,
          serviceCapacity: formData.serviceCapacity || null,
          tenantId
        })
      })

      if (res.ok) {
        toast({ title: 'Vendor created successfully!' })
        router.push('/super-admin/service-management/vendors')
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
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
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
            Register a new vendor company on the platform
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Link to Event Management Company */}
        <Card className="border-2 border-dashed border-green-300 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Link2 className="h-5 w-5" />
              Link to Event Management Company
            </CardTitle>
            <CardDescription>
              Optionally link this vendor to an event management company on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="tenantId">Select Company (Optional)</Label>
              <Select value={formData.tenantId} onValueChange={(v) => handleChange('tenantId', v)}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={loadingTenants ? "Loading companies..." : "Select a company or leave empty"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Linked Company (Platform Vendor)</SelectItem>
                  {tenants.map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        {tenant.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Linked vendors will appear in the selected company's vendor list
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
            <CardDescription>Basic details about the vendor company</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter company name"
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
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://www.company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="establishedYear">Year Established</Label>
              <Input
                id="establishedYear"
                value={formData.establishedYear}
                onChange={(e) => handleChange('establishedYear', e.target.value)}
                placeholder="2020"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceCapacity">Max Service Capacity (Guests)</Label>
              <Input
                id="serviceCapacity"
                type="number"
                value={formData.serviceCapacity}
                onChange={(e) => handleChange('serviceCapacity', e.target.value)}
                placeholder="500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                value={formData.logo}
                onChange={(e) => handleChange('logo', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of the vendor company and their services..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create Vendor'}
          </Button>
        </div>
      </form>
    </div>
  )
}
