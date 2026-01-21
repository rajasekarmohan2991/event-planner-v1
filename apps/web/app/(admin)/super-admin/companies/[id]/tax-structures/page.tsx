"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Plus,
    Trash2,
    Edit2,
    Check,
    Loader2,
    Save,
    X,
    Globe,
    ArrowRight,
    Link2,
    Sparkles,
    AlertCircle
} from "lucide-react";
import BackButton from "@/components/ui/back-button";
import { useToast } from "@/components/ui/use-toast";
import { COUNTRY_CURRENCY_MAP, getCountryByCode } from "@/lib/country-currency-config";

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

export default function TaxStructuresPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [taxes, setTaxes] = useState<TaxStructure[]>([]);
    const [globalTemplates, setGlobalTemplates] = useState<GlobalTaxTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [mode, setMode] = useState<"template" | "custom">("template");
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        rate: "",
        description: "",
        isDefault: false,
        globalTemplateId: "",
        countryCode: "",
        currencyCode: "USD",
        effectiveFrom: new Date().toISOString().split('T')[0], // Today's date
        effectiveTo: ""
    });

    // Handle both array and string params
    const companyId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

    useEffect(() => {
        if (companyId) {
            fetchTaxes();
            fetchGlobalTemplates();
        }
    }, [companyId]);

    async function fetchTaxes() {
        try {
            const res = await fetch(`/api/super-admin/companies/${companyId}/tax-structures`);
            if (res.ok) {
                const data = await res.json();
                setTaxes(data.taxes || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchGlobalTemplates() {
        try {
            const res = await fetch("/api/super-admin/tax-templates");
            if (res.ok) {
                const data = await res.json();
                setGlobalTemplates(data.templates || []);
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);

        try {
            let payload: any;

            if (mode === "template" && formData.globalTemplateId) {
                // Using a global template
                const template = globalTemplates.find((t) => t.id === formData.globalTemplateId);
                if (!template) {
                    toast({
                        title: "Error",
                        description: "Selected template not found",
                        variant: "destructive"
                    });
                    setSubmitting(false);
                    return;
                }
                payload = {
                    name: template?.name || formData.name,
                    rate: template?.rate || parseFloat(formData.rate),
                    description: template?.description || formData.description,
                    isDefault: formData.isDefault,
                    globalTemplateId: formData.globalTemplateId,
                    isCustom: false
                };
            } else {
                // Custom tax structure
                if (!formData.name || !formData.rate) {
                    toast({
                        title: "Validation Error",
                        description: "Name and rate are required",
                        variant: "destructive"
                    });
                    setSubmitting(false);
                    return;
                }
                payload = {
                    name: formData.name,
                    rate: parseFloat(formData.rate),
                    description: formData.description,
                    isDefault: formData.isDefault,
                    globalTemplateId: null,
                    isCustom: true
                };
            }

            console.log('Submitting tax structure:', payload);

            if (editingId) {
                const res = await fetch(
                    `/api/super-admin/companies/${companyId}/tax-structures/${editingId}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    }
                );

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.message || 'Failed to update tax structure');
                }

                toast({
                    title: "Success",
                    description: "Tax structure updated successfully"
                });
                resetForm();
                fetchTaxes();
            } else {
                const res = await fetch(`/api/super-admin/companies/${companyId}/tax-structures`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    const error = await res.json();
                    console.error('API Error:', error);
                    throw new Error(error.message || 'Failed to create tax structure');
                }

                const result = await res.json();
                console.log('Tax structure created:', result);

                toast({
                    title: "Success",
                    description: "Tax structure created successfully"
                });
                resetForm();
                fetchTaxes();
            }
        } catch (error: any) {
            console.error('Error submitting tax structure:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to save tax structure",
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this tax structure?")) return;
        try {
            await fetch(`/api/super-admin/companies/${companyId}/tax-structures/${id}`, {
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
            globalTemplateId: tax.globalTemplateId || "",
            countryCode: (tax as any).countryCode || "",
            currencyCode: (tax as any).currencyCode || "USD",
            effectiveFrom: (tax as any).effectiveFrom ? new Date((tax as any).effectiveFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            effectiveTo: (tax as any).effectiveTo ? new Date((tax as any).effectiveTo).toISOString().split('T')[0] : ""
        });
        setIsCreating(false);
    }

    function resetForm() {
        console.log('resetForm called');
        setIsCreating(false);
        setEditingId(null);
        setMode("template");
        setFormData({
            name: "",
            rate: "",
            description: "",
            isDefault: false,
            globalTemplateId: "",
            countryCode: "",
            currencyCode: "USD",
            effectiveFrom: new Date().toISOString().split('T')[0],
            effectiveTo: ""
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

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <BackButton fallbackUrl={`/super-admin/companies/${companyId}`} />
            </div>

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tax Structures</h1>
                    <p className="text-gray-500">Manage tax rates and structures for this company</p>
                </div>
                <button
                    onClick={() => {
                        console.log('Add Tax Structure button clicked');
                        setIsCreating(true);
                        setEditingId(null);
                        setMode("template");
                        setFormData({
                            name: "",
                            rate: "",
                            description: "",
                            isDefault: false,
                            globalTemplateId: "",
                            countryCode: "",
                            currencyCode: "USD",
                            effectiveFrom: new Date().toISOString().split('T')[0],
                            effectiveTo: ""
                        });
                    }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
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
                                    {globalTemplates.length === 0 && (
                                        <p className="text-gray-500 text-center py-4">
                                            No global templates available. Ask Super Admin to create some.
                                        </p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Custom Tax Form */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tax Name
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
                                            Rate (%)
                                        </label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
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

                                {/* Country and Currency Selection */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Country
                                        </label>
                                        <select
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={formData.countryCode}
                                            onChange={(e) => {
                                                const country = getCountryByCode(e.target.value);
                                                setFormData({
                                                    ...formData,
                                                    countryCode: e.target.value,
                                                    currencyCode: country?.currency || 'USD'
                                                });
                                            }}
                                        >
                                            <option value="">Select Country (Optional)</option>
                                            {Object.values(COUNTRY_CURRENCY_MAP).map((country) => (
                                                <option key={country.code} value={country.code}>
                                                    {country.flag} {country.name}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">Select country for auto-fill</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Currency
                                        </label>
                                        <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700">
                                            {formData.currencyCode} ({getCountryByCode(formData.countryCode)?.currencySymbol || '$'})
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Auto-filled from country</p>
                                    </div>
                                </div>

                                {/* Effective Dates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Effective From *
                                        </label>
                                        <input
                                            required
                                            type="date"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={formData.effectiveFrom}
                                            onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">When this tax rate becomes active</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Effective To (Optional)
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={formData.effectiveTo}
                                            onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                                            min={formData.effectiveFrom}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Leave empty for no expiry</p>
                                    </div>
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
                                Set as default tax structure
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || (mode === "template" && !formData.globalTemplateId)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {editingId ? "Updating..." : "Creating..."}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        {editingId ? "Update Tax" : "Create Tax"}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                ) : taxes.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <p>No tax structures defined yet.</p>
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
        </div>
    );
}
