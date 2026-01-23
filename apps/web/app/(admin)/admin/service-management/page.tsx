'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { LoadingPage } from '@/components/ui/loading-spinner'
import {
    Package, Users, Store, Plus, ArrowRight, DollarSign,
    Briefcase, Award
} from 'lucide-react'

interface VendorSummary {
    count: number
    totalServices: number
    totalRevenue: number
}

interface SponsorSummary {
    count: number
    totalPackages: number
    totalValue: number
}

interface ExhibitorSummary {
    count: number
    totalProducts: number
    totalRevenue: number
}

export default function ServiceManagementPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [vendorStats, setVendorStats] = useState<VendorSummary>({ count: 0, totalServices: 0, totalRevenue: 0 })
    const [sponsorStats, setSponsorStats] = useState<SponsorSummary>({ count: 0, totalPackages: 0, totalValue: 0 })
    const [exhibitorStats, setExhibitorStats] = useState<ExhibitorSummary>({ count: 0, totalProducts: 0, totalRevenue: 0 })

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            // Fetch vendors
            const vendorRes = await fetch('/api/admin/service-management/vendors')
            if (vendorRes.ok) {
                const data = await vendorRes.json()
                const vendors = data.vendors || []
                setVendorStats({
                    count: vendors.length,
                    totalServices: vendors.reduce((sum: number, v: any) => sum + (v.totalServices || 0), 0),
                    totalRevenue: vendors.reduce((sum: number, v: any) => sum + (v.totalRevenue || 0), 0)
                })
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <LoadingPage text="" />

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                    Service Management
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage your company's vendors, sponsors, and exhibitors
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500 rounded-lg">
                                <Package className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-700">{vendorStats.count}</p>
                                <p className="text-sm text-blue-600">Total Vendors</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500 rounded-lg">
                                <Award className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-purple-700">{sponsorStats.count}</p>
                                <p className="text-sm text-purple-600">Total Sponsors</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500 rounded-lg">
                                <Store className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-700">{exhibitorStats.count}</p>
                                <p className="text-sm text-green-600">Total Exhibitors</p>
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
                                    ₹{vendorStats.totalRevenue.toLocaleString()}
                                </p>
                                <p className="text-sm text-amber-600">Total Revenue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Management Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Vendor Management */}
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => router.push('/admin/service-management/vendors')}>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-500 transition-colors">
                                <Package className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                            </div>
                            <div>
                                <CardTitle>Vendor Management</CardTitle>
                                <CardDescription>Manage vendor companies, services, and payments</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Vendors</span>
                                <span className="font-semibold">{vendorStats.count}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Services</span>
                                <span className="font-semibold">{vendorStats.totalServices}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Revenue</span>
                                <span className="font-semibold text-green-600">₹{vendorStats.totalRevenue.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-600">Manage Vendors</span>
                            <ArrowRight className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </CardContent>
                </Card>

                {/* Sponsor Management */}
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => router.push('/admin/service-management/sponsors')}>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-500 transition-colors">
                                <Award className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors" />
                            </div>
                            <div>
                                <CardTitle>Sponsor Management</CardTitle>
                                <CardDescription>Manage sponsor companies and packages</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Sponsors</span>
                                <span className="font-semibold">{sponsorStats.count}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Packages</span>
                                <span className="font-semibold">{sponsorStats.totalPackages}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Value</span>
                                <span className="font-semibold text-green-600">₹{sponsorStats.totalValue.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t flex items-center justify-between">
                            <span className="text-sm font-medium text-purple-600">Manage Sponsors</span>
                            <ArrowRight className="h-4 w-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </CardContent>
                </Card>

                {/* Exhibitor Management */}
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={() => router.push('/admin/service-management/exhibitors')}>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-500 transition-colors">
                                <Store className="h-6 w-6 text-green-600 group-hover:text-white transition-colors" />
                            </div>
                            <div>
                                <CardTitle>Exhibitor Management</CardTitle>
                                <CardDescription>Manage exhibitor companies and booths</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Exhibitors</span>
                                <span className="font-semibold">{exhibitorStats.count}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Products</span>
                                <span className="font-semibold">{exhibitorStats.totalProducts}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Revenue</span>
                                <span className="font-semibold text-green-600">₹{exhibitorStats.totalRevenue.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t flex items-center justify-between">
                            <span className="text-sm font-medium text-green-600">Manage Exhibitors</span>
                            <ArrowRight className="h-4 w-4 text-green-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => router.push('/admin/service-management/vendors/add')}>
                            <Package className="h-5 w-5 text-blue-600" />
                            <span>Add New Vendor</span>
                        </Button>
                        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => router.push('/admin/service-management/sponsors/add')}>
                            <Award className="h-5 w-5 text-purple-600" />
                            <span>Add New Sponsor</span>
                        </Button>
                        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => router.push('/admin/service-management/exhibitors/add')}>
                            <Store className="h-5 w-5 text-green-600" />
                            <span>Add New Exhibitor</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
