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
import { ArrowLeft, Store, Calendar, Building2 } from 'lucide-react'

const BOOTH_TYPES = [
  'Standard', 'Premium', 'Island', 'Corner', 'Inline',
  'Peninsula', 'Custom'
]

interface Event {
  id: string
  name: string
  tenantName: string
  tenantId: string
}

interface Tenant {
  id: string
  name: string
  slug: string
}

export default function AddExhibitorPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadingTenants, setLoadingTenants] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    company: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    companyDescription: '',
    productsServices: '',
    boothType: '',
    eventId: '',
    tenantId: '' // Optional link to Event Management Company
  })

  // Fetch all events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/super-admin/events')
        if (res.ok) {
          const data = await res.json()
          setEvents(data.events || [])
        }
      } catch (error) {
        console.error('Failed to fetch events:', error)
      } finally {
        setLoadingEvents(false)
      }
    }
    fetchEvents()
  }, [])

  // Fetch all tenants
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await fetch('/api/super-admin/companies')
        if (res.ok) {
          const data = await res.json()
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

    if (!formData.name || !formData.eventId) {
      toast({ title: 'Please fill required fields (Name and Event)', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/super-admin/service-management/exhibitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          company: formData.company || null,
          contactName: formData.contactName || null,
          contactEmail: formData.contactEmail || null,
          contactPhone: formData.contactPhone || null,
          website: formData.website || null,
          companyDescription: formData.companyDescription || null,
          productsServices: formData.productsServices || null,
          boothType: formData.boothType || null,
          eventId: formData.eventId,
          tenantId: formData.tenantId || null
        })
      })

      if (res.ok) {
        toast({ title: 'Exhibitor created successfully!' })
        router.push('/super-admin/service-management/exhibitors')
      } else {
        const data = await res.json()
        toast({ title: data.error || 'Failed to add exhibitor', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Failed to add exhibitor', variant: 'destructive' })
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
            <Store className="h-6 w-6 text-green-600" />
            Add New Exhibitor
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Register a new exhibitor company for an event
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Link to Event (Required) */}
        <Card className="border-2 border-dashed border-green-300 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Calendar className="h-5 w-5" />
              Link to Event *
            </CardTitle>
            <CardDescription>
              Select which event this exhibitor is associated with
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventId">Select Event *</Label>
              <Select value={formData.eventId} onValueChange={(v) => handleChange('eventId', v)}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={loadingEvents ? "Loading events..." : "Select an event"} />
                </SelectTrigger>
                <SelectContent>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        {event.name}
                        {event.tenantName && (
                          <span className="text-xs text-gray-400">({event.tenantName})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenantId">Link to Event Management Company (Optional)</Label>
              <Select value={formData.tenantId} onValueChange={(v) => handleChange('tenantId', v)}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={loadingTenants ? "Loading..." : "Select company (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Linked Company</SelectItem>
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
            </div>
          </CardContent>
        </Card>

        {/* Exhibitor Information */}
        <Card>
          <CardHeader>
            <CardTitle>Exhibitor Information</CardTitle>
            <CardDescription>Basic details about the exhibitor</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Exhibitor Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter exhibitor name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="Enter company name"
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
              <Label htmlFor="boothType">Booth Type</Label>
              <Select value={formData.boothType} onValueChange={(v) => handleChange('boothType', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select booth type" />
                </SelectTrigger>
                <SelectContent>
                  {BOOTH_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="companyDescription">Company Description</Label>
              <Textarea
                id="companyDescription"
                value={formData.companyDescription}
                onChange={(e) => handleChange('companyDescription', e.target.value)}
                placeholder="Brief description of the company..."
                rows={3}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="productsServices">Products/Services</Label>
              <Textarea
                id="productsServices"
                value={formData.productsServices}
                onChange={(e) => handleChange('productsServices', e.target.value)}
                placeholder="List the products or services they will showcase..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Primary contact person for this exhibitor</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => handleChange('contactName', e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                placeholder="john@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                placeholder="+1 234 567 8900"
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
            {saving ? 'Creating...' : 'Create Exhibitor'}
          </Button>
        </div>
      </form>
    </div>
  )
}
