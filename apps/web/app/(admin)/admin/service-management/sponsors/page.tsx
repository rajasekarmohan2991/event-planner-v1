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
    Award, Plus, Search, MoreHorizontal, Edit, Trash2, Eye,
    Mail, Phone, DollarSign, Calendar, Briefcase,
    ArrowRight, ArrowLeft
} from 'lucide-react'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface SponsorPackage {
    id: string
    name: string
    tier: string
    price: number
}

interface Sponsor {
    id: string
    name: string
    industry: string | null
    website: string | null
    logo: string | null
    contactEmail: string | null
    contactPhone: string | null
    status: string
    eventId: string
    eventName: string | null
    totalPackages: number
    totalValue: number
    totalAssets: number
    packages: SponsorPackage[]
    createdAt: string
}

export default function CompanySponsorsPage() {
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
            const res = await fetch('/api/admin/service-management/sponsors')
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
        if (!confirm('Are you sure you want to remove this sponsor?')) return

        try {
            const res = await fetch(`/api/admin/service-management/sponsors/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                toast({ title: 'Sponsor removed successfully' })
                fetchSponsors()
            }
        } catch (error) {
            toast({ title: 'Failed to remove sponsor', variant: 'destructive' })
        }
    }

    const filteredSponsors = sponsors.filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.eventName?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getIndustryColor = (industry: string | null) => {
        const colors: Record<string, string> = {
            'Technology': 'bg-blue-100 text-blue-700',
            'Finance': 'bg-green-100 text-green-700',
            'Healthcare': 'bg-red-100 text-red-700',
            'Education': 'bg-purple-100 text-purple-700',
        }
        return colors[industry || ''] || 'bg-gray-100 text-gray-700'
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
                        <Award className="h-6 w-6 text-purple-600" />
                        Your Sponsors
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Sponsors for your company's events
                    </p>
                </div>
                <Button onClick={() => router.push('/admin/service-management/sponsors/add')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sponsor
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500 rounded-lg">
                                <Award className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-purple-700">{sponsors.length}</p>
                                <p className="text-sm text-purple-600">Total Sponsors</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500 rounded-lg">
                                <Briefcase className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-700">
                                    {sponsors.reduce((sum, s) => sum + (s.totalPackages || 0), 0)}
                                </p>
                                <p className="text-sm text-blue-600">Total Packages</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-500 rounded-lg">
                                <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-700">
                                    {sponsors.reduce((sum, s) => sum + (s.totalAssets || 0), 0)}
                                </p>
                                <p className="text-sm text-green-600">Total Assets</p>
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
                                    ₹{sponsors.reduce((sum, s) => sum + (s.totalValue || 0), 0).toLocaleString()}
                                </p>
                                <p className="text-sm text-amber-600">Total Value</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search sponsors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Sponsor Cards */}
            {filteredSponsors.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No sponsors yet</h3>
                        <p className="text-gray-500 mb-4">Add your first sponsor to get started</p>
                        <Button onClick={() => router.push('/admin/service-management/sponsors/add')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Sponsor
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSponsors.map((sponsor) => (
                        <Card
                            key={sponsor.id}
                            className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                            onClick={() => router.push(`/admin/service-management/sponsors/${sponsor.id}`)}
                        >
                            <div className="h-16 bg-gradient-to-r from-purple-500 to-pink-600 relative">
                                <div className="absolute top-2 right-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/20 hover:bg-white/40 text-white">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/admin/service-management/sponsors/${sponsor.id}`); }}>
                                                <Eye className="h-4 w-4 mr-2" />View
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(sponsor.id); }} className="text-red-600">
                                                <Trash2 className="h-4 w-4 mr-2" />Remove
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <CardContent className="pt-0 relative">
                                <div className="flex items-end gap-3 -mt-6 mb-4">
                                    <div className="w-12 h-12 bg-white rounded-lg shadow-md overflow-hidden flex items-center justify-center border-2 border-white">
                                        {sponsor.logo ? (
                                            <img src={sponsor.logo} alt={sponsor.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-lg font-bold">
                                                {sponsor.name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    {sponsor.industry && (
                                        <Badge className={`${getIndustryColor(sponsor.industry)} text-xs`}>
                                            {sponsor.industry}
                                        </Badge>
                                    )}
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors mb-1">
                                    {sponsor.name}
                                </h3>

                                {sponsor.eventName && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                        <Calendar className="h-3 w-3" />
                                        <span className="truncate">Event: {sponsor.eventName}</span>
                                    </div>
                                )}

                                {sponsor.contactEmail && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                        <Mail className="h-3 w-3" />
                                        <span className="truncate">{sponsor.contactEmail}</span>
                                    </div>
                                )}

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-2 py-3 mt-3 border-t border-gray-100">
                                    <div className="text-center">
                                        <p className="text-lg font-semibold text-gray-900">{sponsor.totalPackages}</p>
                                        <p className="text-xs text-gray-500">Packages</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-semibold text-gray-900">{sponsor.totalAssets}</p>
                                        <p className="text-xs text-gray-500">Assets</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-semibold text-gray-900">₹{(sponsor.totalValue / 1000).toFixed(0)}K</p>
                                        <p className="text-xs text-gray-500">Value</p>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <div className="w-full py-2 px-3 bg-gray-50 hover:bg-purple-50 text-gray-600 hover:text-purple-600 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm">
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
