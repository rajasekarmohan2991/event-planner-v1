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
    DollarSign,
    Settings,
    Mail,
    Send
} from "lucide-react";

interface PlanFeature {
    name: string;
    included: boolean;
    limit?: number;
}

interface ModuleConfig {
    vendorManagement: boolean;
    sponsorManagement: boolean;
    exhibitorManagement: boolean;
    providerCommissionRate: number;
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
    modules?: ModuleConfig;
    isActive: boolean;
    sortOrder: number;
}

interface CompanySubscription {
    id: string;
    name: string;
    slug: string;
    plan: string;
    status: string;
    createdAt: string;
    logo?: string | null;
    billingEmail?: string;
}

export default function SubscriptionPlansPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [companies, setCompanies] = useState<CompanySubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions'>('plans');

    // Manage Plan State
    const [managingCompany, setManagingCompany] = useState<CompanySubscription | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<string>("");
    const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

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
        modules: {
            vendorManagement: false,
            sponsorManagement: false,
            exhibitorManagement: false,
            providerCommissionRate: 15
        },
        isActive: true,
        sortOrder: 0
    });

    const [newFeature, setNewFeature] = useState({ name: "", included: true, limit: undefined });

    useEffect(() => {
        fetchPlans();
        fetchCompanies();
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

    async function fetchCompanies() {
        try {
            const res = await fetch('/api/super-admin/companies');
            if (res.ok) {
                const data = await res.json();
                setCompanies(data.companies || []);
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
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

    async function handleUpdatePlan() {
        if (!managingCompany) return;
        setIsUpdatingPlan(true);

        try {
            // 1. Update the tenant's plan in DB
            const res = await fetch(`/api/super-admin/companies/${managingCompany.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: selectedPlanId })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.emailSent) {
                    alert(`Plan updated to ${selectedPlanId}!\n\nEmail notification sent to the company's billing email.`);
                } else if (data.emailError) {
                    alert(`Plan updated to ${selectedPlanId}!\n\nNote: Email notification failed: ${data.emailError}`);
                } else {
                    alert(`Plan updated to ${selectedPlanId}!\n\nNote: No billing email configured for this company.`);
                }

                setManagingCompany(null);
                fetchCompanies();
            } else {
                const error = await res.json();
                alert(`Failed to update plan: ${error.error}`);
            }
        } catch (error) {
            console.error('Error updating plan:', error);
            alert('An error occurred while updating the plan.');
        } finally {
            setIsUpdatingPlan(false);
        }
    }

    function resetForm(closeForm = true) {
        if (closeForm) {
            setIsCreating(false);
            setEditingId(null);
        }
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
            modules: {
                vendorManagement: false,
                sponsorManagement: false,
                exhibitorManagement: false,
                providerCommissionRate: 15
            },
            isActive: true,
            sortOrder: 0
        });
        setNewFeature({ name: "", included: true, limit: undefined });
    }

    function handleCreateClick() {
        resetForm(false); // Don't close, we are opening
        setIsCreating(true);
        setEditingId(null);
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
            <div className="mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
                        <p className="text-gray-600 mt-1">Manage pricing tiers, features, and company subscriptions</p>
                    </div>
                    {activeTab === 'plans' && !isCreating && !editingId && (
                        <button
                            onClick={handleCreateClick}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Plan
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('plans')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'plans'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Subscription Plans
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'plans' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {plans.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('subscriptions')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'subscriptions'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Company Subscriptions
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'subscriptions' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {companies.length}
                            </span>
                        </button>
                    </nav>
                </div>
            </div>

            {/* Form Section */}
            {(isCreating || editingId) && (
                <div className="bg-white p-6 rounded-xl shadow-lg border mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold">
                            {editingId ? "Edit Plan" : "Create New Plan"}
                        </h3>
                        <button onClick={() => resetForm(true)} className="text-gray-400 hover:text-gray-600">
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

                        {/* Service Management Modules */}
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Service Management Modules (included in this plan)
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:border-blue-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.modules?.vendorManagement || false}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            modules: { ...formData.modules!, vendorManagement: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <div>
                                        <span className="font-medium text-gray-900">Vendor Management</span>
                                        <p className="text-xs text-gray-500">Manage vendors for events</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:border-blue-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.modules?.sponsorManagement || false}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            modules: { ...formData.modules!, sponsorManagement: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <div>
                                        <span className="font-medium text-gray-900">Sponsor Management</span>
                                        <p className="text-xs text-gray-500">Manage sponsors and deals</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:border-blue-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.modules?.exhibitorManagement || false}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            modules: { ...formData.modules!, exhibitorManagement: e.target.checked }
                                        })}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <div>
                                        <span className="font-medium text-gray-900">Exhibitor Management</span>
                                        <p className="text-xs text-gray-500">Manage exhibitors and booths</p>
                                    </div>
                                </label>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="text-sm text-gray-700">Default Commission Rate:</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-20 px-2 py-1 border rounded text-center"
                                    value={formData.modules?.providerCommissionRate || 15}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        modules: { ...formData.modules!, providerCommissionRate: parseFloat(e.target.value) || 0 }
                                    })}
                                />
                                <span className="text-sm text-gray-500">%</span>
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
                                onClick={() => resetForm(true)}
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
            {activeTab === 'plans' && (
                <>
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
                </>
            )}

            {/* Company Subscriptions Table */}
            {activeTab === 'subscriptions' && (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Company
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Current Plan
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Admin Email
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Start Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {companies.map((company) => (
                                    <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    {company.logo ? (
                                                        <img className="h-10 w-10 rounded-lg object-cover" src={company.logo} alt={company.name} />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                                            {company.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{company.name}</div>
                                                    <div className="text-sm text-gray-500">@{company.slug}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {company.plan}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${company.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                company.status === 'TRIAL' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {company.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {company.billingEmail || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(company.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setManagingCompany(company);
                                                    setSelectedPlanId(company.plan);
                                                }}
                                                className="text-blue-600 hover:text-blue-900 font-medium flex items-center justify-end gap-1 ml-auto"
                                            >
                                                <Settings className="w-4 h-4" />
                                                Manage Plan
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {companies.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No companies found.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Manage Plan Modal */}
            {managingCompany && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="p-6 border-b">
                            <h3 className="text-xl font-bold text-gray-900">Manage Subscription</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Update plan for <span className="font-semibold text-gray-900">{managingCompany.name}</span>
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select New Plan
                                </label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedPlanId}
                                    onChange={(e) => setSelectedPlanId(e.target.value)}
                                >
                                    {plans.map(plan => (
                                        <option key={plan.slug} value={plan.slug}>
                                            {plan.name} ({plan.currency} {plan.price}/{plan.billingPeriod})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
                                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                <p className="text-sm text-blue-700">
                                    Updating the plan will automatically generate a pro-rated payment link and email it to the company's billing contact.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t">
                            <button
                                onClick={() => setManagingCompany(null)}
                                className="px-4 py-2 text-gray-700 hover:bg-white border border-transparent hover:border-gray-300 rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdatePlan}
                                disabled={isUpdatingPlan || !selectedPlanId}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isUpdatingPlan ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Update Plan & Send Link
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
