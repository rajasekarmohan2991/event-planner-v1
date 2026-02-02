"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, CreditCard, DollarSign, Building2, Loader2 } from "lucide-react";

interface FinanceSettings {
    defaultTaxRate: number;
    taxRegistrationNumber?: string;
    defaultPaymentTerms: string;
    defaultCurrency: string;
    invoicePrefix?: string;
    invoiceNumberStart?: number;
    paymentGateway?: string;
    stripePublishableKey?: string;
    stripeSecretKey?: string;
    razorpayKeyId?: string;
    razorpayKeySecret?: string;
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    ifscCode?: string;
    swiftCode?: string;
    invoiceFooterText?: string;
}

export default function FinanceSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<FinanceSettings>({
        defaultTaxRate: 0,
        defaultPaymentTerms: 'NET_30',
        defaultCurrency: 'USD',
        invoiceNumberStart: 1
    });

    const companyId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

    useEffect(() => {
        if (companyId) {
            fetchData();
        }
    }, [companyId]);

    async function fetchData() {
        try {
            // Fetch company details
            const companyRes = await fetch(`/api/super-admin/companies/${companyId}`, {
                credentials: 'include'
            });
            if (companyRes.ok) {
                const data = await companyRes.json();
                setCompany(data);
            }

            // Fetch finance settings
            const settingsRes = await fetch(`/api/finance/settings?tenantId=${companyId}`, {
                credentials: 'include'
            });
            if (settingsRes.ok) {
                const data = await settingsRes.json();
                if (data.settings) {
                    setSettings(data.settings);
                }
            }
        } catch (error) {
            console.error('Error fetching finance settings:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/finance/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: companyId,
                    ...settings
                })
            });

            if (res.ok) {
                alert('Finance settings saved successfully!');
            } else {
                const error = await res.json();
                alert(`Failed to save settings: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving finance settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.push(`/super-admin/companies/${companyId}/finance`)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Finance
                </button>

                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                        <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Finance Settings</h1>
                        <p className="text-gray-600">{company?.name || 'Company'} - Payment & Billing Configuration</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tax Configuration */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-purple-600" />
                        Tax Configuration
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Default Tax Rate (%)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={settings.defaultTaxRate}
                                onChange={(e) => setSettings({ ...settings, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tax Registration Number
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="GST/VAT/TIN Number"
                                value={settings.taxRegistrationNumber || ''}
                                onChange={(e) => setSettings({ ...settings, taxRegistrationNumber: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Invoice Configuration */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Invoice Configuration
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Default Payment Terms
                            </label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={settings.defaultPaymentTerms}
                                onChange={(e) => setSettings({ ...settings, defaultPaymentTerms: e.target.value })}
                            >
                                <option value="DUE_ON_RECEIPT">Due on Receipt</option>
                                <option value="NET_15">Net 15 Days</option>
                                <option value="NET_30">Net 30 Days</option>
                                <option value="NET_60">Net 60 Days</option>
                                <option value="NET_90">Net 90 Days</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Default Currency
                            </label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={settings.defaultCurrency}
                                onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                            >
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                                <option value="INR">INR - Indian Rupee</option>
                                <option value="AUD">AUD - Australian Dollar</option>
                                <option value="CAD">CAD - Canadian Dollar</option>
                                <option value="SGD">SGD - Singapore Dollar</option>
                                <option value="AED">AED - UAE Dirham</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Invoice Prefix
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="INV"
                                value={settings.invoicePrefix || ''}
                                onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Invoice Number Start
                            </label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={settings.invoiceNumberStart || 1}
                                onChange={(e) => setSettings({ ...settings, invoiceNumberStart: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Invoice Footer Text
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            rows={3}
                            placeholder="Thank you for your business..."
                            value={settings.invoiceFooterText || ''}
                            onChange={(e) => setSettings({ ...settings, invoiceFooterText: e.target.value })}
                        />
                    </div>
                </div>

                {/* Payment Gateway */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        Payment Gateway
                    </h2>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Gateway
                        </label>
                        <select
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={settings.paymentGateway || ''}
                            onChange={(e) => setSettings({ ...settings, paymentGateway: e.target.value })}
                        >
                            <option value="">None</option>
                            <option value="STRIPE">Stripe</option>
                            <option value="RAZORPAY">Razorpay</option>
                        </select>
                    </div>

                    {settings.paymentGateway === 'STRIPE' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Stripe Publishable Key
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="pk_..."
                                    value={settings.stripePublishableKey || ''}
                                    onChange={(e) => setSettings({ ...settings, stripePublishableKey: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Stripe Secret Key
                                </label>
                                <input
                                    type="password"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="sk_..."
                                    value={settings.stripeSecretKey || ''}
                                    onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {settings.paymentGateway === 'RAZORPAY' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Razorpay Key ID
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="rzp_..."
                                    value={settings.razorpayKeyId || ''}
                                    onChange={(e) => setSettings({ ...settings, razorpayKeyId: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Razorpay Key Secret
                                </label>
                                <input
                                    type="password"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={settings.razorpayKeySecret || ''}
                                    onChange={(e) => setSettings({ ...settings, razorpayKeySecret: e.target.value })}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Bank Details */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bank Name
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={settings.bankName || ''}
                                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Holder Name
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={settings.accountHolderName || ''}
                                onChange={(e) => setSettings({ ...settings, accountHolderName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Account Number
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={settings.accountNumber || ''}
                                onChange={(e) => setSettings({ ...settings, accountNumber: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                IFSC / SWIFT Code
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={settings.ifscCode || settings.swiftCode || ''}
                                onChange={(e) => setSettings({ ...settings, ifscCode: e.target.value, swiftCode: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.push(`/super-admin/companies/${companyId}/finance`)}
                        className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
