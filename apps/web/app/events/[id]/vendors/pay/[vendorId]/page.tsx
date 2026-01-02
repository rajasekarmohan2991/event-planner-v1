'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, ArrowLeft } from 'lucide-react'

interface Vendor {
    id: string
    name: string
    category: string
    contractAmount: number
    paidAmount: number
    bankName?: string
    accountNumber?: string
    ifscCode?: string
    accountHolderName?: string
    upiId?: string
}

export default function VendorPaymentPage() {
    const params = useParams()
    const router = useRouter()
    const [vendor, setVendor] = useState<Vendor | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchVendor()
    }, [])

    const fetchVendor = async () => {
        try {
            const res = await fetch(`/api/events/${params.id}/vendors`)
            const data = await res.json()
            const foundVendor = data.vendors?.find((v: Vendor) => v.id === params.vendorId)
            setVendor(foundVendor || null)
        } catch (error) {
            console.error('Failed to fetch vendor:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>
    }

    if (!vendor) {
        return <div className="p-8 text-center">Vendor not found</div>
    }

    const remainingAmount = (vendor.contractAmount || 0) - (vendor.paidAmount || 0)

    return (
        <div className="container max-w-4xl mx-auto p-6">
            <Button variant="ghost" onClick={() => router.push(`/events/${params.id}/vendors`)} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Vendors
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Vendor Payment - {vendor.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Payment Summary */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Contract Amount:</span>
                                <span className="font-semibold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(vendor.contractAmount)}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                                <span>Paid Amount:</span>
                                <span className="font-semibold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(vendor.paidAmount || 0)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-red-600 border-t pt-2">
                                <span>Remaining Amount:</span>
                                <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(remainingAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bank Details */}
                    {(vendor.bankName || vendor.accountNumber || vendor.upiId) && (
                        <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                            <h3 className="text-lg font-semibold mb-4 text-green-800">🏦 Vendor Bank Details</h3>
                            <div className="space-y-2 text-sm">
                                {vendor.bankName && (
                                    <div><span className="text-gray-600">Bank Name:</span> <span className="ml-2 font-semibold">{vendor.bankName}</span></div>
                                )}
                                {vendor.accountHolderName && (
                                    <div><span className="text-gray-600">Account Holder:</span> <span className="ml-2 font-semibold">{vendor.accountHolderName}</span></div>
                                )}
                                {vendor.accountNumber && (
                                    <div><span className="text-gray-600">Account Number:</span> <span className="ml-2 font-mono font-semibold">{vendor.accountNumber}</span></div>
                                )}
                                {vendor.ifscCode && (
                                    <div><span className="text-gray-600">IFSC Code:</span> <span className="ml-2 font-mono font-semibold">{vendor.ifscCode}</span></div>
                                )}
                                {vendor.upiId && (
                                    <div><span className="text-gray-600">UPI ID:</span> <span className="ml-2 font-mono font-semibold">{vendor.upiId}</span></div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <Button className="flex-1" size="lg">
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Mark as Paid
                        </Button>
                        <Button variant="outline" className="flex-1" size="lg">
                            Record Partial Payment
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
