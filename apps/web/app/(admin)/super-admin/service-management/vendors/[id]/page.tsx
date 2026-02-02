'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { LoadingPage } from '@/components/ui/loading-spinner'
import {
  Package, Plus, ArrowLeft, Edit, Trash2, Save,
  DollarSign, Star, Building2, Mail, Phone, Globe, MapPin,
  Utensils, Users, Calendar, CreditCard, ChevronRight, Link2,
  Clock, Check
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  type: string
  cuisine: string | null
  description: string | null
  priceImpact: number
  isCustomizable: boolean
}

interface MenuCategory {
  id: string
  name: string
  description: string | null
  sortOrder: number
  items: MenuItem[]
}

interface MealPackage {
  id: string
  name: string
  type: string
  pricePerPlate: number
  minGuests: number
  maxGuests: number | null
  description: string | null
  includedItems: any
}

interface VendorService {
  id: string
  name: string
  type: string
  priceModel: string
  basePrice: number
  currency: string
  minOrderQty: number
  maxCapacity: number | null
  description: string | null
  isPopular: boolean
  categories: MenuCategory[]
  packages: MealPackage[]
}

interface Booking {
  id: string
  bookingDate: string
  guestCount: number
  status: string
  baseAmount: number
  taxAmount: number
  totalAmount: number
  advancePaid: number
  notes: string | null
}

interface LinkedCompany {
  id: string
  name: string
  slug: string
  logo: string | null
}

interface VendorStats {
  totalServices: number
  totalBookings: number
  totalRevenue: number
  totalCategories: number
  totalMenuItems: number
  totalPackages: number
}

interface VendorDetails {
  id: string
  name: string
  category: string
  description: string | null
  email: string | null
  phone: string | null
  website: string | null
  logo: string | null
  rating: number
  reviewCount: number
  establishedYear: number | null
  serviceCapacity: number | null
  operatingCities: any
  tenantId: string | null
  createdAt: string
  services: VendorService[]
  bookings: Booking[]
  linkedCompany: LinkedCompany | null
  stats: VendorStats
}

export default function VendorDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const vendorId = params.id as string

  const [vendor, setVendor] = useState<VendorDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Dialog states
  const [showAddService, setShowAddService] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showAddPackage, setShowAddPackage] = useState(false)
  const [selectedService, setSelectedService] = useState<VendorService | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null)
  const [saving, setSaving] = useState(false)

  // Form states
  const [serviceForm, setServiceForm] = useState({
    name: '', type: '', priceModel: 'Per Plate', basePrice: 0, description: ''
  })
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })
  const [itemForm, setItemForm] = useState({
    name: '', type: 'VEG', cuisine: '', description: '', priceImpact: 0
  })
  const [packageForm, setPackageForm] = useState({
    name: '', type: 'Lunch', pricePerPlate: 0, minGuests: 10, maxGuests: 0, description: ''
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
      } else {
        toast({ title: 'Vendor not found', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Failed to load vendor details', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddService = async () => {
    if (!serviceForm.name || !serviceForm.type) {
      toast({ title: 'Name and type are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/super-admin/service-management/vendors/${vendorId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm)
      })
      if (res.ok) {
        toast({ title: 'Service added successfully!' })
        setShowAddService(false)
        setServiceForm({ name: '', type: '', priceModel: 'Per Plate', basePrice: 0, description: '' })
        fetchVendorDetails()
      }
    } catch (error) {
      toast({ title: 'Failed to add service', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddCategory = async () => {
    if (!categoryForm.name || !selectedService) return
    setSaving(true)
    try {
      const res = await fetch(
        `/api/super-admin/service-management/vendors/${vendorId}/services/${selectedService.id}/categories`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryForm)
        }
      )
      if (res.ok) {
        toast({ title: 'Menu category added!' })
        setShowAddCategory(false)
        setCategoryForm({ name: '', description: '' })
        fetchVendorDetails()
      }
    } catch (error) {
      toast({ title: 'Failed to add category', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddItem = async () => {
    if (!itemForm.name || !selectedCategory || !selectedService) return
    setSaving(true)
    try {
      const res = await fetch(
        `/api/super-admin/service-management/vendors/${vendorId}/services/${selectedService.id}/categories/${selectedCategory.id}/items`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemForm)
        }
      )
      if (res.ok) {
        toast({ title: 'Menu item added!' })
        setShowAddItem(false)
        setItemForm({ name: '', type: 'VEG', cuisine: '', description: '', priceImpact: 0 })
        fetchVendorDetails()
      }
    } catch (error) {
      toast({ title: 'Failed to add item', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddPackage = async () => {
    if (!packageForm.name || !selectedService) return
    setSaving(true)
    try {
      const res = await fetch(
        `/api/super-admin/service-management/vendors/${vendorId}/services/${selectedService.id}/packages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(packageForm)
        }
      )
      if (res.ok) {
        toast({ title: 'Meal package added!' })
        setShowAddPackage(false)
        setPackageForm({ name: '', type: 'Lunch', pricePerPlate: 0, minGuests: 10, maxGuests: 0, description: '' })
        fetchVendorDetails()
      }
    } catch (error) {
      toast({ title: 'Failed to add package', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'CONFIRMED': 'bg-green-100 text-green-700',
      'COMPLETED': 'bg-blue-100 text-blue-700',
      'CANCELLED': 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  if (loading) return <LoadingPage text="" />
  if (!vendor) return <div className="p-8 text-center">Vendor not found</div>

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.push('/super-admin/service-management/vendors')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Vendor Header Card */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        <CardContent className="pt-0 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
            <div className="w-24 h-24 bg-white rounded-xl shadow-lg overflow-hidden flex items-center justify-center border-4 border-white">
              {vendor.logo ? (
                <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                  {vendor.name?.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
                <Badge className="bg-blue-100 text-blue-700">{vendor.category}</Badge>
                {vendor.rating > 0 && (
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    {vendor.rating.toFixed(1)} ({vendor.reviewCount} reviews)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                {vendor.email && (
                  <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{vendor.email}</span>
                )}
                {vendor.phone && (
                  <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{vendor.phone}</span>
                )}
                {vendor.website && (
                  <span className="flex items-center gap-1"><Globe className="h-4 w-4" />{vendor.website}</span>
                )}
              </div>
              {/* Linked Company */}
              {vendor.linkedCompany && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                  <Link2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Linked to: <strong>{vendor.linkedCompany.name}</strong></span>
                </div>
              )}
            </div>
            <Button onClick={() => router.push(`/super-admin/service-management/vendors/${vendorId}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Vendor
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{vendor.stats.totalServices}</p>
            <p className="text-xs text-blue-600">Services</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{vendor.stats.totalCategories}</p>
            <p className="text-xs text-purple-600">Menu Categories</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-orange-700">{vendor.stats.totalMenuItems}</p>
            <p className="text-xs text-orange-600">Menu Items</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-700">{vendor.stats.totalPackages}</p>
            <p className="text-xs text-green-600">Packages</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">{vendor.stats.totalBookings}</p>
            <p className="text-xs text-yellow-600">Bookings</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">₹{vendor.stats.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-emerald-600">Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services ({vendor.services.length})</TabsTrigger>
          <TabsTrigger value="bookings">Bookings ({vendor.bookings.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vendor.description && <p className="text-gray-600">{vendor.description}</p>}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {vendor.establishedYear && (
                    <div>
                      <span className="text-gray-500">Established:</span>
                      <span className="ml-2 font-medium">{vendor.establishedYear}</span>
                    </div>
                  )}
                  {vendor.serviceCapacity && (
                    <div>
                      <span className="text-gray-500">Max Capacity:</span>
                      <span className="ml-2 font-medium">{vendor.serviceCapacity} guests</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Services</span>
                    <span className="font-semibold">{vendor.stats.totalServices}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Menu Items</span>
                    <span className="font-semibold">{vendor.stats.totalMenuItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Packages</span>
                    <span className="font-semibold">{vendor.stats.totalPackages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Bookings</span>
                    <span className="font-semibold">{vendor.stats.totalBookings}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-gray-600 font-medium">Total Revenue</span>
                    <span className="font-bold text-green-600">₹{vendor.stats.totalRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Services & Menu</h3>
            <Button onClick={() => setShowAddService(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>

          {vendor.services.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Services Yet</h3>
                <p className="text-gray-500 mb-4">Start by adding your first service</p>
                <Button onClick={() => setShowAddService(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {vendor.services.map(service => (
                <Card key={service.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Utensils className="h-5 w-5 text-blue-600" />
                          {service.name}
                          {service.isPopular && <Badge className="bg-yellow-100 text-yellow-700">Popular</Badge>}
                        </CardTitle>
                        <CardDescription>{service.type} • {service.priceModel}</CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-600">₹{service.basePrice}</p>
                        <p className="text-xs text-gray-500">{service.priceModel}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {service.description && <p className="text-gray-600 mb-4">{service.description}</p>}

                    {/* Menu Categories */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm text-gray-700">Menu Categories</h4>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedService(service); setShowAddCategory(true); }}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add Category
                        </Button>
                      </div>
                      {service.categories.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No menu categories yet</p>
                      ) : (
                        <div className="space-y-3">
                          {service.categories.map(cat => (
                            <div key={cat.id} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{cat.name}</h5>
                                <Button size="sm" variant="ghost" onClick={() => { setSelectedService(service); setSelectedCategory(cat); setShowAddItem(true); }}>
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Item
                                </Button>
                              </div>
                              {cat.items.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {cat.items.map(item => (
                                    <div key={item.id} className={`text-xs p-2 rounded ${item.type === 'VEG' ? 'bg-green-50 border border-green-200' : item.type === 'NON_VEG' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                                      <span className="font-medium">{item.name}</span>
                                      {item.priceImpact > 0 && <span className="text-gray-500 ml-1">+₹{item.priceImpact}</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Packages */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm text-gray-700">Meal Packages</h4>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedService(service); setShowAddPackage(true); }}>
                          <Plus className="h-3 w-3 mr-1" />
                          Add Package
                        </Button>
                      </div>
                      {service.packages.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No packages yet</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {service.packages.map(pkg => (
                            <div key={pkg.id} className="border rounded-lg p-3 bg-gradient-to-br from-blue-50 to-indigo-50">
                              <h5 className="font-semibold">{pkg.name}</h5>
                              <p className="text-xs text-gray-500">{pkg.type}</p>
                              <p className="text-lg font-bold text-blue-600 mt-1">₹{pkg.pricePerPlate}/plate</p>
                              <p className="text-xs text-gray-500">Min {pkg.minGuests} guests{pkg.maxGuests ? `, Max ${pkg.maxGuests}` : ''}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <h3 className="text-lg font-semibold">Recent Bookings</h3>
          {vendor.bookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Bookings Yet</h3>
                <p className="text-gray-500">Bookings will appear here once made</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {vendor.bookings.map(booking => (
                <Card key={booking.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{new Date(booking.bookingDate).toLocaleDateString()}</span>
                          <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span><Users className="h-3 w-3 inline mr-1" />{booking.guestCount} guests</span>
                          {booking.notes && <span>{booking.notes}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">₹{booking.totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Advance: ₹{booking.advancePaid.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Service Dialog */}
      <Dialog open={showAddService} onOpenChange={setShowAddService}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>Create a new service for this vendor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Service Name *</Label>
              <Input value={serviceForm.name} onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })} placeholder="e.g., Wedding Catering" />
            </div>
            <div>
              <Label>Type *</Label>
              <Input value={serviceForm.type} onChange={e => setServiceForm({ ...serviceForm, type: e.target.value })} placeholder="e.g., Full Service, Buffet, Drop-off" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price Model</Label>
                <Select value={serviceForm.priceModel} onValueChange={v => setServiceForm({ ...serviceForm, priceModel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Per Plate">Per Plate</SelectItem>
                    <SelectItem value="Per Event">Per Event</SelectItem>
                    <SelectItem value="Per Hour">Per Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Base Price (₹)</Label>
                <Input type="number" value={serviceForm.basePrice} onChange={e => setServiceForm({ ...serviceForm, basePrice: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddService(false)}>Cancel</Button>
            <Button onClick={handleAddService} disabled={saving}>{saving ? 'Saving...' : 'Add Service'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Menu Category</DialogTitle>
            <DialogDescription>Add a menu category to {selectedService?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name *</Label>
              <Input value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="e.g., Starters, Main Course, Desserts" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategory(false)}>Cancel</Button>
            <Button onClick={handleAddCategory} disabled={saving}>{saving ? 'Saving...' : 'Add Category'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
            <DialogDescription>Add item to {selectedCategory?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Item Name *</Label>
              <Input value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} placeholder="e.g., Paneer Tikka" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type *</Label>
                <Select value={itemForm.type} onValueChange={v => setItemForm({ ...itemForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VEG">Veg</SelectItem>
                    <SelectItem value="NON_VEG">Non-Veg</SelectItem>
                    <SelectItem value="VEGAN">Vegan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price Impact (₹)</Label>
                <Input type="number" value={itemForm.priceImpact} onChange={e => setItemForm({ ...itemForm, priceImpact: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <Label>Cuisine</Label>
              <Input value={itemForm.cuisine} onChange={e => setItemForm({ ...itemForm, cuisine: e.target.value })} placeholder="e.g., Indian, Chinese" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItem(false)}>Cancel</Button>
            <Button onClick={handleAddItem} disabled={saving}>{saving ? 'Saving...' : 'Add Item'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Package Dialog */}
      <Dialog open={showAddPackage} onOpenChange={setShowAddPackage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Meal Package</DialogTitle>
            <DialogDescription>Add a meal package to {selectedService?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Package Name *</Label>
              <Input value={packageForm.name} onChange={e => setPackageForm({ ...packageForm, name: e.target.value })} placeholder="e.g., Premium Wedding Package" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={packageForm.type} onValueChange={v => setPackageForm({ ...packageForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Breakfast">Breakfast</SelectItem>
                    <SelectItem value="Lunch">Lunch</SelectItem>
                    <SelectItem value="Dinner">Dinner</SelectItem>
                    <SelectItem value="Full Day">Full Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price Per Plate (₹) *</Label>
                <Input type="number" value={packageForm.pricePerPlate} onChange={e => setPackageForm({ ...packageForm, pricePerPlate: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Guests</Label>
                <Input type="number" value={packageForm.minGuests} onChange={e => setPackageForm({ ...packageForm, minGuests: parseInt(e.target.value) || 10 })} />
              </div>
              <div>
                <Label>Max Guests</Label>
                <Input type="number" value={packageForm.maxGuests} onChange={e => setPackageForm({ ...packageForm, maxGuests: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={packageForm.description} onChange={e => setPackageForm({ ...packageForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPackage(false)}>Cancel</Button>
            <Button onClick={handleAddPackage} disabled={saving}>{saving ? 'Saving...' : 'Add Package'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
