'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, CheckCircle, AlertCircle, CreditCard } from 'lucide-react'

export default function BillingSettings() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight text-gray-900">Billing & Subscription</h2>
                <Button>Manage Subscription</Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Current Plan */}
                <Card className="lg:col-span-2 shadow-sm border-gray-200">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            Current Plan
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200 shadow-none">
                                Enterprise
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-bold text-2xl text-gray-900">₹24,999 <span className="text-sm font-normal text-gray-500">/ year</span></p>
                                <p className="text-sm text-gray-500 mt-1">Next billing date: <span className="font-medium text-gray-700">December 17, 2026</span></p>
                            </div>
                            <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50 px-3 py-1">
                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Active
                            </Badge>
                        </div>

                        <div className="pt-5 mt-2 border-t border-gray-100">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Plan Features</h4>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm text-gray-700">
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
                <Card className="shadow-sm border-gray-200">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold">Payment Method</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-4 border rounded-xl bg-gray-50/50">
                            <div className="w-12 h-8 bg-white border rounded shadow-sm flex items-center justify-center">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3 object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">•••• 4242</p>
                                <p className="text-xs text-gray-500">Expires 12/28</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full h-9">
                            Update Payment Method
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Invoice History */}
            <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-0 mb-4">
                    <CardTitle className="text-base font-semibold">Invoice History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-xl border overflow-hidden">
                        <div className="grid grid-cols-4 gap-4 p-4 border-b font-medium text-xs uppercase tracking-wide bg-gray-50 text-gray-500">
                            <div>Date</div>
                            <div>Amount</div>
                            <div>Status</div>
                            <div className="text-right">Invoice</div>
                        </div>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="grid grid-cols-4 gap-4 p-4 text-sm border-b last:border-0 hover:bg-gray-50/80 transition-colors">
                                <div className="flex items-center font-medium text-gray-900">Dec {17 - i}, 2025</div>
                                <div className="flex items-center text-gray-600">₹24,999.00</div>
                                <div className="flex items-center">
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-0">Paid</Badge>
                                </div>
                                <div className="flex items-center justify-end">
                                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-gray-600 hover:text-indigo-600">
                                        <Download className="w-3.5 h-3.5" /> PDF
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
