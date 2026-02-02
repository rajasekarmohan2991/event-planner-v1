'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { Package, Users, Store, ArrowRight, Lock, AlertCircle } from 'lucide-react'

interface ModuleSettings {
  module_vendor_management: boolean
  module_sponsor_management: boolean
  module_exhibitor_management: boolean
}

export default function CompanyServiceManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [modules, setModules] = useState<ModuleSettings | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchModuleSettings()
  }, [])

  const fetchModuleSettings = async () => {
    try {
      const res = await fetch('/api/company/info')
      if (res.ok) {
        const data = await res.json()
        setModules({
          module_vendor_management: data.module_vendor_management || false,
          module_sponsor_management: data.module_sponsor_management || false,
          module_exhibitor_management: data.module_exhibitor_management || false
        })
      } else {
        setError('Failed to load module settings')
      }
    } catch (err) {
      setError('Failed to load module settings')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingPage text="Loading service management..." />
  }

  const hasAnyModule = modules?.module_vendor_management || 
                       modules?.module_sponsor_management || 
                       modules?.module_exhibitor_management

  if (!hasAnyModule) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="p-4 bg-amber-100 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <Lock className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Service Management Not Available</h2>
            <p className="text-gray-600 mb-6">
              Your company does not have access to service management modules. 
              Please contact your administrator to enable vendor, sponsor, or exhibitor management.
            </p>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const availableModules = [
    {
      title: 'Vendor Management',
      description: 'Manage vendor companies for your events',
      icon: Package,
      href: '/service-management/vendors',
      color: 'bg-blue-500',
      enabled: modules?.module_vendor_management
    },
    {
      title: 'Sponsor Management',
      description: 'Manage sponsors and sponsorship deals',
      icon: Users,
      href: '/service-management/sponsors',
      color: 'bg-purple-500',
      enabled: modules?.module_sponsor_management
    },
    {
      title: 'Exhibitor Management',
      description: 'Manage exhibitors and booth bookings',
      icon: Store,
      href: '/service-management/exhibitors',
      color: 'bg-green-500',
      enabled: modules?.module_exhibitor_management
    }
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Service Management</h1>
        <p className="text-gray-600 mt-2">
          Manage vendors, sponsors, and exhibitors for your events
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {availableModules.map((module) => (
          <Card 
            key={module.title}
            className={`cursor-pointer transition-all duration-200 ${
              module.enabled 
                ? 'hover:shadow-lg group' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={() => module.enabled && router.push(module.href)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className={`p-3 ${module.color} rounded-lg`}>
                  <module.icon className="h-6 w-6 text-white" />
                </div>
                {module.enabled ? (
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                ) : (
                  <Lock className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <CardTitle className="mt-4">{module.title}</CardTitle>
              <CardDescription>
                {module.enabled ? module.description : 'Module not enabled'}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
