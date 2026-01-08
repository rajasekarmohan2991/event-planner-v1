"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, AlertCircle, CheckCircle, FileSignature, Wallet, Loader2 } from "lucide-react";
import BackButton from "@/components/ui/back-button";

export default function CompanyFinanceSettingsPage() {
    const params = useParams();
    const router = useRouter();
    // Handle params being potentially void or array
    const companyId = Array.isArray(params?.id) ? params.id[0] : params?.id as string;

    // States
    const [enabled, setEnabled] = useState(false);
    const [signatureUrl, setSignatureUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (companyId) loadSettings();
    }, [companyId]);

    async function loadSettings() {
        try {
            const res = await fetch(`/api/super-admin/companies/${companyId}/finance-settings`);
            if (res.ok) {
                const data = await res.json();
                setEnabled(data.enableFinance);
                setSignatureUrl(data.digitalSignatureUrl || "");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch(`/api/super-admin/companies/${companyId}/finance-settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enableFinance: enabled, digitalSignatureUrl: signatureUrl })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: "Settings updated successfully." });
                const data = await res.json();
                // Optionally reload or update state if needed
            } else {
                setMessage({ type: 'error', text: "Failed to update settings." });
            }
        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: "An error occurred." });
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="mb-6">
                <BackButton fallbackUrl={`/super-admin/companies/${companyId}`} />
            </div>

            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                    <Wallet className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Finance Configuration</h1>
                    <p className="text-gray-500">Enable finance modules and configure digital signatures.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">

                {/* Module Activation */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        Module Status
                        {enabled && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>}
                    </h3>
                    <div className="flex items-start gap-3">
                        <input
                            type="checkbox"
                            id="enableFinance"
                            checked={enabled}
                            onChange={(e) => setEnabled(e.target.checked)}
                            className="mt-1 w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                        />
                        <label htmlFor="enableFinance" className="cursor-pointer">
                            <span className="block font-medium text-gray-900">Enable Invoicing & Tax System</span>
                            <span className="block text-sm text-gray-500 mt-1">
                                Allowing this company to generate invoices, track payments, and manage tax structures.
                                Enabling this will show the Finance module in their dashboard.
                            </span>
                        </label>
                    </div>
                </div>

                {/* Digital Signature */}
                <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-opacity duration-300 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileSignature className="w-5 h-5 text-gray-600" />
                        Digital Signature
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Signature Image URL</label>
                            <input
                                type="url"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="https://example.com/signature.png"
                                value={signatureUrl}
                                onChange={(e) => setSignatureUrl(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Provide a direct URL to a transparent PNG signature image. This will be stamped on generated invoices.
                            </p>
                        </div>

                        {signatureUrl && enabled && (
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Preview</p>
                                <img src={signatureUrl} alt="Signature Preview" className="h-16 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                            </div>
                        )}
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-lg flex items-center gap-2 animate-in fade-in ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium shadow-sm"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Configuration
                    </button>
                </div>

            </form>
        </div>
    );
}
