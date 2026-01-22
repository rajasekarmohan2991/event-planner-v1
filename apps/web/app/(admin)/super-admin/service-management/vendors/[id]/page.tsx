'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { 
  Package, Plus, ArrowLeft, Edit, Trash2, Save, X, Upload, 
  DollarSign, Star, Building2, Mail, Phone, MapPin, Image as ImageIcon,
  ChevronDown, ChevronUp
} from 'lucide-react'

interface ServiceItem {
  id: string
  name: string
  description: string
  base_price: number
  price_unit: string
  is_active: boolean
  images: string[]
  details: any
}

interface ServiceCategory {
  id: string
  name: string
  description: string
  services: ServiceItem[]
}

interface VendorDetails {
  id: string
  company_name: string
  email: string
  phone: string
  website: string
  description: string
  address: string
  city: string
  state: string
  country: string
  postal_code: string
  status: string
  avg_rating: number
  total_reviews: number
  commission_rate: number
  categories: ServiceCategory[]
}

export default function VendorDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const vendorId = params.id as string

  const [vendor, setVendor] = useState<VendorDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [showAddService, setShowAddService] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    base_price: 0,
    price_unit: 'per_event',
    details: '',
    images: [] as string[]
  })

  useEffect(() => {
    fetchVendorDetails()
  }, [vendorId])

  const fetchVendorDetails = async () => {
    try {
      const res = await fetch(`/api/super-admin/service-management/vendors/${vendorId}`)
      if (res.ok) {
        const data = await res.json()
        setVendor(data.vendor)
        // Expand all categories by default
        if (data.vendor?.categories) {
          setExpandedCategories(data.vendor.categories.map((c: any) => c.id))
        }
      }
    } catch (error) {
      toast({ title: 'Failed to load vendor details', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!categoryForm.name) {
      toast({ title: 'Category name is required', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch(`/api/super-admin/service-management/vendors/${vendorId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      })
      if (res.ok) {
        toast({ title: 'Category added successfully' })
        setCategoryForm({ name: '', description: '' })
        setShowAddCategory(false)
        fetchVendorDetails()
      }
    } catch (error) {
      toast({ title: 'Failed to add category', variant: 'destructive' })
    }
  }

  const handleAddService = async () => {
    if (!serviceForm.name || !selectedCategory) {
      toast({ title: 'Service name and category are required', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch(`/api/super-admin/service-management/vendors/${vendorId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...serviceForm, category_id: selectedCategory })
      })
      if (res.ok) {
        toast({ title: 'Service added successfully' })
        setServiceForm({ name: '', description: '', base_price: 0, price_unit: 'per_event', details: '', images: [] })
        setShowAddService(false)
        setSelectedCategory(null)
        fetchVendorDetails()
      }
    } catch (error) {
      toast({ title: 'Failed to add service', variant: 'destructive' })
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return
    try {
      const res = await fetch(`/api/super-admin/service-management/vendors/${vendorId}/services/${serviceId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast({ title: 'Service deleted successfully' })
        fetchVendorDetails()
      }
    } catch (error) {
      toast({ title: 'Failed to delete service', variant: 'destructive' })
    }
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  if (loading) return <LoadingPage text="Loading vendor details..." />
  if (!vendor) return <div className="p-8 text-center">Vendor not found</div>

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push('/super-admin/service-management/vendors')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vendors
        </Button>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-100 rounded-xl">
              <Building2 className="h-10 w-10 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{vendor.company_name}</h1>
              <div className="flex items-center gap-4 text-gray-600 mt-1">
                <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{vendor.email}</span>
                {vendor.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{vendor.phone}</span>}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={vendor.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                  {vendor.status}
                </Badge>
                {vendor.avg_rating > 0 && (
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    {vendor.avg_rating.toFixed(1)} ({vendor.total_reviews} reviews)
                  </span>
                )}
                <span className="text-sm text-gray-500">Commission: {vendor.commission_rate}%</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/super-admin/service-management/vendors/${vendorId}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Vendor
            </Button>
          </div>
        </div>
      </div>

      {/* Service Categories */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Service Categories & Offerings</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddCategory(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
          <Button onClick={() => setShowAddService(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Add Service Category</CardTitle>
            <CardDescription>Create a new category to organize services (e.g., Catering, Decoration, Entertainment)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category Name *</label>
                <Input 
                  placeholder="e.g., Catering, Stage Decoration, Photography"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input 
                  placeholder="Brief description of this category"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddCategory}><Save className="h-4 w-4 mr-2" />Save Category</Button>
              <Button variant="outline" onClick={() => setShowAddCategory(false)}><X className="h-4 w-4 mr-2" />Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Service Modal */}
      {showAddService && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle>Add New Service</CardTitle>
            <CardDescription>Add a service with detailed description, pricing, and images</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Select Category *</label>
                <select 
                  className="w-full px-3 py-2 border rounded-lg"
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Select a category</option>
                  {vendor.categories?.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Service Name *</label>
                <Input 
                  placeholder="e.g., Birthday Cake, Stage Setup, DJ Services"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  placeholder="Describe the service in detail - what's included, options available, etc."
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Base Price</label>
                <Input 
                  type="number"
                  placeholder="0.00"
                  value={serviceForm.base_price}
                  onChange={(e) => setServiceForm({ ...serviceForm, base_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Price Unit</label>
                <select 
                  className="w-full px-3 py-2 border rounded-lg"
                  value={serviceForm.price_unit}
                  onChange={(e) => setServiceForm({ ...serviceForm, price_unit: e.target.value })}
                >
                  <option value="per_event">Per Event</option>
                  <option value="per_hour">Per Hour</option>
                  <option value="per_day">Per Day</option>
                  <option value="per_person">Per Person</option>
                  <option value="per_item">Per Item</option>
                  <option value="fixed">Fixed Price</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Additional Details (Menu items, options, variations)</label>
                <Textarea 
                  placeholder="For food services: List menu items with prices&#10;For decoration: List themes and styles&#10;For entertainment: List packages and durations"
                  value={serviceForm.details}
                  onChange={(e) => setServiceForm({ ...serviceForm, details: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddService}><Save className="h-4 w-4 mr-2" />Save Service</Button>
              <Button variant="outline" onClick={() => { setShowAddService(false); setSelectedCategory(null) }}><X className="h-4 w-4 mr-2" />Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories and Services List */}
      {vendor.categories?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Service Categories Yet</h3>
            <p className="text-gray-500 mb-4">Start by adding a service category, then add services within each category.</p>
            <Button onClick={() => setShowAddCategory(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {vendor.categories?.map(category => (
            <Card key={category.id}>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      {category.name}
                      <Badge variant="outline">{category.services?.length || 0} services</Badge>
                    </CardTitle>
                    {category.description && (
                      <CardDescription>{category.description}</CardDescription>
                    )}
                  </div>
                  {expandedCategories.includes(category.id) ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </CardHeader>
              
              {expandedCategories.includes(category.id) && (
                <CardContent>
                  {category.services?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No services in this category yet</p>
                      <Button variant="link" onClick={() => { setSelectedCategory(category.id); setShowAddService(true) }}>
                        Add a service
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.services?.map(service => (
                        <div key={service.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{service.name}</h4>
                              <Badge className={service.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                {service.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-600">${service.base_price}</p>
                              <p className="text-xs text-gray-500">{service.price_unit.replace('_', ' ')}</p>
                            </div>
                          </div>
                          {service.description && (
                            <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                          )}
                          {service.details && (
                            <div className="bg-gray-50 rounded p-2 text-sm text-gray-700 mb-2 whitespace-pre-line">
                              {typeof service.details === 'string' ? service.details : JSON.stringify(service.details)}
                            </div>
                          )}
                          {service.images?.length > 0 && (
                            <div className="flex gap-2 mb-2">
                              {service.images.slice(0, 3).map((img, idx) => (
                                <div key={idx} className="w-16 h-16 bg-gray-200 rounded overflow-hidden">
                                  <img src={img} alt="" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3 mr-1" />Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteService(service.id)}>
                              <Trash2 className="h-3 w-3 mr-1" />Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
