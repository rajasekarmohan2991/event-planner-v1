"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DollarSign, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";

export default function RecordPaymentPage() {
    const params = useParams();
    const router = useRouter();
    const invoiceId = Array.isArray(params?.id) ? params.id[0] : params?.id as string;

    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Payment form
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("BANK_TRANSFER");
    const [reference, setReference] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (invoiceId) loadInvoice();
    }, [invoiceId]);

    async function loadInvoice() {
        try {
            const res = await fetch(`/api/invoices/${invoiceId}`);
            if (res.ok) {
                const data = await res.json();
                setInvoice(data.invoice);

                // Calculate balance due
                const totalPaid = data.invoice.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
                const balance = data.invoice.grandTotal - totalPaid;
                setAmount(balance.toString());
            }
        } catch (error) {
            console.error("Failed to load invoice:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/invoices/${invoiceId}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    method,
                    reference,
                    date,
                    notes
                })
            });

            if (res.ok) {
                router.push(`/admin/invoices/${invoiceId}`);
            } else {
                alert("Failed to record payment");
            }
        } catch (error) {
            console.error("Error recording payment:", error);
            alert("An error occurred");
        } finally {
            setSaving(false);
        }
    }

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: invoice?.currency || 'USD'
        }).format(amount);
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
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <BackButton fallbackUrl={`/admin/invoices/${invoiceId}`} />

            <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Record Payment</h1>
                    <p className="text-gray-500">Invoice {invoice.number}</p>
                </div>
            </div>

            {/* Invoice Summary */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Invoice Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Recipient</p>
                        <p className="font-medium text-gray-900">{invoice.recipientName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Invoice Total</p>
                        <p className="font-medium text-gray-900">{formatCurrency(invoice.grandTotal)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Paid</p>
                        <p className="font-medium text-green-600">{formatCurrency(totalPaid)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Balance Due</p>
                        <p className="font-medium text-red-600">{formatCurrency(balanceDue)}</p>
                    </div>
                </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-lg font-semibold">Payment Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount * ({invoice.currency})
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            step="0.01"
                            min="0.01"
                            max={balanceDue}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Maximum: {formatCurrency(balanceDue)}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Method *
                        </label>
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            required
                        >
                            <option value="BANK_TRANSFER">Bank Transfer</option>
                            <option value="CASH">Cash</option>
                            <option value="CHECK">Check</option>
                            <option value="STRIPE">Stripe</option>
                            <option value="ONLINE">Online Payment</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Date *
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reference / Transaction ID
                        </label>
                        <input
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="e.g., TXN123456"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        rows={3}
                        placeholder="Any additional notes about this payment..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Recording...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Record Payment
                            </>
                        )}
                    </Button>
                </div>
            </form>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Recording this payment will automatically generate a receipt and update the invoice status.
                </p>
            </div>
        </div>
    );
}
