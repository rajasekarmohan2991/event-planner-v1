"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2, Edit2, Check, ArrowLeft, Loader2, Save, X } from "lucide-react";
import BackButton from "@/components/ui/back-button";

interface TaxStructure {
    id: string;
    name: string;
    rate: number;
    description?: string;
    isDefault: boolean;
}

export default function TaxStructuresPage() {
    const params = useParams();
    const router = useRouter();
    const [taxes, setTaxes] = useState<TaxStructure[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        rate: '',
        description: '',
        isDefault: false
    });

    // Handle both array and string params
    const companyId = Array.isArray(params?.id) ? params.id[0] : params?.id as string;

    useEffect(() => {
        if (companyId) fetchTaxes();
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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            if (editingId) {
                // Update
                const res = await fetch(`/api/super-admin/companies/${companyId}/tax-structures/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (res.ok) {
                    setEditingId(null);
                    setFormData({ name: '', rate: '', description: '', isDefault: false });
                    fetchTaxes();
                }
            } else {
                // Create
                const res = await fetch(`/api/super-admin/companies/${companyId}/tax-structures`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (res.ok) {
                    setIsCreating(false);
                    setFormData({ name: '', rate: '', description: '', isDefault: false });
                    fetchTaxes();
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Delete this tax structure?")) return;
        try {
            await fetch(`/api/super-admin/companies/${companyId}/tax-structures/${id}`, { method: 'DELETE' });
            fetchTaxes();
        } catch (e) { console.error(e); }
    }

    function startEdit(tax: TaxStructure) {
        setEditingId(tax.id);
        setFormData({
            name: tax.name,
            rate: tax.rate.toString(),
            description: tax.description || '',
            isDefault: tax.isDefault
        });
        setIsCreating(false);
    }

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
                    onClick={() => { setIsCreating(true); setEditingId(null); setFormData({ name: '', rate: '', description: '', isDefault: false }); }}
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
                        <h3 className="text-lg font-semibold">{editingId ? 'Edit Tax Structure' : 'New Tax Structure'}</h3>
                        <button onClick={() => { setIsCreating(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Name</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. GST (18%)"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rate (%)</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="18.0"
                                    value={formData.rate}
                                    onChange={e => setFormData({ ...formData, rate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Brief description..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isDefault"
                                checked={formData.isDefault}
                                onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                            <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default tax structure</label>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => { setIsCreating(false); setEditingId(null); }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {editingId ? 'Update Tax' : 'Create Tax'}
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
                                <th className="px-6 py-3 text-sm font-semibold text-gray-900">Description</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-900">Status</th>
                                <th className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {taxes.map((tax) => (
                                <tr key={tax.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{tax.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{tax.rate}%</td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">{tax.description || '-'}</td>
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
