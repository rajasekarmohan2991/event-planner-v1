"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
    Loader2,
    Receipt,
    Settings,
    Link2,
    Sparkles,
    Info,
    Lock,
    Eye
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

export default function CompanyTaxSettingsPage() {
    const { data: session, status } = useSession();
    const [taxes, setTaxes] = useState<TaxStructure[]>([]);
    const [loading, setLoading] = useState(true);

    const tenantId = (session?.user as any)?.tenantId;

    useEffect(() => {
        if (tenantId) {
            fetchTaxes();
        } else {
            setLoading(false);
        }

        // Safety timeout
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
                        View tax structures configured for your company. These taxes are managed by the platform administrator.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-200">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm font-medium">Read Only</span>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-4 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-amber-900 mb-1">Tax Management is Centralized</h3>
                        <p className="text-sm text-amber-800">
                            Tax structures are configured and managed by the <strong>Platform Administrator</strong> at the super admin level.
                            Individual companies can view and use these taxes but cannot add, edit, or delete them.
                            This ensures consistency and compliance across all companies.
                        </p>
                        <p className="text-sm text-amber-800 mt-2">
                            <strong>Need changes?</strong> Contact your platform administrator to request tax structure updates.
                        </p>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-gray-500" />
                        Available Tax Structures
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        These taxes are available for selection in invoices, registrations, and payments.
                    </p>
                </div>

                {taxes.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="font-medium">No tax structures available</p>
                        <p className="text-sm mt-1">Contact your platform administrator to configure tax structures</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-900">Name</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-900">Rate</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-900">Source</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-900">Status</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-900">Country</th>
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
                                            <div>
                                                <span className="inline-flex items-center gap-1.5 text-sm text-blue-600">
                                                    <Link2 className="w-4 h-4" />
                                                    Global Template
                                                </span>
                                                {tax.globalTemplate.taxType && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {tax.globalTemplate.taxType}
                                                    </div>
                                                )}
                                            </div>
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
                                                ✓ Default
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {tax.globalTemplate?.countryCode && (
                                            <span className="text-2xl">
                                                {getCountryFlag(tax.globalTemplate.countryCode)}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Info Panel */}
            <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                <h3 className="font-semibold text-gray-900 mb-3">💡 Tax Settings Information</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                        <span className="text-indigo-600">•</span>
                        <span>
                            <strong>Global Templates</strong> are pre-configured by platform administrators and automatically
                            update when tax rates change at the platform level.
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-purple-600">•</span>
                        <span>
                            <strong>Custom Taxes</strong> are created by administrators with specific rates for your region.
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        <span>
                            The <strong>Default</strong> tax is automatically applied to new invoices and registrations.
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-amber-600">•</span>
                        <span>
                            <strong>Effective Dates:</strong> Tax changes are managed centrally to ensure compliance and consistency.
                        </span>
                    </li>
                </ul>
            </div>

            {/* Contact Admin CTA */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-6 text-center">
                <Eye className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Need Tax Structure Changes?</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Tax structures are managed at the platform level by super administrators.
                    <br />
                    Contact your platform administrator to request changes or additions.
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-indigo-600 font-medium">
                    <Lock className="w-4 h-4" />
                    Managed by Platform Administrator
                </div>
            </div>
        </div>
    );
}
