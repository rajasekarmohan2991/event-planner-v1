'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { LoadingPage } from '@/components/ui/loading-spinner'
import {
  Package, Plus, Search, MoreHorizontal, Edit, Trash2, Eye,
  Building2, Mail, Phone, MapPin, DollarSign, Star, Users, Briefcase,
  ArrowRight, Link2
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface LinkedCompany {
  id: string
  name: string
  slug: string
  logo: string | null
}

interface VendorService {
  id: string
  name: string
  type: string
  basePrice: number
}

interface Vendor {
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
  servicesCount: number
  totalBookings: number
  totalRevenue: number
  linkedCompany: LinkedCompany | null
  services: VendorService[]
  createdAt: string
}

export default function VendorManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/super-admin/service-management/vendors')
      if (res.ok) {
        const data = await res.json()
        setVendors(data.vendors || [])
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return

    try {
      const res = await fetch(`/api/super-admin/service-management/vendors/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast({ title: 'Vendor deleted successfully' })
        fetchVendors()
      }
    } catch (error) {
      toast({ title: 'Failed to delete vendor', variant: 'destructive' })
    }
  }

  const filteredVendors = vendors.filter(v =>
    v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.linkedCompany?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Catering': 'bg-orange-100 text-orange-700 border-orange-200',
      'AV': 'bg-blue-100 text-blue-700 border-blue-200',
      'Decor': 'bg-pink-100 text-pink-700 border-pink-200',
      'Photography': 'bg-purple-100 text-purple-700 border-purple-200',
      'Venue': 'bg-green-100 text-green-700 border-green-200',
      'Entertainment': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    }
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  if (loading) {
    return <LoadingPage text="" />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <Package className="h-6 w-6 text-blue-600" />
            Vendor Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage vendor companies and their linked event management companies
          </p>
        </div>
        <Button onClick={() => router.push('/super-admin/service-management/vendors/add')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{vendors.length}</p>
                <p className="text-sm text-blue-600">Total Vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-lg">
                <Link2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">
                  {vendors.filter(v => v.linkedCompany).length}
                </p>
                <p className="text-sm text-green-600">Linked to Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500 rounded-lg">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  {vendors.reduce((sum, v) => sum + (v.servicesCount || 0), 0)}
                </p>
                <p className="text-sm text-purple-600">Total Services</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">
                  ₹{vendors.reduce((sum, v) => sum + (v.totalRevenue || 0), 0).toLocaleString()}
                </p>
                <p className="text-sm text-amber-600">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search vendors or companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Vendor Cards Grid */}
      {filteredVendors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first vendor</p>
          <Button onClick={() => router.push('/super-admin/service-management/vendors/add')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <Card
              key={vendor.id}
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border-gray-200"
              onClick={() => router.push(`/super-admin/service-management/vendors/${vendor.id}`)}
            >
              {/* Header Banner */}
              <div className="h-20 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/20 hover:bg-white/40 text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/super-admin/service-management/vendors/${vendor.id}`); }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/super-admin/service-management/vendors/${vendor.id}/edit`); }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); handleDelete(vendor.id); }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <CardContent className="pt-0 relative">
                {/* Logo */}
                <div className="flex justify-between items-end -mt-8 mb-4">
                  <div className="w-16 h-16 bg-white rounded-xl shadow-md overflow-hidden flex items-center justify-center border-2 border-white">
                    {vendor.logo ? (
                      <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                        {vendor.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <Badge className={`${getCategoryColor(vendor.category)} border`}>
                    {vendor.category}
                  </Badge>
                </div>

                {/* Name & Contact */}
                <div className="space-y-2 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {vendor.name}
                  </h3>
                  {vendor.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{vendor.email}</span>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone className="h-3 w-3" />
                      <span>{vendor.phone}</span>
                    </div>
                  )}
                </div>

                {/* Linked Company */}
                {vendor.linkedCompany ? (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-xs text-green-600 font-medium mb-1">
                      <Link2 className="h-3 w-3" />
                      Linked to Event Management Company
                    </div>
                    <div className="flex items-center gap-2">
                      {vendor.linkedCompany.logo ? (
                        <img src={vendor.linkedCompany.logo} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                          {vendor.linkedCompany.name?.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-gray-900 text-sm">{vendor.linkedCompany.name}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Link2 className="h-3 w-3" />
                      Not linked to any company
                    </div>
                  </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{vendor.servicesCount || 0}</p>
                    <p className="text-xs text-gray-500">Services</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{vendor.totalBookings || 0}</p>
                    <p className="text-xs text-gray-500">Bookings</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-lg font-semibold text-gray-900">{vendor.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                </div>

                {/* View Details */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="w-full py-2 px-3 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm">
                    View Details
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
