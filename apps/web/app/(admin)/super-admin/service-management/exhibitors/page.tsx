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
  Store, Plus, Search, MoreHorizontal, Edit, Trash2, Eye,
  Building2, Mail, Phone, DollarSign, Boxes, Grid3X3,
  ArrowRight, Link2, MapPin
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

interface ExhibitorProduct {
  id: string
  name: string
  category: string | null
}

interface Exhibitor {
  id: string
  name: string
  company: string | null
  contactEmail: string | null
  contactPhone: string | null
  website: string | null
  companyDescription: string | null
  status: string
  paymentStatus: string
  boothNumber: string | null
  boothType: string | null
  eventId: string
  boothsCount: number
  productsCount: number
  totalRevenue: number
  linkedCompany: LinkedCompany | null
  products: ExhibitorProduct[]
  createdAt: string
}

export default function ExhibitorManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchExhibitors()
  }, [])

  const fetchExhibitors = async () => {
    try {
      const res = await fetch('/api/super-admin/service-management/exhibitors')
      if (res.ok) {
        const data = await res.json()
        setExhibitors(data.exhibitors || [])
      }
    } catch (error) {
      console.error('Failed to fetch exhibitors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exhibitor?')) return

    try {
      const res = await fetch(`/api/super-admin/service-management/exhibitors/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast({ title: 'Exhibitor deleted successfully' })
        fetchExhibitors()
      }
    } catch (error) {
      toast({ title: 'Failed to delete exhibitor', variant: 'destructive' })
    }
  }

  const filteredExhibitors = exhibitors.filter(e =>
    e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.linkedCompany?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'CONFIRMED': 'bg-green-100 text-green-700 border-green-200',
      'PAYMENT_COMPLETED': 'bg-green-100 text-green-700 border-green-200',
      'PENDING_CONFIRMATION': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'AWAITING_APPROVAL': 'bg-blue-100 text-blue-700 border-blue-200',
      'PAYMENT_PENDING': 'bg-orange-100 text-orange-700 border-orange-200',
      'REJECTED': 'bg-red-100 text-red-700 border-red-200',
      'CANCELLED': 'bg-gray-100 text-gray-700 border-gray-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
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
            <Store className="h-6 w-6 text-green-600" />
            Exhibitor Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage exhibitor companies and their linked events
          </p>
        </div>
        <Button onClick={() => router.push('/super-admin/service-management/exhibitors/add')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Exhibitor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-lg">
                <Store className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{exhibitors.length}</p>
                <p className="text-sm text-green-600">Total Exhibitors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Link2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">
                  {exhibitors.filter(e => e.linkedCompany).length}
                </p>
                <p className="text-sm text-blue-600">Linked to Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500 rounded-lg">
                <Boxes className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">
                  {exhibitors.reduce((sum, e) => sum + (e.productsCount || 0), 0)}
                </p>
                <p className="text-sm text-purple-600">Total Products</p>
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
                  ₹{exhibitors.reduce((sum, e) => sum + (e.totalRevenue || 0), 0).toLocaleString()}
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
          placeholder="Search exhibitors or companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Exhibitor Cards Grid */}
      {filteredExhibitors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No exhibitors found</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first exhibitor</p>
          <Button onClick={() => router.push('/super-admin/service-management/exhibitors/add')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Exhibitor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExhibitors.map((exhibitor) => (
            <Card
              key={exhibitor.id}
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border-gray-200"
              onClick={() => router.push(`/super-admin/service-management/exhibitors/${exhibitor.id}`)}
            >
              {/* Header Banner */}
              <div className="h-20 bg-gradient-to-r from-green-500 to-teal-600 relative">
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/20 hover:bg-white/40 text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/super-admin/service-management/exhibitors/${exhibitor.id}`); }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/super-admin/service-management/exhibitors/${exhibitor.id}/edit`); }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); handleDelete(exhibitor.id); }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {/* Booth Badge */}
                {exhibitor.boothNumber && (
                  <div className="absolute bottom-2 left-3">
                    <Badge className="bg-white/90 text-green-700 border-0">
                      <Grid3X3 className="h-3 w-3 mr-1" />
                      Booth {exhibitor.boothNumber}
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="pt-0 relative">
                {/* Logo */}
                <div className="flex justify-between items-end -mt-8 mb-4">
                  <div className="w-16 h-16 bg-white rounded-xl shadow-md overflow-hidden flex items-center justify-center border-2 border-white">
                    <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold">
                      {exhibitor.name?.charAt(0)}
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(exhibitor.status)} border`}>
                    {exhibitor.status?.replace(/_/g, ' ') || 'Pending'}
                  </Badge>
                </div>

                {/* Name & Contact */}
                <div className="space-y-2 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                    {exhibitor.name}
                  </h3>
                  {exhibitor.company && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate">{exhibitor.company}</span>
                    </div>
                  )}
                  {exhibitor.contactEmail && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{exhibitor.contactEmail}</span>
                    </div>
                  )}
                </div>

                {/* Linked Company */}
                {exhibitor.linkedCompany ? (
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-xs text-green-600 font-medium mb-1">
                      <Link2 className="h-3 w-3" />
                      Linked to Event Management Company
                    </div>
                    <div className="flex items-center gap-2">
                      {exhibitor.linkedCompany.logo ? (
                        <img src={exhibitor.linkedCompany.logo} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                          {exhibitor.linkedCompany.name?.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-gray-900 text-sm">{exhibitor.linkedCompany.name}</span>
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
                    <p className="text-lg font-semibold text-gray-900">{exhibitor.boothsCount || 0}</p>
                    <p className="text-xs text-gray-500">Booths</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{exhibitor.productsCount || 0}</p>
                    <p className="text-xs text-gray-500">Products</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">₹{(exhibitor.totalRevenue || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                </div>

                {/* View Details */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="w-full py-2 px-3 bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-600 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm">
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
