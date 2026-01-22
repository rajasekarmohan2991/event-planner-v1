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
import { ArrowLeft, Package, Plus, Trash2 } from 'lucide-react'

const VENDOR_CATEGORIES = [
  'Catering', 'Audio/Visual', 'Photography', 'Videography', 'Decoration',
  'Security', 'Transportation', 'Entertainment', 'Printing', 'Furniture Rental',
  'Lighting', 'Stage Setup', 'Cleaning', 'Technical Support', 'Other'
]

interface Service {
  name: string
  description: string
  base_price: number
  price_unit: string
}

export default function AddVendorPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    phone: '',
    website: '',
    category: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    year_established: '',
    tax_id: '',
    bank_name: '',
    account_number: '',
    account_holder_name: '',
    ifsc_code: '',
    commission_rate: '15'
  })

  const [services, setServices] = useState<Service[]>([
    { name: '', description: '', base_price: 0, price_unit: 'per_event' }
  ])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleServiceChange = (index: number, field: string, value: any) => {
    const updated = [...services]
    updated[index] = { ...updated[index], [field]: value }
    setServices(updated)
  }

  const addService = () => {
    setServices([...services, { name: '', description: '', base_price: 0, price_unit: 'per_event' }])
  }

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.company_name || !formData.email || !formData.category) {
      toast({ title: 'Please fill required fields', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/super-admin/service-management/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          services: services.filter(s => s.name.trim() !== '')
        })
      })

      if (res.ok) {
        toast({ title: 'Vendor added successfully' })
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
            Register a new vendor company with services and payment details
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Basic details about the vendor company</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleChange('company_name', e.target.value)}
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
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="vendor@company.com"
                required
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
              <Label htmlFor="year_established">Year Established</Label>
              <Input
                id="year_established"
                value={formData.year_established}
                onChange={(e) => handleChange('year_established', e.target.value)}
                placeholder="2020"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief description of the vendor company..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
            <CardDescription>Company location details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="123 Business Street"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="State"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="Country"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                placeholder="12345"
              />
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Services Offered</CardTitle>
                <CardDescription>List of services this vendor provides</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={addService}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Service {index + 1}</span>
                  {services.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeService(index)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Service Name</Label>
                    <Input
                      value={service.name}
                      onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                      placeholder="e.g., Full Event Catering"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Base Price</Label>
                    <Input
                      type="number"
                      value={service.base_price}
                      onChange={(e) => handleServiceChange(index, 'base_price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price Unit</Label>
                    <Select 
                      value={service.price_unit} 
                      onValueChange={(v) => handleServiceChange(index, 'price_unit', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_event">Per Event</SelectItem>
                        <SelectItem value="per_day">Per Day</SelectItem>
                        <SelectItem value="per_hour">Per Hour</SelectItem>
                        <SelectItem value="per_person">Per Person</SelectItem>
                        <SelectItem value="fixed">Fixed Price</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={service.description}
                      onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                      placeholder="Brief description"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>Bank details for vendor payments</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax_id">Tax ID / GST Number</Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) => handleChange('tax_id', e.target.value)}
                placeholder="Tax identification number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission_rate">Commission Rate (%)</Label>
              <Input
                id="commission_rate"
                type="number"
                value={formData.commission_rate}
                onChange={(e) => handleChange('commission_rate', e.target.value)}
                placeholder="15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                placeholder="Bank name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_holder_name">Account Holder Name</Label>
              <Input
                id="account_holder_name"
                value={formData.account_holder_name}
                onChange={(e) => handleChange('account_holder_name', e.target.value)}
                placeholder="Account holder name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) => handleChange('account_number', e.target.value)}
                placeholder="Account number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifsc_code">IFSC / Routing Code</Label>
              <Input
                id="ifsc_code"
                value={formData.ifsc_code}
                onChange={(e) => handleChange('ifsc_code', e.target.value)}
                placeholder="IFSC or routing code"
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
            {saving ? 'Saving...' : 'Add Vendor'}
          </Button>
        </div>
      </form>
    </div>
  )
}
