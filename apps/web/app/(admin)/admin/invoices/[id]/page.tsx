"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Download,
    Mail,
    DollarSign,
    Loader2,
    FileText,
    Calendar,
    User,
    Building,
    CreditCard,
    CheckCircle,
    Clock,
    Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/ui/back-button";
import { generateInvoiceHTML, InvoiceData } from "@/lib/invoice-html";

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const invoiceId = Array.isArray(params?.id) ? params.id[0] : params?.id as string;

    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    useEffect(() => {
        if (invoiceId) loadInvoice();
    }, [invoiceId]);

    async function loadInvoice() {
        try {
            const res = await fetch(`/api/invoices/${invoiceId}`);
            if (res.ok) {
                const data = await res.json();
                setInvoice(data.invoice);
            }
        } catch (error) {
            console.error("Failed to load invoice:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleDownloadPDF() {
        if (!invoice) return;

        // Prepare data for invoice generator
        const invoiceData: InvoiceData = {
            invoiceNumber: invoice.number,
            invoiceDate: new Date(invoice.date),
            dueDate: new Date(invoice.dueDate),
            payerName: invoice.recipientName,
            payerEmail: invoice.recipientEmail || "",
            payerAddress: invoice.recipientAddress,
            payerCompany: invoice.recipientType,
            eventId: invoice.event?.id?.toString() || "",
            eventName: invoice.event?.name || "General Invoice",
            type: invoice.recipientType,
            description: `Invoice for ${invoice.recipientType}`,
            items: invoice.items.map((item: any) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.total
            })),
            subtotal: invoice.subtotal,
            tax: invoice.taxTotal,
            taxRate: invoice.items[0]?.taxRate || 0,
            discount: invoice.discountTotal,
            total: invoice.grandTotal,
            paymentStatus: invoice.status as any,
            notes: invoice.notes,
            signatureUrl: invoice.signatureUrl,
            isSigned: invoice.isSigned
        };

        // Generate HTML
        const html = generateInvoiceHTML(invoiceData);

        // Create a new window and print
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 250);
        }
    }

    async function handleSendEmail() {
        // TODO: Implement email sending
        alert("Email functionality coming soon!");
    }

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: invoice?.currency || 'USD'
        }).format(amount);
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-500">Invoice not found</p>
            </div>
        );
    }

    const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const balanceDue = invoice.grandTotal - totalPaid;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <BackButton fallbackUrl="/admin/invoices" />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{invoice.number}</h1>
                    <p className="text-gray-500 mt-1">Invoice Details</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSendEmail}>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                    </Button>
                    <Button onClick={handleDownloadPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                    </Button>
                </div>
            </div>

            {/* Status & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1 capitalize">{invoice.status}</p>
                        </div>
                        <FileText className="w-8 h-8 text-indigo-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Amount</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(invoice.grandTotal)}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Balance Due</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(balanceDue)}</p>
                        </div>
                        {balanceDue > 0 ? (
                            <Clock className="w-8 h-8 text-yellow-600" />
                        ) : (
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        )}
                    </div>
                </div>
            </div>

            {/* Invoice Details */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Invoice Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Recipient</p>
                                <p className="font-medium text-gray-900">{invoice.recipientName}</p>
                                {invoice.recipientEmail && (
                                    <p className="text-sm text-gray-600">{invoice.recipientEmail}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Type</p>
                                <Badge variant="outline">{invoice.recipientType}</Badge>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Invoice Date</p>
                                <p className="font-medium text-gray-900">{formatDate(invoice.date)}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-500">Due Date</p>
                                <p className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {invoice.event && (
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-500">Event</p>
                        <p className="font-medium text-gray-900">{invoice.event.name}</p>
                    </div>
                )}
            </div>

            {/* Line Items */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">Line Items</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {invoice.items.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.quantity}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{formatCurrency(item.unitPrice)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-right">{item.taxRate}%</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                            <tr>
                                <td colSpan={4} className="px-6 py-3 text-sm font-medium text-gray-700 text-right">Subtotal</td>
                                <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(invoice.subtotal)}</td>
                            </tr>
                            <tr>
                                <td colSpan={4} className="px-6 py-3 text-sm font-medium text-gray-700 text-right">Tax</td>
                                <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(invoice.taxTotal)}</td>
                            </tr>
                            {invoice.discountTotal > 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-3 text-sm font-medium text-gray-700 text-right">Discount</td>
                                    <td className="px-6 py-3 text-sm font-medium text-red-600 text-right">-{formatCurrency(invoice.discountTotal)}</td>
                                </tr>
                            )}
                            <tr className="border-t-2">
                                <td colSpan={4} className="px-6 py-4 text-base font-bold text-gray-900 text-right">Grand Total</td>
                                <td className="px-6 py-4 text-base font-bold text-indigo-600 text-right">{formatCurrency(invoice.grandTotal)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Payment History */}
            {invoice.payments.length > 0 && (
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Payment History</h3>
                    <div className="space-y-3">
                        {invoice.payments.map((payment: any) => (
                            <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <CreditCard className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                                        <p className="text-sm text-gray-500">{payment.method} • {formatDate(payment.date)}</p>
                                    </div>
                                </div>
                                {payment.receipt && (
                                    <Badge className="bg-green-100 text-green-700">Receipt: {payment.receipt.number}</Badge>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Record Payment Button */}
            {balanceDue > 0 && (
                <div className="flex justify-end">
                    <Button
                        onClick={() => router.push(`/admin/invoices/${invoiceId}/payment`)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Record Payment
                    </Button>
                </div>
            )}
        </div>
    );
}
