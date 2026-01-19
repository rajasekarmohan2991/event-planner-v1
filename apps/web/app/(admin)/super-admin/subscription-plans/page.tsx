"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    Loader2,
    Check,
    Zap,
    Crown,
    Sparkles,
    DollarSign
} from "lucide-react";

interface PlanFeature {
    name: string;
    included: boolean;
    limit?: number;
}

interface SubscriptionPlan {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    currency: string;
    billingPeriod: string;
    maxEvents?: number;
    maxUsers?: number;
    maxAttendees?: number;
    features: PlanFeature[];
    isActive: boolean;
    sortOrder: number;
}

export default function SubscriptionPlansPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({
        name: "",
        slug: "",
        description: "",
        price: 0,
        currency: "USD",
        billingPeriod: "MONTHLY",
        maxEvents: undefined,
        maxUsers: undefined,
        maxAttendees: undefined,
        features: [],
        isActive: true,
        sortOrder: 0
    });

    const [newFeature, setNewFeature] = useState({ name: "", included: true, limit: undefined });

    useEffect(() => {
        fetchPlans();
    }, []);

    async function fetchPlans() {
        try {
            const res = await fetch('/api/super-admin/subscription-plans');
            if (res.ok) {
                const data = await res.json();
                setPlans(data.plans || []);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingId
                ? `/api/super-admin/subscription-plans/${editingId}`
                : '/api/super-admin/subscription-plans';
            
            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                resetForm();
                fetchPlans();
            } else {
                const error = await res.json();
                alert(`Failed: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving plan:', error);
            alert('Failed to save plan');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this subscription plan? This cannot be undone.')) return;
        try {
            const res = await fetch(`/api/super-admin/subscription-plans/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchPlans();
            }
        } catch (error) {
            console.error('Error deleting plan:', error);
        }
    }

    function startEdit(plan: SubscriptionPlan) {
        setEditingId(plan.id);
        setFormData(plan);
        setIsCreating(false);
    }

    function resetForm() {
        setIsCreating(false);
        setEditingId(null);
        setFormData({
            name: "",
            slug: "",
            description: "",
            price: 0,
            currency: "USD",
            billingPeriod: "MONTHLY",
            maxEvents: undefined,
            maxUsers: undefined,
            maxAttendees: undefined,
            features: [],
            isActive: true,
            sortOrder: 0
        });
        setNewFeature({ name: "", included: true, limit: undefined });
    }

    function addFeature() {
        if (!newFeature.name.trim()) return;
        setFormData({
            ...formData,
            features: [...(formData.features || []), { ...newFeature }]
        });
        setNewFeature({ name: "", included: true, limit: undefined });
    }

    function removeFeature(index: number) {
        const features = [...(formData.features || [])];
        features.splice(index, 1);
        setFormData({ ...formData, features });
    }

    function getPlanIcon(slug: string) {
        if (slug.includes('free') || slug.includes('starter')) return <Zap className="w-5 h-5" />;
        if (slug.includes('pro') || slug.includes('professional')) return <Crown className="w-5 h-5" />;
        if (slug.includes('enterprise') || slug.includes('premium')) return <Sparkles className="w-5 h-5" />;
        return <DollarSign className="w-5 h-5" />;
    }

    function getPlanColor(slug: string) {
        if (slug.includes('free') || slug.includes('starter')) return 'bg-blue-100 text-blue-700';
        if (slug.includes('pro') || slug.includes('professional')) return 'bg-purple-100 text-purple-700';
        if (slug.includes('enterprise') || slug.includes('premium')) return 'bg-amber-100 text-amber-700';
        return 'bg-gray-100 text-gray-700';
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
                    <p className="text-gray-600 mt-1">Manage pricing tiers and features for your platform</p>
                </div>
                <button
                    onClick={() => {
                        setIsCreating(true);
                        setEditingId(null);
                        resetForm();
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create Plan
                </button>
            </div>

            {/* Form Section */}
            {(isCreating || editingId) && (
                <div className="bg-white p-6 rounded-xl shadow-lg border mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold">
                            {editingId ? "Edit Plan" : "Create New Plan"}
                        </h3>
                        <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Plan Name *
                                </label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Professional"
                                    value={formData.name}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        const slug = name.toLowerCase().replace(/\s+/g, '-');
                                        setFormData({ ...formData, name, slug });
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Slug *
                                </label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. professional"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                rows={2}
                                placeholder="Brief description of this plan..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Price *
                                </label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Currency
                                </label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                >
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                    <option value="INR">INR</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Billing Period
                                </label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.billingPeriod}
                                    onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
                                >
                                    <option value="MONTHLY">Monthly</option>
                                    <option value="YEARLY">Yearly</option>
                                    <option value="LIFETIME">Lifetime</option>
                                </select>
                            </div>
                        </div>

                        {/* Limits */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Max Events (leave empty for unlimited)
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Unlimited"
                                    value={formData.maxEvents || ''}
                                    onChange={(e) => setFormData({ ...formData, maxEvents: e.target.value ? parseInt(e.target.value) : undefined })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Max Users
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Unlimited"
                                    value={formData.maxUsers || ''}
                                    onChange={(e) => setFormData({ ...formData, maxUsers: e.target.value ? parseInt(e.target.value) : undefined })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Max Attendees per Event
                                </label>
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Unlimited"
                                    value={formData.maxAttendees || ''}
                                    onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value ? parseInt(e.target.value) : undefined })}
                                />
                            </div>
                        </div>

                        {/* Features */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Features
                            </label>
                            <div className="space-y-2 mb-3">
                                {(formData.features || []).map((feature, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                        <Check className="w-4 h-4 text-green-600" />
                                        <span className="flex-1">{feature.name}</span>
                                        {feature.limit && <span className="text-sm text-gray-500">Limit: {feature.limit}</span>}
                                        <button
                                            type="button"
                                            onClick={() => removeFeature(index)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Feature name"
                                    value={newFeature.name}
                                    onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={addFeature}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                                >
                                    Add Feature
                                </button>
                            </div>
                        </div>

                        {/* Settings */}
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-gray-700">Active (visible to users)</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-700">Sort Order:</label>
                                <input
                                    type="number"
                                    className="w-20 px-2 py-1 border rounded"
                                    value={formData.sortOrder}
                                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={resetForm}
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
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        {editingId ? "Update Plan" : "Create Plan"}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-lg ${getPlanColor(plan.slug)}`}>
                                    {getPlanIcon(plan.slug)}
                                </div>
                                {!plan.isActive && (
                                    <span className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                                        Inactive
                                    </span>
                                )}
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                            <p className="text-gray-600 text-sm mb-4 min-h-[40px]">{plan.description}</p>
                            
                            <div className="mb-4">
                                <span className="text-3xl font-bold text-gray-900">
                                    {plan.currency} {plan.price}
                                </span>
                                <span className="text-gray-600 ml-2">/ {plan.billingPeriod.toLowerCase()}</span>
                            </div>

                            <div className="space-y-2 mb-4">
                                {plan.maxEvents && (
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium">Events:</span> {plan.maxEvents}
                                    </div>
                                )}
                                {plan.maxUsers && (
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium">Users:</span> {plan.maxUsers}
                                    </div>
                                )}
                                {plan.maxAttendees && (
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium">Attendees:</span> {plan.maxAttendees}
                                    </div>
                                )}
                            </div>

                            {plan.features && plan.features.length > 0 && (
                                <div className="border-t pt-4 mb-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
                                    <ul className="space-y-1">
                                        {plan.features.slice(0, 5).map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                                <Check className="w-3 h-3 text-green-600" />
                                                {feature.name}
                                            </li>
                                        ))}
                                        {plan.features.length > 5 && (
                                            <li className="text-sm text-gray-500">
                                                +{plan.features.length - 5} more...
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            <div className="flex gap-2 pt-4 border-t">
                                <button
                                    onClick={() => startEdit(plan)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(plan.id)}
                                    className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {plans.length === 0 && !isCreating && (
                <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No subscription plans created yet.</p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Create your first plan
                    </button>
                </div>
            )}
        </div>
    );
}
