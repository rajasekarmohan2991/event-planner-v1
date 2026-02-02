'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Plus, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Tenant {
  id: string
  name: string
  slug: string
  subdomain: string
  logo?: string | null
  role: string
  joinedAt: Date
}

export default function SelectTenantPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState<string | null>(null)

  useEffect(() => {
    fetchTenants()
  }, [])

  async function fetchTenants() {
    try {
      const res = await fetch('/api/tenants')
      if (res.ok) {
        const data = await res.json()
        setTenants(data.tenants || [])
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  async function selectTenant(tenantId: string) {
    setSwitching(tenantId)
    try {
      const res = await fetch('/api/user/switch-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId })
      })

      if (res.ok) {
        // Redirect to dashboard
        router.push('/dashboard')
        router.refresh()
      } else {
        alert('Failed to switch tenant')
      }
    } catch (error) {
      console.error('Failed to switch tenant:', error)
      alert('Failed to switch tenant')
    } finally {
      setSwitching(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Select Your Organization
          </h1>
          <p className="text-gray-600">
            Choose an organization to continue or create a new one
          </p>
        </div>

        {tenants.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-rose-600" />
              </div>
              <CardTitle>No Organizations Yet</CardTitle>
              <CardDescription>
                Get started by creating your first organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-rose-600 hover:bg-rose-700" 
                size="lg"
                onClick={() => router.push('/create-tenant')}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Organization
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {tenants.map((tenant) => (
                <Card 
                  key={tenant.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer hover:border-rose-200"
                  onClick={() => selectTenant(tenant.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {tenant.logo ? (
                          <img 
                            src={tenant.logo} 
                            alt={tenant.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{tenant.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {tenant.role}
                          </CardDescription>
                        </div>
                      </div>
                      {switching === tenant.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
                      ) : (
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-rose-500" />
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => router.push('/create-tenant')}
                className="hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Organization
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
