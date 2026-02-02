'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle, Download, CreditCard } from 'lucide-react'

export default function InvoicePaymentPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const invoiceId = params?.id as string
    const token = searchParams?.get('token')

    const [loading, setLoading] = useState(true)
    const [invoice, setInvoice] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        if (invoiceId) {
            loadInvoice()
        }
    }, [invoiceId])

    const loadInvoice = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/public/invoices/${invoiceId}?token=${token || ''}`)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to load invoice')
            }

            const data = await response.json()
            setInvoice(data.invoice)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handlePayment = async (method: 'RAZORPAY' | 'STRIPE') => {
        try {
            setProcessing(true)

            // Create payment session
            const response = await fetch(`/api/public/invoices/${invoiceId}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method, token })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to initiate payment')
            }

            const data = await response.json()

            // Redirect to payment gateway or handle payment
            if (data.paymentUrl) {
                window.location.href = data.paymentUrl
            } else if (data.checkoutSessionId) {
                // Handle Stripe checkout
                const stripe = (window as any).Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
                await stripe.redirectToCheckout({ sessionId: data.checkoutSessionId })
            }

        } catch (err: any) {
            alert(err.message)
        } finally {
            setProcessing(false)
        }
    }

    const downloadInvoice = () => {
        window.open(`/api/events/${invoice.eventId}/invoices/${invoiceId}/download`, '_blank')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full border-red-200">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-6 w-6" />
                            <CardTitle>Error</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700">{error}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!invoice) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6">
                        <p className="text-center text-gray-500">Invoice not found</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const isPaid = invoice.status === 'PAID'

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Invoice Payment</h1>
                    <p className="text-gray-600 mt-2">{invoice.eventName}</p>
                </div>

                {/* Invoice Details Card */}
                <Card className="border-2">
                    <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl">Invoice #{invoice.invoiceNumber}</CardTitle>
                                <CardDescription className="text-gray-300 mt-1">
                                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                                </CardDescription>
                            </div>
                            <Badge
                                variant={isPaid ? "default" : "secondary"}
                                className={isPaid ? "bg-green-500" : "bg-yellow-500"}
                            >
                                {isPaid ? (
                                    <><CheckCircle2 className="h-4 w-4 mr-1" /> PAID</>
                                ) : (
                                    'PENDING'
                                )}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {/* Bill To */}
                        <div>
                            <h3 className="font-semibold text-sm text-gray-500 uppercase mb-2">Bill To</h3>
                            <p className="font-medium text-lg">{invoice.payerName}</p>
                            {invoice.payerCompany && <p className="text-gray-600">{invoice.payerCompany}</p>}
                            <p className="text-gray-600">{invoice.payerEmail}</p>
                            {invoice.payerPhone && <p className="text-gray-600">{invoice.payerPhone}</p>}
                        </div>

                        {/* Line Items */}
                        <div>
                            <h3 className="font-semibold text-sm text-gray-500 uppercase mb-3">Items</h3>
                            <div className="space-y-2">
                                {invoice.items.map((item: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center py-2 border-b">
                                        <div>
                                            <p className="font-medium">{item.description}</p>
                                            <p className="text-sm text-gray-500">
                                                {item.quantity} × ₹{item.unitPrice.toLocaleString()}
                                            </p>
                                        </div>
                                        <p className="font-semibold">₹{item.amount.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between text-gray-700">
                                <span>Subtotal</span>
                                <span>₹{invoice.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                                <span>Tax ({invoice.taxRate}%)</span>
                                <span>₹{invoice.tax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t-2">
                                <span>Total Amount</span>
                                <span>₹{invoice.total.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Payment Info (if paid) */}
                        {isPaid && invoice.paymentDate && (
                            <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
                                <div className="flex items-center gap-2 text-green-800 mb-2">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <h3 className="font-semibold">Payment Received</h3>
                                </div>
                                <div className="text-sm text-green-700 space-y-1">
                                    <p><strong>Date:</strong> {new Date(invoice.paymentDate).toLocaleDateString()}</p>
                                    {invoice.paymentMethod && <p><strong>Method:</strong> {invoice.paymentMethod}</p>}
                                    {invoice.paymentReference && <p><strong>Reference:</strong> {invoice.paymentReference}</p>}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={downloadInvoice}
                                className="flex-1"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download Invoice
                            </Button>

                            {!isPaid && (
                                <Button
                                    onClick={() => handlePayment('RAZORPAY')}
                                    disabled={processing}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                >
                                    {processing ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                                    ) : (
                                        <><CreditCard className="h-4 w-4 mr-2" /> Pay Now</>
                                    )}
                                </Button>
                            )}
                        </div>

                        {invoice.notes && (
                            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-900">
                                <h3 className="font-semibold text-sm text-gray-700 mb-1">Notes</h3>
                                <p className="text-sm text-gray-600">{invoice.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center text-sm text-gray-600">
                    <p>For any questions, contact us at billing@ayphen.com</p>
                    <p className="mt-1">© 2025 Ayphen Event Planner. All rights reserved.</p>
                </div>
            </div>
        </div>
    )
}
