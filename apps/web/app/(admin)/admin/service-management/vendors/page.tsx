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
    Mail, Phone, DollarSign, Star, Briefcase,
    ArrowRight, ArrowLeft
} from 'lucide-react'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

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
    logo: string | null
    rating: number
    reviewCount: number
    totalServices: number
    totalPackages: number
    totalBookings: number
    totalRevenue: number
    services: VendorService[]
    createdAt: string
}

export default function CompanyVendorsPage() {
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
            const res = await fetch('/api/admin/service-management/vendors')
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
        if (!confirm('Are you sure you want to remove this vendor?')) return

        try {
            const res = await fetch(`/api/admin/service-management/vendors/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                toast({ title: 'Vendor removed successfully' })
                fetchVendors()
            }
        } catch (error) {
            toast({ title: 'Failed to remove vendor', variant: 'destructive' })
        }
    }

    const filteredVendors = vendors.filter(v =>
        v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'Catering': 'bg-orange-100 text-orange-700 border-orange-200',
            'Audio/Visual': 'bg-blue-100 text-blue-700 border-blue-200',
            'Decoration': 'bg-pink-100 text-pink-700 border-pink-200',
            'Photography': 'bg-purple-100 text-purple-700 border-purple-200',
        }
        return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200'
    }

    if (loading) return <LoadingPage text="" />

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => router.push('/admin/service-management')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                        <Package className="h-6 w-6 text-blue-600" />
                        Your Vendors
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Vendors registered for your company's events
                    </p>
                </div>
                <Button onClick={() => router.push('/admin/service-management/vendors/add')}>
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
                                <Package className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-700">{vendors.length}</p>
                                <p className="text-sm text-blue-600">Total Vendors</p>
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
                                    {vendors.reduce((sum, v) => sum + (v.totalServices || 0), 0)}
                                </p>
                                <p className="text-sm text-purple-600">Total Services</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500 rounded-lg">
                                <Star className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-700">
                                    {vendors.reduce((sum, v) => sum + (v.totalBookings || 0), 0)}
                                </p>
                                <p className="text-sm text-green-600">Total Bookings</p>
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
                                <p className="text-sm text-amber-600">Total Spent</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search vendors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Vendor Cards */}
            {filteredVendors.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No vendors yet</h3>
                        <p className="text-gray-500 mb-4">Add your first vendor to get started</p>
                        <Button onClick={() => router.push('/admin/service-management/vendors/add')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Vendor
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVendors.map((vendor) => (
                        <Card
                            key={vendor.id}
                            className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                            onClick={() => router.push(`/admin/service-management/vendors/${vendor.id}`)}
                        >
                            <div className="h-16 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                                <div className="absolute top-2 right-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/20 hover:bg-white/40 text-white">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/service-management/vendors/${vendor.id}`); }}>
                                                <Eye className="h-4 w-4 mr-2" />View
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(vendor.id); }} className="text-red-600">
                                                <Trash2 className="h-4 w-4 mr-2" />Remove
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <CardContent className="pt-0 relative">
                                <div className="flex items-end gap-3 -mt-6 mb-4">
                                    <div className="w-12 h-12 bg-white rounded-lg shadow-md overflow-hidden flex items-center justify-center border-2 border-white">
                                        {vendor.logo ? (
                                            <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold">
                                                {vendor.name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <Badge className={`${getCategoryColor(vendor.category)} border text-xs`}>
                                        {vendor.category}
                                    </Badge>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                                    {vendor.name}
                                </h3>

                                {vendor.email && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                        <Mail className="h-3 w-3" />
                                        <span className="truncate">{vendor.email}</span>
                                    </div>
                                )}

                                {/* Services Preview */}
                                {vendor.services.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {vendor.services.map(s => (
                                            <Badge key={s.id} variant="outline" className="text-xs">
                                                {s.name}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-2 py-3 mt-3 border-t border-gray-100">
                                    <div className="text-center">
                                        <p className="text-lg font-semibold text-gray-900">{vendor.totalServices}</p>
                                        <p className="text-xs text-gray-500">Services</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-semibold text-gray-900">{vendor.totalBookings}</p>
                                        <p className="text-xs text-gray-500">Bookings</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                            <span className="text-lg font-semibold">{vendor.rating?.toFixed(1) || 'N/A'}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">Rating</p>
                                    </div>
                                </div>

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
