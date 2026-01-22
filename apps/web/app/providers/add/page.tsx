'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import { VENDOR_CATEGORIES } from '@/types/provider'

interface Category {
  category: string
  subcategory?: string
  isPrimary: boolean
}

export default function AddProviderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    providerType: 'VENDOR',
    companyName: '',
    email: '',
    phone: '',
    website: '',
    city: '',
    state: '',
    country: 'India',
    description: '',
    yearEstablished: new Date().getFullYear()
  })
  const [categories, setCategories] = useState<Category[]>([
    { category: '', subcategory: '', isPrimary: true }
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.companyName || !formData.email) {
      toast({
        title: 'Validation Error',
        description: 'Company name and email are required',
        variant: 'destructive'
      })
      return
    }

    const validCategories = categories.filter(c => c.category)
    if (validCategories.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one category is required',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      const tenantId = localStorage.getItem('currentTenantId')
      
      const response = await fetch(`/api/companies/${tenantId}/providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          categories: validCategories
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add provider')
      }

      const data = await response.json()
      
      toast({
        title: 'Success',
        description: 'Provider added successfully'
      })

      router.push('/providers')
    } catch (error: any) {
      console.error('Error adding provider:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to add provider',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const addCategory = () => {
    setCategories([...categories, { category: '', subcategory: '', isPrimary: false }])
  }

  const removeCategory = (index: number) => {
    if (categories.length > 1) {
      setCategories(categories.filter((_, i) => i !== index))
    }
  }

  const updateCategory = (index: number, field: keyof Category, value: any) => {
    const updated = [...categories]
    updated[index] = { ...updated[index], [field]: value }
    setCategories(updated)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => router.push('/providers')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Providers
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add New Provider</CardTitle>
          <CardDescription>
            Add a vendor, sponsor, or exhibitor to your company
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Provider Type */}
            <div className="space-y-2">
              <Label htmlFor="providerType">Provider Type *</Label>
              <Select
                value={formData.providerType}
                onValueChange={(value) => setFormData({ ...formData, providerType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VENDOR">Vendor</SelectItem>
                  <SelectItem value="SPONSOR">Sponsor</SelectItem>
                  <SelectItem value="EXHIBITOR">Exhibitor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Enter company name"
                required
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.company.com"
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Mumbai"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Maharashtra"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="India"
                />
              </div>
            </div>

            {/* Year Established */}
            <div className="space-y-2">
              <Label htmlFor="yearEstablished">Year Established</Label>
              <Input
                id="yearEstablished"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={formData.yearEstablished}
                onChange={(e) => setFormData({ ...formData, yearEstablished: parseInt(e.target.value) })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the company and services offered..."
                rows={4}
              />
            </div>

            {/* Categories */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Categories *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCategory}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </div>
              
              {categories.map((category, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Select
                      value={category.category}
                      onValueChange={(value) => updateCategory(index, 'category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(VENDOR_CATEGORIES).map(([key, label]) => (
                          <SelectItem key={key} value={label}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Subcategory (optional)"
                      value={category.subcategory || ''}
                      onChange={(e) => updateCategory(index, 'subcategory', e.target.value)}
                    />
                  </div>
                  {categories.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCategory(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/providers')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Adding...' : 'Add Provider'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
