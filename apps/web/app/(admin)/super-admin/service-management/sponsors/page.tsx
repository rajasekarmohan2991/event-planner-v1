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
import { Users, Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Building2, Mail, DollarSign, CheckCircle, Clock } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface Sponsor {
  id: string
  company_name: string
  email: string
  phone: string
  city: string
  country: string
  tier: string
  total_deals: number
  total_amount: number
  status: string
  created_at: string
}

export default function SponsorManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchSponsors()
  }, [])

  const fetchSponsors = async () => {
    try {
      const res = await fetch('/api/super-admin/service-management/sponsors')
      if (res.ok) {
        const data = await res.json()
        setSponsors(data.sponsors || [])
      }
    } catch (error) {
      console.error('Failed to fetch sponsors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sponsor?')) return
    try {
      const res = await fetch(`/api/super-admin/service-management/sponsors/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Sponsor deleted successfully' })
        fetchSponsors()
      }
    } catch (error) {
      toast({ title: 'Failed to delete sponsor', variant: 'destructive' })
    }
  }

  const filteredSponsors = sponsors.filter(s => 
    s.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      'TITLE': 'bg-purple-100 text-purple-700',
      'PLATINUM': 'bg-gray-100 text-gray-700',
      'GOLD': 'bg-yellow-100 text-yellow-700',
      'SILVER': 'bg-gray-200 text-gray-600',
      'BRONZE': 'bg-orange-100 text-orange-700'
    }
    return <Badge className={colors[tier] || 'bg-gray-100'}>{tier || 'Standard'}</Badge>
  }

  if (loading) return <LoadingPage text="Loading sponsors..." />

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <Users className="h-6 w-6 text-purple-600" />
            Sponsor Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage sponsor companies and sponsorship packages</p>
        </div>
        <Button onClick={() => router.push('/super-admin/service-management/sponsors/add')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Sponsor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg"><Building2 className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold">{sponsors.length}</p>
                <p className="text-sm text-gray-500">Total Sponsors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{sponsors.filter(s => s.status === 'VERIFIED').length}</p>
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
                <p className="text-2xl font-bold">{sponsors.reduce((sum, s) => sum + (s.total_deals || 0), 0)}</p>
                <p className="text-sm text-gray-500">Total Deals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg"><DollarSign className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-2xl font-bold">${sponsors.reduce((sum, s) => sum + (s.total_amount || 0), 0).toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Sponsors</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search sponsors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSponsors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sponsors found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first sponsor</p>
              <Button onClick={() => router.push('/super-admin/service-management/sponsors/add')}>
                <Plus className="h-4 w-4 mr-2" />Add Sponsor
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Deals</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSponsors.map((sponsor) => (
                  <TableRow key={sponsor.id}>
                    <TableCell>
                      <div className="font-medium">{sponsor.company_name}</div>
                      <div className="text-sm text-gray-500">{sponsor.city}, {sponsor.country}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3" />{sponsor.email}</div>
                    </TableCell>
                    <TableCell>{getTierBadge(sponsor.tier)}</TableCell>
                    <TableCell>{sponsor.total_deals || 0}</TableCell>
                    <TableCell>${(sponsor.total_amount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={sponsor.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                        {sponsor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/super-admin/service-management/sponsors/${sponsor.id}`)}><Eye className="h-4 w-4 mr-2" />View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/super-admin/service-management/sponsors/${sponsor.id}/edit`)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(sponsor.id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
