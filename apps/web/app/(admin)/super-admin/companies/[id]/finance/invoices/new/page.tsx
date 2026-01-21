"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from "lucide-react";

interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    discount: number;
}

export default function CreateInvoicePage() {
    const params = useParams();
    const router = useRouter();
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        recipientType: 'INDIVIDUAL',
        recipientName: '',
        recipientEmail: '',
        recipientTaxId: '',
        currency: 'USD',
        paymentTerms: 'NET_30',
        notes: ''
    });

    const [lineItems, setLineItems] = useState<LineItem[]>([
        { description: '', quantity: 1, unitPrice: 0, taxRate: 0, discount: 0 }
    ]);

    const companyId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

    useEffect(() => {
        if (companyId) {
            fetchCompany();
        }
    }, [companyId]);

    async function fetchCompany() {
        try {
            const res = await fetch(`/api/super-admin/companies/${companyId}`);
            if (res.ok) {
                const data = await res.json();
                setCompany(data);
                setFormData(prev => ({ ...prev, currency: data.currency || 'USD' }));
            }
        } catch (error) {
            console.error('Error fetching company:', error);
        } finally {
            setLoading(false);
        }
    }

    function addLineItem() {
        setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, taxRate: 0, discount: 0 }]);
    }

    function removeLineItem(index: number) {
        if (lineItems.length > 1) {
            const newItems = [...lineItems];
            newItems.splice(index, 1);
            setLineItems(newItems);
        }
    }

    function updateLineItem(index: number, field: keyof LineItem, value: any) {
        const newItems = [...lineItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setLineItems(newItems);
    }

    function calculateTotals() {
        let subtotal = 0;
        let taxTotal = 0;
        let discountTotal = 0;

        lineItems.forEach(item => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const itemDiscount = item.discount || 0;
            const itemTaxable = itemSubtotal - itemDiscount;
            const itemTax = itemTaxable * (item.taxRate / 100);

            subtotal += itemSubtotal;
            discountTotal += itemDiscount;
            taxTotal += itemTax;
        });

        const grandTotal = subtotal - discountTotal + taxTotal;

        return { subtotal, taxTotal, discountTotal, grandTotal };
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        if (!formData.recipientName || !formData.recipientEmail) {
            alert('Please fill in recipient details');
            return;
        }

        if (lineItems.some(item => !item.description || item.unitPrice <= 0)) {
            alert('Please fill in all line items with valid prices');
            return;
        }

        setSaving(true);
        try {
            console.log('🔍 Creating invoice for company:', companyId);
            console.log('📋 Invoice payload:', { ...formData, tenantId: companyId, lineItems });
            
            const res = await fetch('/api/finance/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    tenantId: companyId,
                    lineItems
                })
            });

            if (res.ok) {
                alert('Invoice created successfully!');
                router.push(`/super-admin/companies/${companyId}/finance`);
            } else {
                const error = await res.json();
                alert(`Failed: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('Failed to create invoice');
        } finally {
            setSaving(false);
        }
    }

    const totals = calculateTotals();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <button
                onClick={() => router.push(`/super-admin/companies/${companyId}/finance`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Finance
            </button>

            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
                    <p className="text-gray-600 mt-1">{company?.name || 'Company'}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Recipient Details */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recipient Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Recipient Type
                                </label>
                                <select
                                    value={formData.recipientType}
                                    onChange={(e) => setFormData({ ...formData, recipientType: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="INDIVIDUAL">Individual</option>
                                    <option value="COMPANY">Company</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Recipient Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.recipientName}
                                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="John Doe / Company Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.recipientEmail}
                                    onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tax ID / GST Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.recipientTaxId}
                                    onChange={(e) => setFormData({ ...formData, recipientTaxId: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Invoice Settings */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Settings</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Currency
                                </label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                    <option value="INR">INR</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Terms
                                </label>
                                <select
                                    value={formData.paymentTerms}
                                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="DUE_ON_RECEIPT">Due on Receipt</option>
                                    <option value="NET_15">Net 15 Days</option>
                                    <option value="NET_30">Net 30 Days</option>
                                    <option value="NET_60">Net 60 Days</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
                            <button
                                type="button"
                                onClick={addLineItem}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Plus className="w-4 h-4" />
                                Add Item
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {lineItems.map((item, index) => (
                                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Description *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={item.description}
                                                onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Item description"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Quantity
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Unit Price
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.unitPrice}
                                                onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Tax Rate (%)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.taxRate}
                                                onChange={(e) => updateLineItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-3">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-medium text-gray-700">Discount:</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.discount}
                                                onChange={(e) => updateLineItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                                className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            />
                                        </div>
                                        {lineItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeLineItem(index)}
                                                className="text-red-600 hover:text-red-700 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="max-w-md ml-auto space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">{formData.currency} {totals.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Discount:</span>
                                <span className="font-medium text-red-600">-{formData.currency} {totals.discountTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tax:</span>
                                <span className="font-medium">{formData.currency} {totals.taxTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                <span>Total:</span>
                                <span>{formData.currency} {totals.grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            rows={3}
                            placeholder="Additional notes or terms..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => router.push(`/super-admin/companies/${companyId}/finance`)}
                            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Create Invoice
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
