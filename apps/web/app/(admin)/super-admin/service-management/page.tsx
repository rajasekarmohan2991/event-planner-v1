'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Users, Store, ArrowRight, TrendingUp, DollarSign, Building2 } from 'lucide-react'

export default function ServiceManagementPage() {
  const router = useRouter()

  const modules = [
    {
      title: 'Vendor Management',
      description: 'Manage vendor companies, services, rates, and payments',
      icon: Package,
      href: '/super-admin/service-management/vendors',
      color: 'bg-blue-500',
      stats: { label: 'Total Vendors', value: '0' }
    },
    {
      title: 'Sponsor Management',
      description: 'Manage sponsor companies, packages, and sponsorship deals',
      icon: Users,
      href: '/super-admin/service-management/sponsors',
      color: 'bg-purple-500',
      stats: { label: 'Total Sponsors', value: '0' }
    },
    {
      title: 'Exhibitor Management',
      description: 'Manage exhibitor companies, booths, and booth bookings',
      icon: Store,
      href: '/super-admin/service-management/exhibitors',
      color: 'bg-green-500',
      stats: { label: 'Total Exhibitors', value: '0' }
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <Building2 className="h-6 w-6" />
            Service Management Portal
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage vendors, sponsors, and exhibitors across the platform
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-500">Total Vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-500">Total Sponsors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Store className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-gray-500">Total Exhibitors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">$0</p>
                <p className="text-sm text-gray-500">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Card 
            key={module.title}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
            onClick={() => router.push(module.href)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className={`p-3 ${module.color} rounded-lg`}>
                  <module.icon className="h-6 w-6 text-white" />
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
              </div>
              <CardTitle className="mt-4">{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-gray-500">{module.stats.label}</span>
                <span className="text-lg font-semibold">{module.stats.value}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => router.push('/super-admin/service-management/vendors/add')}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <Package className="h-5 w-5 text-blue-500 mb-2" />
              <p className="font-medium">Add New Vendor</p>
              <p className="text-sm text-gray-500">Register a new vendor company</p>
            </button>
            <button 
              onClick={() => router.push('/super-admin/service-management/sponsors/add')}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <Users className="h-5 w-5 text-purple-500 mb-2" />
              <p className="font-medium">Add New Sponsor</p>
              <p className="text-sm text-gray-500">Register a new sponsor company</p>
            </button>
            <button 
              onClick={() => router.push('/super-admin/service-management/exhibitors/add')}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
            >
              <Store className="h-5 w-5 text-green-500 mb-2" />
              <p className="font-medium">Add New Exhibitor</p>
              <p className="text-sm text-gray-500">Register a new exhibitor company</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
