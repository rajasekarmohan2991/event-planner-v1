"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
    Plus,
    Trash2,
    Edit2,
    Check,
    Loader2,
    Save,
    X,
    Globe,
    Sparkles,
    Receipt,
    Settings,
    Link2
} from "lucide-react";
import BackButton from "@/components/ui/back-button";

interface TaxStructure {
    id: string;
    name: string;
    rate: number;
    description?: string;
    isDefault: boolean;
    isCustom: boolean;
    globalTemplateId?: string;
    globalTemplate?: {
        id: string;
        name: string;
        rate: number;
        taxType: string;
        countryCode?: string;
    };
}

interface GlobalTaxTemplate {
    id: string;
    name: string;
    rate: number;
    description?: string;
    taxType: string;
    countryCode?: string;
    isActive: boolean;
}

export default function CompanyTaxSettingsPage() {
    const { data: session, status } = useSession();
    const [taxes, setTaxes] = useState<TaxStructure[]>([]);
    const [globalTemplates, setGlobalTemplates] = useState<GlobalTaxTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [mode, setMode] = useState<"template" | "custom">("template");

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        rate: "",
        description: "",
        isDefault: false,
        globalTemplateId: ""
    });

    const tenantId = (session?.user as any)?.tenantId;

    useEffect(() => {
        if (tenantId) {
            fetchTaxes();
            fetchGlobalTemplates();
        } else {
            // No tenantId, stop loading
            setLoading(false);
        }

        // Safety timeout - ensure loading stops after 10 seconds
        const timeout = setTimeout(() => {
            console.warn('Tax settings loading timeout - forcing stop');
            setLoading(false);
        }, 10000);

        return () => clearTimeout(timeout);
    }, [tenantId]);

    async function fetchTaxes() {
        if (!tenantId) {
            setLoading(false);
            return;
        }
        try {
            console.log('Fetching company tax structures...');
            const res = await fetch(`/api/company/tax-structures`);
            console.log('Tax structures response status:', res.status);

            if (res.ok) {
                const data = await res.json();
                console.log('Tax structures data:', data);
                setTaxes(data.taxes || []);
            } else {
                console.error('Failed to fetch tax structures:', res.status);
                setTaxes([]);
            }
        } catch (error) {
            console.error('Error fetching tax structures:', error);
            setTaxes([]);
        } finally {
            setLoading(false);
        }
    }

    async function fetchGlobalTemplates() {
        try {
            console.log('Fetching global tax templates...');
            const res = await fetch("/api/company/global-tax-templates");
            console.log('Global templates response status:', res.status);

            if (res.ok) {
                const data = await res.json();
                console.log('Global templates data:', data);
                setGlobalTemplates(data.templates || []);
            } else {
                console.error('Failed to fetch global templates:', res.status, res.statusText);
                const errorData = await res.json().catch(() => ({}));
                console.error('Error details:', errorData);
                setGlobalTemplates([]);
            }
        } catch (error) {
            console.error('Error fetching global templates:', error);
            setGlobalTemplates([]);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            let payload: any;

            if (mode === "template" && formData.globalTemplateId) {
                const template = globalTemplates.find((t) => t.id === formData.globalTemplateId);
                payload = {
                    name: template?.name || formData.name,
                    rate: template?.rate || parseFloat(formData.rate),
                    description: template?.description || formData.description,
                    isDefault: formData.isDefault,
                    globalTemplateId: formData.globalTemplateId,
                    isCustom: false
                };
            } else {
                payload = {
                    name: formData.name,
                    rate: parseFloat(formData.rate),
                    description: formData.description,
                    isDefault: formData.isDefault,
                    globalTemplateId: null,
                    isCustom: true
                };
            }

            if (editingId) {
                const res = await fetch(`/api/company/tax-structures/${editingId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    resetForm();
                    fetchTaxes();
                } else {
                    const err = await res.json();
                    alert(err.message || "Failed to update tax");
                }
            } else {
                const res = await fetch(`/api/company/tax-structures`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    resetForm();
                    fetchTaxes();
                } else {
                    const err = await res.json();
                    alert(err.message || "Failed to create tax");
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this tax structure?")) return;
        try {
            await fetch(`/api/company/tax-structures/${id}`, {
                method: "DELETE"
            });
            fetchTaxes();
        } catch (e) {
            console.error(e);
        }
    }

    function startEdit(tax: TaxStructure) {
        setEditingId(tax.id);
        setMode(tax.isCustom ? "custom" : "template");
        setFormData({
            name: tax.name,
            rate: tax.rate.toString(),
            description: tax.description || "",
            isDefault: tax.isDefault,
            globalTemplateId: tax.globalTemplateId || ""
        });
        setIsCreating(false);
    }

    function resetForm() {
        setIsCreating(false);
        setEditingId(null);
        setMode("template");
        setFormData({
            name: "",
            rate: "",
            description: "",
            isDefault: false,
            globalTemplateId: ""
        });
    }

    function handleTemplateSelect(templateId: string) {
        const template = globalTemplates.find((t) => t.id === templateId);
        if (template) {
            setFormData({
                ...formData,
                globalTemplateId: templateId,
                name: template.name,
                rate: template.rate.toString(),
                description: template.description || ""
            });
        }
    }

    const getCountryFlag = (code?: string) => {
        const flags: Record<string, string> = {
            IN: "🇮🇳",
            US: "🇺🇸",
            GB: "🇬🇧",
            CA: "🇨🇦",
            AU: "🇦🇺",
            DE: "🇩🇪",
            FR: "🇫🇷",
            SG: "🇸🇬",
            AE: "🇦🇪",
            JP: "🇯🇵"
        };
        return code ? flags[code] || "🌍" : "🌍";
    };

    if (status === "loading" || loading) {
        return (
            <div className="p-6 flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <BackButton fallbackUrl="/admin/settings" />
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Receipt className="w-7 h-7 text-indigo-600" />
                        Tax Settings
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Configure tax structures for your company. Apply to invoices, registrations, and payments.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setIsCreating(true);
                        setEditingId(null);
                        resetForm();
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                >
                    <Plus className="w-4 h-4" />
                    Add Tax Structure
                </button>
            </div>

            {/* Form Section */}
            {(isCreating || editingId) && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            {editingId ? "Edit Tax Structure" : "New Tax Structure"}
                        </h3>
                        <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-6">
                        <button
                            type="button"
                            onClick={() => setMode("template")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${mode === "template"
                                ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-300"
                                : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
                                }`}
                        >
                            <Globe className="w-4 h-4" />
                            Use Global Template
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("custom")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${mode === "custom"
                                ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-300"
                                : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
                                }`}
                        >
                            <Sparkles className="w-4 h-4" />
                            Custom Tax
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === "template" ? (
                            <>
                                {/* Template Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Global Template
                                    </label>
                                    {globalTemplates.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {globalTemplates.map((template) => (
                                                <div
                                                    key={template.id}
                                                    onClick={() => handleTemplateSelect(template.id)}
                                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.globalTemplateId === template.id
                                                        ? "border-indigo-500 bg-indigo-50"
                                                        : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-gray-900">{template.name}</span>
                                                        <span className="text-lg">
                                                            {getCountryFlag(template.countryCode)}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-500 mt-1">{template.taxType}</div>
                                                    <div className="text-lg font-bold text-indigo-600 mt-2">
                                                        {template.rate}%
                                                    </div>
                                                    {formData.globalTemplateId === template.id && (
                                                        <div className="flex items-center gap-1 text-indigo-600 text-sm mt-2">
                                                            <Check className="w-4 h-4" /> Selected
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                            <Globe className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                            <p className="text-gray-500">No global templates available.</p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                Contact your administrator to add global tax templates.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Custom Tax Form */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tax Name *
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g. GST (18%)"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Rate (%) *
                                        </label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="18.0"
                                            value={formData.rate}
                                            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Brief description..."
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({ ...formData, description: e.target.value })
                                        }
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isDefault"
                                checked={formData.isDefault}
                                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                            <label htmlFor="isDefault" className="text-sm text-gray-700">
                                Set as default tax structure (applied automatically to new invoices)
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={mode === "template" && !formData.globalTemplateId}
                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                {editingId ? "Update Tax" : "Create Tax"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-gray-500" />
                        Your Tax Structures
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        These taxes will be available for selection in invoices and registrations.
                    </p>
                </div>

                {taxes.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="font-medium">No tax structures configured</p>
                        <p className="text-sm mt-1">Add a tax structure to get started</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-900">Name</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-900">Rate</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-900">Source</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-900">Status</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {taxes.map((tax) => (
                                <tr key={tax.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{tax.name}</div>
                                        {tax.description && (
                                            <div className="text-sm text-gray-500">{tax.description}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800">
                                            {tax.rate}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {tax.globalTemplate ? (
                                            <span className="inline-flex items-center gap-1.5 text-sm text-blue-600">
                                                <Link2 className="w-4 h-4" />
                                                Global Template
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-sm text-purple-600">
                                                <Sparkles className="w-4 h-4" />
                                                Custom
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {tax.isDefault && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <Check className="w-3 h-3" /> Default
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => startEdit(tax)}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(tax.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Info Panel */}
            <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                <h3 className="font-semibold text-gray-900 mb-3">💡 Tax Settings Tips</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-600">•</span>
                        <span>
                            <strong>Global Templates</strong> are pre-configured by system administrators and automatically
                            update when tax rates change.
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-purple-600">•</span>
                        <span>
                            <strong>Custom Taxes</strong> give you full control over the tax name, rate, and description.
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        <span>
                            Set one tax as <strong>Default</strong> to automatically apply it to new invoices.
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
