'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Search, Package, Users, Store, Star, MapPin, Phone, Mail, ExternalLink } from 'lucide-react'

interface Provider {
  id: number
  provider_type: string
  company_name: string
  email: string
  phone?: string
  website?: string
  city?: string
  description?: string
  verification_status: string
  rating: number
  total_reviews: number
  total_bookings: number
  logo_url?: string
  categories: Array<{ category: string; subcategory?: string }>
}

export default function ProvidersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [providers, setProviders] = useState<Provider[]>([])
  const [activeTab, setActiveTab] = useState<'VENDOR' | 'SPONSOR' | 'EXHIBITOR'>('VENDOR')
  const [searchQuery, setSearchQuery] = useState('')
  const [modules, setModules] = useState({
    vendorManagement: false,
    sponsorManagement: false,
    exhibitorManagement: false
  })

  useEffect(() => {
    fetchProviders()
  }, [activeTab, searchQuery])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const tenantId = localStorage.getItem('currentTenantId')
      if (!tenantId) {
        toast({
          title: 'Error',
          description: 'No company selected',
          variant: 'destructive'
        })
        return
      }

      const params = new URLSearchParams({
        type: activeTab,
        ...(searchQuery && { search: searchQuery })
      })

      const response = await fetch(`/api/companies/${tenantId}/providers?${params}`)
      
      if (response.status === 403) {
        const data = await response.json()
        toast({
          title: 'Module Not Enabled',
          description: data.message || 'This feature is not available in your plan',
          variant: 'destructive'
        })
        setProviders([])
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch providers')
      }

      const data = await response.json()
      setProviders(data.providers)
      setModules({
        vendorManagement: data.modules?.vendorManagement || false,
        sponsorManagement: data.modules?.sponsorManagement || false,
        exhibitorManagement: data.modules?.exhibitorManagement || false
      })
    } catch (error) {
      console.error('Error fetching providers:', error)
      toast({
        title: 'Error',
        description: 'Failed to load providers',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      VERIFIED: { variant: 'default', label: 'Verified' },
      PENDING: { variant: 'secondary', label: 'Pending' },
      REJECTED: { variant: 'destructive', label: 'Rejected' },
      SUSPENDED: { variant: 'outline', label: 'Suspended' }
    }
    const config = variants[status] || variants.PENDING
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'VENDOR': return <Package className="h-5 w-5 text-blue-500" />
      case 'SPONSOR': return <Users className="h-5 w-5 text-green-500" />
      case 'EXHIBITOR': return <Store className="h-5 w-5 text-purple-500" />
      default: return <Package className="h-5 w-5" />
    }
  }

  const isModuleEnabled = () => {
    switch (activeTab) {
      case 'VENDOR': return modules.vendorManagement
      case 'SPONSOR': return modules.sponsorManagement
      case 'EXHIBITOR': return modules.exhibitorManagement
      default: return false
    }
  }

  if (!isModuleEnabled() && !loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Feature Not Available</CardTitle>
            <CardDescription>
              The {activeTab.toLowerCase()} management module is not enabled for your company
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This feature is available in the Enterprise plan. Please contact your administrator to enable this module.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Provider Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your vendors, sponsors, and exhibitors
          </p>
        </div>
        <Button onClick={() => router.push('/providers/add')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Provider
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="VENDOR" disabled={!modules.vendorManagement}>
            <Package className="mr-2 h-4 w-4" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="SPONSOR" disabled={!modules.sponsorManagement}>
            <Users className="mr-2 h-4 w-4" />
            Sponsors
          </TabsTrigger>
          <TabsTrigger value="EXHIBITOR" disabled={!modules.exhibitorManagement}>
            <Store className="mr-2 h-4 w-4" />
            Exhibitors
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab.toLowerCase()}s...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading providers...</p>
          </div>
        </div>
      ) : providers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex justify-center mb-4">
              {getProviderIcon(activeTab)}
            </div>
            <h3 className="text-lg font-semibold mb-2">No {activeTab.toLowerCase()}s found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first {activeTab.toLowerCase()}
            </p>
            <Button onClick={() => router.push('/providers/add')}>
              <Plus className="mr-2 h-4 w-4" />
              Add {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <Card 
              key={provider.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/providers/${provider.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {provider.logo_url ? (
                      <img 
                        src={provider.logo_url} 
                        alt={provider.company_name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        {getProviderIcon(provider.provider_type)}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{provider.company_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {provider.rating > 0 && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{provider.rating.toFixed(1)}</span>
                            <span>({provider.total_reviews})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(provider.verification_status)}
                </div>
              </CardHeader>
              <CardContent>
                {provider.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {provider.description}
                  </p>
                )}
                
                <div className="space-y-2 text-sm">
                  {provider.city && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{provider.city}</span>
                    </div>
                  )}
                  {provider.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{provider.email}</span>
                    </div>
                  )}
                  {provider.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{provider.phone}</span>
                    </div>
                  )}
                </div>

                {provider.categories && provider.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {provider.categories.slice(0, 2).map((cat, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {cat.category}
                      </Badge>
                    ))}
                    {provider.categories.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{provider.categories.length - 2}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-xs text-muted-foreground">
                    {provider.total_bookings} bookings
                  </span>
                  {provider.website && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={provider.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
