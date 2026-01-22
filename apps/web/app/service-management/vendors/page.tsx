'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { Package, Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Building2, Mail, Phone, Star, CheckCircle, Clock, Lock } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface Vendor {
  id: string
  company_name: string
  email: string
  phone: string
  city: string
  country: string
  category: string
  services_count: number
  avg_rating: number
  total_bookings: number
  status: string
}

export default function CompanyVendorManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [moduleEnabled, setModuleEnabled] = useState(false)

  useEffect(() => {
    checkModuleAndFetch()
  }, [])

  const checkModuleAndFetch = async () => {
    try {
      // Check if module is enabled
      const infoRes = await fetch('/api/company/info')
      if (infoRes.ok) {
        const data = await infoRes.json()
        if (!data.module_vendor_management) {
          setModuleEnabled(false)
          setLoading(false)
          return
        }
        setModuleEnabled(true)
      }

      // Fetch vendors for this company
      const res = await fetch('/api/company/service-management/vendors')
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
      const res = await fetch(`/api/company/service-management/vendors/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Vendor deleted successfully' })
        checkModuleAndFetch()
      }
    } catch (error) {
      toast({ title: 'Failed to delete vendor', variant: 'destructive' })
    }
  }

  if (loading) return <LoadingPage text="Loading vendors..." />

  if (!moduleEnabled) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="p-4 bg-amber-100 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <Lock className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Vendor Management Not Enabled</h2>
            <p className="text-gray-600 mb-6">
              This module is not enabled for your company. Contact your administrator.
            </p>
            <Button variant="outline" onClick={() => router.push('/service-management')}>
              Back to Service Management
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredVendors = vendors.filter(v => 
    v.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            Vendor Management
          </h1>
          <p className="text-gray-600 mt-2">Manage vendors for your events</p>
        </div>
        <Button onClick={() => router.push('/service-management/vendors/add')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vendors.length}</p>
                <p className="text-sm text-gray-500">Total Vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vendors.filter(v => v.status === 'VERIFIED').length}</p>
                <p className="text-sm text-gray-500">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vendors.filter(v => v.status === 'PENDING').length}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Vendors</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search vendors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredVendors.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
              <p className="text-gray-500 mb-4">Add your first vendor to get started</p>
              <Button onClick={() => router.push('/service-management/vendors/add')}>
                <Plus className="h-4 w-4 mr-2" />Add Vendor
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <div className="font-medium">{vendor.company_name}</div>
                      <div className="text-sm text-gray-500">{vendor.city}, {vendor.country}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3" />{vendor.email}</div>
                      {vendor.phone && <div className="flex items-center gap-1 text-sm text-gray-500"><Phone className="h-3 w-3" />{vendor.phone}</div>}
                    </TableCell>
                    <TableCell><Badge variant="outline">{vendor.category || 'General'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        {vendor.avg_rating?.toFixed(1) || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={vendor.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                        {vendor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/service-management/vendors/${vendor.id}`)}><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/service-management/vendors/${vendor.id}/edit`)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(vendor.id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
