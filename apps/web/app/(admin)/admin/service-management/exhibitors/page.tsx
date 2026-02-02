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
    Mail, Phone, DollarSign, Calendar, Boxes, Grid3X3,
    ArrowRight, ArrowLeft, Building2
} from 'lucide-react'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

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
    status: string
    paymentStatus: string
    boothNumber: string | null
    boothType: string | null
    eventId: string
    eventName: string | null
    totalBooths: number
    totalProducts: number
    totalRevenue: number
    products: ExhibitorProduct[]
    createdAt: string
}

export default function CompanyExhibitorsPage() {
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
            const res = await fetch('/api/admin/service-management/exhibitors')
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
        if (!confirm('Are you sure you want to remove this exhibitor?')) return

        try {
            const res = await fetch(`/api/admin/service-management/exhibitors/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                toast({ title: 'Exhibitor removed successfully' })
                fetchExhibitors()
            }
        } catch (error) {
            toast({ title: 'Failed to remove exhibitor', variant: 'destructive' })
        }
    }

    const filteredExhibitors = exhibitors.filter(e =>
        e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.eventName?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'CONFIRMED': 'bg-green-100 text-green-700',
            'PENDING_CONFIRMATION': 'bg-yellow-100 text-yellow-700',
            'PAYMENT_COMPLETED': 'bg-green-100 text-green-700',
            'CANCELLED': 'bg-red-100 text-red-700',
        }
        return colors[status] || 'bg-gray-100 text-gray-700'
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
                        <Store className="h-6 w-6 text-green-600" />
                        Your Exhibitors
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Exhibitors for your company's events
                    </p>
                </div>
                <Button onClick={() => router.push('/admin/service-management/exhibitors/add')}>
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
                                <Grid3X3 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-700">
                                    {exhibitors.reduce((sum, e) => sum + (e.totalBooths || 0), 0)}
                                </p>
                                <p className="text-sm text-blue-600">Total Booths</p>
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
                                    {exhibitors.reduce((sum, e) => sum + (e.totalProducts || 0), 0)}
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
                    placeholder="Search exhibitors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Exhibitor Cards */}
            {filteredExhibitors.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No exhibitors yet</h3>
                        <p className="text-gray-500 mb-4">Add your first exhibitor to get started</p>
                        <Button onClick={() => router.push('/admin/service-management/exhibitors/add')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Exhibitor
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredExhibitors.map((exhibitor) => (
                        <Card
                            key={exhibitor.id}
                            className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                            onClick={() => router.push(`/admin/service-management/exhibitors/${exhibitor.id}`)}
                        >
                            <div className="h-16 bg-gradient-to-r from-green-500 to-teal-600 relative">
                                {exhibitor.boothNumber && (
                                    <div className="absolute bottom-2 left-3">
                                        <Badge className="bg-white/90 text-green-700 border-0 text-xs">
                                            <Grid3X3 className="h-3 w-3 mr-1" />
                                            Booth {exhibitor.boothNumber}
                                        </Badge>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/20 hover:bg-white/40 text-white">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/service-management/exhibitors/${exhibitor.id}`); }}>
                                                <Eye className="h-4 w-4 mr-2" />View
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(exhibitor.id); }} className="text-red-600">
                                                <Trash2 className="h-4 w-4 mr-2" />Remove
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <CardContent className="pt-0 relative">
                                <div className="flex items-end gap-3 -mt-6 mb-4">
                                    <div className="w-12 h-12 bg-white rounded-lg shadow-md overflow-hidden flex items-center justify-center border-2 border-white">
                                        <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-lg font-bold">
                                            {exhibitor.name?.charAt(0)}
                                        </div>
                                    </div>
                                    <Badge className={`${getStatusColor(exhibitor.status)} text-xs`}>
                                        {exhibitor.status?.replace(/_/g, ' ') || 'Pending'}
                                    </Badge>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors mb-1">
                                    {exhibitor.name}
                                </h3>

                                {exhibitor.company && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                        <Building2 className="h-3 w-3" />
                                        <span className="truncate">{exhibitor.company}</span>
                                    </div>
                                )}

                                {exhibitor.eventName && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                        <Calendar className="h-3 w-3" />
                                        <span className="truncate">Event: {exhibitor.eventName}</span>
                                    </div>
                                )}

                                {exhibitor.contactEmail && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                        <Mail className="h-3 w-3" />
                                        <span className="truncate">{exhibitor.contactEmail}</span>
                                    </div>
                                )}

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-2 py-3 mt-3 border-t border-gray-100">
                                    <div className="text-center">
                                        <p className="text-lg font-semibold text-gray-900">{exhibitor.totalBooths}</p>
                                        <p className="text-xs text-gray-500">Booths</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-semibold text-gray-900">{exhibitor.totalProducts}</p>
                                        <p className="text-xs text-gray-500">Products</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-semibold text-gray-900">₹{(exhibitor.totalRevenue / 1000).toFixed(0)}K</p>
                                        <p className="text-xs text-gray-500">Revenue</p>
                                    </div>
                                </div>

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
