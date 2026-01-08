"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";

interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    discount: number;
}

export default function CreateInvoicePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [events, setEvents] = useState<any[]>([]);

    // Form state
    const [eventId, setEventId] = useState("");
    const [recipientType, setRecipientType] = useState("CUSTOMER");
    const [recipientName, setRecipientName] = useState("");
    const [recipientEmail, setRecipientEmail] = useState("");
    const [recipientAddress, setRecipientAddress] = useState("");
    const [recipientTaxId, setRecipientTaxId] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [currency, setCurrency] = useState("USD");
    const [notes, setNotes] = useState("");
    const [terms, setTerms] = useState("Payment due within 30 days");

    const [items, setItems] = useState<LineItem[]>([
        { description: "", quantity: 1, unitPrice: 0, taxRate: 0, discount: 0 }
    ]);

    useEffect(() => {
        loadEvents();
    }, []);

    async function loadEvents() {
        try {
            const res = await fetch("/api/events");
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events || []);
            }
        } catch (error) {
            console.error("Failed to load events:", error);
        }
    }

    function addLineItem() {
        setItems([...items, { description: "", quantity: 1, unitPrice: 0, taxRate: 0, discount: 0 }]);
    }

    function removeLineItem(index: number) {
        setItems(items.filter((_, i) => i !== index));
    }

    function updateLineItem(index: number, field: keyof LineItem, value: any) {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        setItems(updated);
    }

    function calculateTotals() {
        let subtotal = 0;
        let taxTotal = 0;
        let discountTotal = 0;

        items.forEach(item => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const itemTax = (itemSubtotal * item.taxRate) / 100;
            subtotal += itemSubtotal;
            taxTotal += itemTax;
            discountTotal += item.discount || 0;
        });

        const grandTotal = subtotal + taxTotal - discountTotal;

        return { subtotal, taxTotal, discountTotal, grandTotal };
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventId: eventId || null,
                    recipientType,
                    recipientName,
                    recipientEmail,
                    recipientAddress,
                    recipientTaxId,
                    date,
                    dueDate,
                    currency,
                    items,
                    notes,
                    terms
                })
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/admin/invoices/${data.invoice.id}`);
            } else {
                alert("Failed to create invoice");
            }
        } catch (error) {
            console.error("Error creating invoice:", error);
            alert("An error occurred");
        } finally {
            setLoading(false);
        }
    }

    const totals = calculateTotals();

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <BackButton fallbackUrl="/admin/invoices" />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
                    <p className="text-gray-500 mt-1">Generate a new invoice for payment</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Recipient Information */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Recipient Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Recipient Type *
                            </label>
                            <select
                                value={recipientType}
                                onChange={(e) => setRecipientType(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                            >
                                <option value="CUSTOMER">Customer</option>
                                <option value="EXHIBITOR">Exhibitor</option>
                                <option value="VENDOR">Vendor</option>
                                <option value="SPONSOR">Sponsor</option>
                                <option value="SPEAKER">Speaker</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Event (Optional)
                            </label>
                            <select
                                value={eventId}
                                onChange={(e) => setEventId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="">No Event</option>
                                {events.map(event => (
                                    <option key={event.id} value={event.id}>{event.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Recipient Name *
                            </label>
                            <input
                                type="text"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address
                            </label>
                            <textarea
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                rows={2}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tax ID / GST
                            </label>
                            <input
                                type="text"
                                value={recipientTaxId}
                                onChange={(e) => setRecipientTaxId(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Invoice Details */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Invoice Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Invoice Date *
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Due Date *
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Currency
                            </label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="INR">INR</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Line Items</h3>
                        <Button type="button" onClick={addLineItem} variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Item
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 items-start p-4 bg-gray-50 rounded-lg">
                                <div className="col-span-4">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => updateLineItem(index, "description", e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Item description"
                                        required
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateLineItem(index, "quantity", parseFloat(e.target.value) || 0)}
                                        className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price</label>
                                    <input
                                        type="number"
                                        value={item.unitPrice}
                                        onChange={(e) => updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                        className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                </div>

                                <div className="col-span-1">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tax %</label>
                                    <input
                                        type="number"
                                        value={item.taxRate}
                                        onChange={(e) => updateLineItem(index, "taxRate", parseFloat(e.target.value) || 0)}
                                        className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                        step="0.1"
                                        min="0"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Discount</label>
                                    <input
                                        type="number"
                                        value={item.discount}
                                        onChange={(e) => updateLineItem(index, "discount", parseFloat(e.target.value) || 0)}
                                        className="w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>

                                <div className="col-span-1 flex items-end">
                                    {items.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeLineItem(index)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="mt-6 flex justify-end">
                        <div className="w-80 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">{currency} {totals.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tax:</span>
                                <span className="font-medium">{currency} {totals.taxTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Discount:</span>
                                <span className="font-medium text-red-600">-{currency} {totals.discountTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                <span>Total:</span>
                                <span className="text-indigo-600">{currency} {totals.grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                rows={3}
                                placeholder="Any additional notes..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                            <textarea
                                value={terms}
                                onChange={(e) => setTerms(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                rows={2}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Create Invoice
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
