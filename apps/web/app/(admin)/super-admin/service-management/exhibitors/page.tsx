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
import { Store, Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Building2, Mail, DollarSign, CheckCircle, Clock } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface Exhibitor {
  id: string
  company_name: string
  email: string
  phone: string
  city: string
  country: string
  industry: string
  total_bookings: number
  total_revenue: number
  status: string
  created_at: string
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
      const res = await fetch(`/api/super-admin/service-management/exhibitors/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Exhibitor deleted successfully' })
        fetchExhibitors()
      }
    } catch (error) {
      toast({ title: 'Failed to delete exhibitor', variant: 'destructive' })
    }
  }

  const filteredExhibitors = exhibitors.filter(e => 
    e.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return <LoadingPage text="Loading exhibitors..." />

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <Store className="h-6 w-6 text-green-600" />
            Exhibitor Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage exhibitor companies and booth bookings</p>
        </div>
        <Button onClick={() => router.push('/super-admin/service-management/exhibitors/add')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Exhibitor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg"><Building2 className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{exhibitors.length}</p>
                <p className="text-sm text-gray-500">Total Exhibitors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg"><CheckCircle className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{exhibitors.filter(e => e.status === 'VERIFIED').length}</p>
                <p className="text-sm text-gray-500">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg"><Clock className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <p className="text-2xl font-bold">{exhibitors.reduce((sum, e) => sum + (e.total_bookings || 0), 0)}</p>
                <p className="text-sm text-gray-500">Total Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg"><DollarSign className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-2xl font-bold">${exhibitors.reduce((sum, e) => sum + (e.total_revenue || 0), 0).toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Exhibitors</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search exhibitors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredExhibitors.length === 0 ? (
            <div className="text-center py-12">
              <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No exhibitors found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first exhibitor</p>
              <Button onClick={() => router.push('/super-admin/service-management/exhibitors/add')}>
                <Plus className="h-4 w-4 mr-2" />Add Exhibitor
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExhibitors.map((exhibitor) => (
                  <TableRow key={exhibitor.id}>
                    <TableCell>
                      <div className="font-medium">{exhibitor.company_name}</div>
                      <div className="text-sm text-gray-500">{exhibitor.city}, {exhibitor.country}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3" />{exhibitor.email}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{exhibitor.industry || 'General'}</Badge></TableCell>
                    <TableCell>{exhibitor.total_bookings || 0}</TableCell>
                    <TableCell>${(exhibitor.total_revenue || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={exhibitor.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                        {exhibitor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/super-admin/service-management/exhibitors/${exhibitor.id}`)}><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/super-admin/service-management/exhibitors/${exhibitor.id}/edit`)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(exhibitor.id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
