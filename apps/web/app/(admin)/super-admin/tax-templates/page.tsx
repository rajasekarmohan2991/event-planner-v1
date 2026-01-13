"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    Plus,
    Trash2,
    Edit2,
    Check,
    Loader2,
    Save,
    X,
    Calendar,
    Globe,
    Building2,
    Search,
    Filter,
    AlertCircle
} from "lucide-react";
import BackButton from "@/components/ui/back-button";

interface GlobalTaxTemplate {
    id: string;
    name: string;
    rate: number;
    description?: string;
    taxType: string;
    countryCode?: string;
    effectiveFrom?: string;
    effectiveUntil?: string;
    appliesTo: string;
    isCompound: boolean;
    isActive: boolean;
    createdAt: string;
    _count?: {
        taxStructures: number;
    };
}

const TAX_TYPES = [
    { value: "GST", label: "GST (Goods & Services Tax)" },
    { value: "VAT", label: "VAT (Value Added Tax)" },
    { value: "SALES_TAX", label: "Sales Tax" },
    { value: "SERVICE_TAX", label: "Service Tax" },
    { value: "OTHER", label: "Other" }
];

const COUNTRIES = [
    { code: "", name: "All Countries" },
    { code: "IN", name: "India" },
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "SG", name: "Singapore" },
    { code: "AE", name: "UAE" },
    { code: "JP", name: "Japan" },
    { code: "CN", name: "China" },
    { code: "BR", name: "Brazil" },
    { code: "MX", name: "Mexico" },
    { code: "ZA", name: "South Africa" },
    { code: "NZ", name: "New Zealand" }
];

const APPLIES_TO_OPTIONS = [
    { value: "ALL", label: "All Transaction Types" },
    { value: "TICKETS", label: "Tickets Only" },
    { value: "SPONSORS", label: "Sponsors Only" },
    { value: "EXHIBITORS", label: "Exhibitors Only" },
    { value: "VENDORS", label: "Vendors Only" }
];

export default function GlobalTaxTemplatesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [templates, setTemplates] = useState<GlobalTaxTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showInactive, setShowInactive] = useState(false);
    const [filterCountry, setFilterCountry] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        rate: "",
        description: "",
        taxType: "GST",
        countryCode: "",
        effectiveFrom: "",
        effectiveUntil: "",
        appliesTo: "ALL",
        isCompound: false,
        isActive: true
    });

    useEffect(() => {
        if (status === "loading") return;
        if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
            router.push("/dashboard");
        }
    }, [session, status, router]);

    useEffect(() => {
        fetchTemplates();
    }, [showInactive, filterCountry]);

    async function fetchTemplates() {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (showInactive) params.set("includeInactive", "true");
            if (filterCountry) params.set("countryCode", filterCountry);

            const res = await fetch(`/api/super-admin/tax-templates?${params}`);
            if (res.ok) {
                const data = await res.json();
                setTemplates(data.templates || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                rate: parseFloat(formData.rate),
                effectiveFrom: formData.effectiveFrom || null,
                effectiveUntil: formData.effectiveUntil || null,
                countryCode: formData.countryCode || null
            };

            if (editingId) {
                const res = await fetch(`/api/super-admin/tax-templates/${editingId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    resetForm();
                    fetchTemplates();
                } else {
                    const err = await res.json();
                    alert(err.error || "Failed to update template");
                }
            } else {
                const res = await fetch("/api/super-admin/tax-templates", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    resetForm();
                    fetchTemplates();
                } else {
                    const err = await res.json();
                    alert(err.error || "Failed to create template");
                }
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred");
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this tax template?")) return;
        try {
            const res = await fetch(`/api/super-admin/tax-templates/${id}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (res.ok) {
                if (data.deactivated) {
                    alert(data.message);
                }
                fetchTemplates();
            }
        } catch (e) {
            console.error(e);
        }
    }

    function startEdit(template: GlobalTaxTemplate) {
        setEditingId(template.id);
        setFormData({
            name: template.name,
            rate: template.rate.toString(),
            description: template.description || "",
            taxType: template.taxType,
            countryCode: template.countryCode || "",
            effectiveFrom: template.effectiveFrom
                ? new Date(template.effectiveFrom).toISOString().split("T")[0]
                : "",
            effectiveUntil: template.effectiveUntil
                ? new Date(template.effectiveUntil).toISOString().split("T")[0]
                : "",
            appliesTo: template.appliesTo,
            isCompound: template.isCompound,
            isActive: template.isActive
        });
        setIsCreating(false);
    }

    function resetForm() {
        setIsCreating(false);
        setEditingId(null);
        setFormData({
            name: "",
            rate: "",
            description: "",
            taxType: "GST",
            countryCode: "",
            effectiveFrom: "",
            effectiveUntil: "",
            appliesTo: "ALL",
            isCompound: false,
            isActive: true
        });
    }

    const filteredTemplates = templates.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getCountryName = (code?: string) =>
        COUNTRIES.find((c) => c.code === code)?.name || code || "Global";

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
            JP: "🇯🇵",
            CN: "🇨🇳",
            BR: "🇧🇷",
            MX: "🇲🇽",
            ZA: "🇿🇦",
            NZ: "🇳🇿"
        };
        return code ? flags[code] || "🌍" : "🌍";
    };

    if (status === "loading") {
        return (
            <div className="p-6 flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <BackButton fallbackUrl="/super-admin/settings" />
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Globe className="w-7 h-7 text-indigo-600" />
                        Global Tax Templates
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Manage tax structures available to all companies. Configure rates,
                        effective dates, and application rules.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setIsCreating(true);
                        setEditingId(null);
                        resetForm();
                        setFormData((prev) => ({ ...prev }));
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                >
                    <Plus className="w-4 h-4" />
                    Add Tax Template
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={filterCountry}
                            onChange={(e) => setFilterCountry(e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            {COUNTRIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.code ? `${getCountryFlag(c.code)} ${c.name}` : c.name}
                                </option>
                            ))}
                        </select>
                        <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={showInactive}
                                onChange={(e) => setShowInactive(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded"
                            />
                            <span className="text-sm text-gray-700">Show Inactive</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            {(isCreating || editingId) && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            {editingId ? (
                                <>
                                    <Edit2 className="w-5 h-5 text-indigo-600" />
                                    Edit Tax Template
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5 text-indigo-600" />
                                    New Tax Template
                                </>
                            )}
                        </h3>
                        <button
                            onClick={resetForm}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Template Name *
                                </label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g., GST 18%"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
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
                                    onChange={(e) =>
                                        setFormData({ ...formData, rate: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tax Type
                                </label>
                                <select
                                    value={formData.taxType}
                                    onChange={(e) =>
                                        setFormData({ ...formData, taxType: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {TAX_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Country & Applies To */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Country
                                </label>
                                <select
                                    value={formData.countryCode}
                                    onChange={(e) =>
                                        setFormData({ ...formData, countryCode: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {COUNTRIES.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.code
                                                ? `${getCountryFlag(c.code)} ${c.name}`
                                                : "🌍 Global (All Countries)"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Applies To
                                </label>
                                <select
                                    value={formData.appliesTo}
                                    onChange={(e) =>
                                        setFormData({ ...formData, appliesTo: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {APPLIES_TO_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Effective From
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.effectiveFrom}
                                    onChange={(e) =>
                                        setFormData({ ...formData, effectiveFrom: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Effective Until
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.effectiveUntil}
                                    onChange={(e) =>
                                        setFormData({ ...formData, effectiveUntil: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Optional description..."
                                rows={2}
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                            />
                        </div>

                        {/* Options */}
                        <div className="flex flex-wrap gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isCompound}
                                    onChange={(e) =>
                                        setFormData({ ...formData, isCompound: e.target.checked })
                                    }
                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700">Compound Tax</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) =>
                                        setFormData({ ...formData, isActive: e.target.checked })
                                    }
                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700">Active</span>
                            </label>
                        </div>

                        {/* Actions */}
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
                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {editingId ? "Update Template" : "Create Template"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Templates List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Globe className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">No tax templates found</p>
                        <p className="text-sm">
                            Create your first global tax template to get started.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">
                                        Template
                                    </th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">
                                        Rate
                                    </th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">
                                        Country
                                    </th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">
                                        Effective Period
                                    </th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">
                                        Usage
                                    </th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTemplates.map((template) => (
                                    <tr
                                        key={template.id}
                                        className={`hover:bg-gray-50/50 transition-colors ${!template.isActive ? "opacity-60" : ""
                                            }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">
                                                {template.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {TAX_TYPES.find((t) => t.value === template.taxType)
                                                    ?.label || template.taxType}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800">
                                                {template.rate}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-lg mr-1">
                                                {getCountryFlag(template.countryCode)}
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                {getCountryName(template.countryCode)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {template.effectiveFrom || template.effectiveUntil ? (
                                                <div>
                                                    {template.effectiveFrom && (
                                                        <div>
                                                            From:{" "}
                                                            {new Date(
                                                                template.effectiveFrom
                                                            ).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                    {template.effectiveUntil && (
                                                        <div>
                                                            Until:{" "}
                                                            {new Date(
                                                                template.effectiveUntil
                                                            ).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">No date limit</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">
                                                    {template._count?.taxStructures || 0} companies
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {template.isActive ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <Check className="w-3 h-3" /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                    <X className="w-3 h-3" /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => startEdit(template)}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(template.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                    </div>
                )}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
                    <h3 className="font-semibold text-lg mb-2">How Templates Work</h3>
                    <p className="text-sm opacity-90">
                        Global templates are available to all companies. Companies can adopt
                        these templates or create custom tax structures.
                    </p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
                    <h3 className="font-semibold text-lg mb-2">Effective Dates</h3>
                    <p className="text-sm opacity-90">
                        Set date ranges for tax templates to handle rate changes. Templates
                        outside their effective period won't apply to new transactions.
                    </p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white">
                    <h3 className="font-semibold text-lg mb-2">Rate Changes</h3>
                    <p className="text-sm opacity-90">
                        When you update a template rate, companies using it (without custom
                        overrides) will automatically use the new rate.
                    </p>
                </div>
            </div>
        </div>
    );
}
