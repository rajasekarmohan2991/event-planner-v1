"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Crown, Calendar, DollarSign } from "lucide-react";

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
    features: any[];
}

export default function CompanySubscriptionPage() {
    const params = useParams();
    const router = useRouter();
    const [company, setCompany] = useState<any>(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string>('');

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
                setSelectedPlan(data.plan || '');
            }

            // Fetch available plans
            const plansRes = await fetch('/api/super-admin/subscription-plans', {
                credentials: 'include'
            });
            if (plansRes.ok) {
                const data = await plansRes.json();
                setPlans(data.plans || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!selectedPlan) {
            alert('Please select a plan');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/admin/billing/upgrade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: companyId,
                    plan: selectedPlan
                })
            });

            if (res.ok) {
                alert('Subscription plan updated successfully!');
                router.push(`/super-admin/companies/${companyId}`);
            } else {
                const error = await res.json();
                alert(`Failed: ${error.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating plan:', error);
            alert('Failed to update plan');
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

    const currentPlan = plans.find(p => p.slug === company?.plan);

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => router.push(`/super-admin/companies/${companyId}`)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Company
                </button>

                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                        <Crown className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Manage Subscription</h1>
                        <p className="text-gray-600">{company?.name || 'Company'}</p>
                    </div>
                </div>
            </div>

            {/* Current Plan */}
            {currentPlan && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 mb-8 border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                            <h3 className="text-2xl font-bold text-gray-900">{currentPlan.name}</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold text-purple-600">
                                {currentPlan.currency} {currentPlan.price}
                            </p>
                            <p className="text-sm text-gray-600">/ {currentPlan.billingPeriod.toLowerCase()}</p>
                        </div>
                    </div>
                    {currentPlan.description && (
                        <p className="text-gray-600 mb-4">{currentPlan.description}</p>
                    )}
                    <div className="grid grid-cols-3 gap-4">
                        {currentPlan.maxEvents && (
                            <div className="bg-white/60 rounded-lg p-3">
                                <p className="text-xs text-gray-600">Max Events</p>
                                <p className="text-lg font-semibold text-gray-900">{currentPlan.maxEvents}</p>
                            </div>
                        )}
                        {currentPlan.maxUsers && (
                            <div className="bg-white/60 rounded-lg p-3">
                                <p className="text-xs text-gray-600">Max Users</p>
                                <p className="text-lg font-semibold text-gray-900">{currentPlan.maxUsers}</p>
                            </div>
                        )}
                        {currentPlan.maxAttendees && (
                            <div className="bg-white/60 rounded-lg p-3">
                                <p className="text-xs text-gray-600">Max Attendees</p>
                                <p className="text-lg font-semibold text-gray-900">{currentPlan.maxAttendees}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Available Plans */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Select New Plan</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.filter(p => p.isActive).map((plan) => (
                        <div
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan.slug)}
                            className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
                                selectedPlan === plan.slug
                                    ? 'border-purple-500 shadow-lg ring-2 ring-purple-200'
                                    : 'border-gray-200 hover:border-purple-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                {selectedPlan === plan.slug && (
                                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {plan.description && (
                                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                            )}

                            <div className="mb-4">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-gray-900">{plan.currency} {plan.price}</span>
                                    <span className="text-gray-600">/ {plan.billingPeriod.toLowerCase()}</span>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t">
                                {plan.maxEvents && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Events</span>
                                        <span className="font-medium text-gray-900">{plan.maxEvents}</span>
                                    </div>
                                )}
                                {plan.maxUsers && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Users</span>
                                        <span className="font-medium text-gray-900">{plan.maxUsers}</span>
                                    </div>
                                )}
                                {plan.maxAttendees && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Attendees</span>
                                        <span className="font-medium text-gray-900">{plan.maxAttendees}</span>
                                    </div>
                                )}
                            </div>

                            {plan.features && plan.features.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-xs font-medium text-gray-500 mb-2">FEATURES</p>
                                    <ul className="space-y-1">
                                        {plan.features.slice(0, 3).map((feature: any, idx: number) => (
                                            <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {feature.name}
                                            </li>
                                        ))}
                                        {plan.features.length > 3 && (
                                            <li className="text-sm text-gray-500">+{plan.features.length - 3} more</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {plans.filter(p => p.isActive).length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No active subscription plans available.</p>
                        <button
                            onClick={() => router.push('/super-admin/subscription-plans')}
                            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Create subscription plans
                        </button>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                    onClick={() => router.push(`/super-admin/companies/${companyId}`)}
                    className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving || !selectedPlan || selectedPlan === company?.plan}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Update Subscription
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
