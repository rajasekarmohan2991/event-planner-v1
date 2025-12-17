'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard, Download, CheckCircle, AlertCircle } from 'lucide-react'

export default function BillingPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Billing & Subscription</h1>
                <Button>Manage Subscription</Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Current Plan */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Current Plan
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200">
                                Enterprise
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-semibold text-lg">₹24,999 / year</p>
                                <p className="text-sm text-gray-500">Next billing date: December 17, 2026</p>
                            </div>
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                <CheckCircle className="w-3 h-3 mr-1" /> Active
                            </Badge>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <h4 className="text-sm font-medium mb-3">Plan Features</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Unlimited Events</div>
                                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Advanced Analytics</div>
                                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Priority Support</div>
                                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Custom Domain</div>
                                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> 10 Admin Users</div>
                                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> White-labeling</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Payment Method</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                            <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-600">VISA</div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">•••• 4242</p>
                                <p className="text-xs text-gray-500">Expires 12/28</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                            Update Payment Method
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Invoice History */}
            <Card>
                <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <div className="grid grid-cols-4 gap-4 p-4 border-b font-medium text-sm bg-gray-50 text-gray-500">
                            <div>Date</div>
                            <div>Amount</div>
                            <div>Status</div>
                            <div className="text-right">Invoice</div>
                        </div>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="grid grid-cols-4 gap-4 p-4 text-sm border-b last:border-0 hover:bg-gray-50">
                                <div className="flex items-center">Dec {17 - i}, 2025</div>
                                <div className="flex items-center">₹24,999.00</div>
                                <div className="flex items-center">
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">Paid</Badge>
                                </div>
                                <div className="flex items-center justify-end">
                                    <Button variant="ghost" size="sm" className="h-8 gap-1">
                                        <Download className="w-3 h-3" /> PDF
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
