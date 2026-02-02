"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CreditCard, Calendar, Users, Zap, Check, X } from 'lucide-react';

interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    interval: 'monthly' | 'yearly';
    features: string[];
    limits: {
        maxEvents: number;
        maxUsers: number;
        maxStorage: number; // in GB
    };
}

const PLANS: SubscriptionPlan[] = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        interval: 'monthly',
        features: [
            'Up to 10 events per month',
            'Up to 5 team members',
            '1 GB storage',
            'Basic analytics',
            'Email support'
        ],
        limits: {
            maxEvents: 10,
            maxUsers: 5,
            maxStorage: 1
        }
    },
    {
        id: 'starter',
        name: 'Starter',
        price: 29,
        interval: 'monthly',
        features: [
            'Up to 50 events per month',
            'Up to 15 team members',
            '10 GB storage',
            'Advanced analytics',
            'Priority email support',
            'Custom branding'
        ],
        limits: {
            maxEvents: 50,
            maxUsers: 15,
            maxStorage: 10
        }
    },
    {
        id: 'professional',
        name: 'Professional',
        price: 99,
        interval: 'monthly',
        features: [
            'Unlimited events',
            'Up to 50 team members',
            '100 GB storage',
            'Advanced analytics & reports',
            '24/7 priority support',
            'Custom branding',
            'API access',
            'White-label options'
        ],
        limits: {
            maxEvents: -1, // unlimited
            maxUsers: 50,
            maxStorage: 100
        }
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 299,
        interval: 'monthly',
        features: [
            'Unlimited everything',
            'Unlimited team members',
            'Unlimited storage',
            'Advanced analytics & reports',
            'Dedicated account manager',
            'Custom branding',
            'API access',
            'White-label options',
            'Custom integrations',
            'SLA guarantee'
        ],
        limits: {
            maxEvents: -1,
            maxUsers: -1,
            maxStorage: -1
        }
    }
];

export default function SubscriptionPage() {
    const { data: session } = useSession();
    const [currentPlan, setCurrentPlan] = useState<string>('free');
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
    const [loading, setLoading] = useState(true);
    const [subscriptionData, setSubscriptionData] = useState<any>(null);

    useEffect(() => {
        loadSubscriptionData();
    }, []);

    const loadSubscriptionData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/subscription');
            if (res.ok) {
                const data = await res.json();
                setCurrentPlan(data.plan || 'free');
                setSubscriptionData(data);
            }
        } catch (error) {
            console.error('Error loading subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (planId: string) => {
        try {
            const res = await fetch('/api/admin/subscription/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, interval: billingInterval })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.checkoutUrl) {
                    window.location.href = data.checkoutUrl;
                } else {
                    setCurrentPlan(planId);
                    loadSubscriptionData();
                }
            }
        } catch (error) {
            console.error('Error upgrading subscription:', error);
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Subscription & Billing</h1>
                <p className="text-gray-600">Manage your subscription plan and billing information</p>
            </div>

            {/* Current Plan */}
            <div className="bg-white rounded-lg shadow border p-6">
                <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold">Current Plan</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div>
                        <div className="text-sm text-gray-500">Plan</div>
                        <div className="text-2xl font-bold capitalize">{currentPlan}</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Status</div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Next Billing Date</div>
                        <div className="text-lg font-medium">
                            {subscriptionData?.nextBillingDate
                                ? new Date(subscriptionData.nextBillingDate).toLocaleDateString()
                                : 'N/A'
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Billing Interval Toggle */}
            <div className="flex justify-center">
                <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                    <button
                        onClick={() => setBillingInterval('monthly')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${billingInterval === 'monthly'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingInterval('yearly')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${billingInterval === 'yearly'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Yearly
                        <span className="ml-2 text-xs text-green-600 font-semibold">Save 20%</span>
                    </button>
                </div>
            </div>

            {/* Plans */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {PLANS.map((plan) => {
                    const isCurrentPlan = plan.id === currentPlan;
                    const price = billingInterval === 'yearly' ? plan.price * 12 * 0.8 : plan.price;

                    return (
                        <div
                            key={plan.id}
                            className={`relative rounded-lg border-2 p-6 ${isCurrentPlan
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                        >
                            {isCurrentPlan && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                                        Current Plan
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                <div className="text-4xl font-bold mb-1">
                                    ${price.toFixed(0)}
                                    <span className="text-lg text-gray-500 font-normal">
                                        /{billingInterval === 'yearly' ? 'year' : 'mo'}
                                    </span>
                                </div>
                                {billingInterval === 'yearly' && plan.price > 0 && (
                                    <div className="text-sm text-green-600">
                                        Save ${(plan.price * 12 * 0.2).toFixed(0)}/year
                                    </div>
                                )}
                            </div>

                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleUpgrade(plan.id)}
                                disabled={isCurrentPlan}
                                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${isCurrentPlan
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : plan.id === 'enterprise'
                                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                {isCurrentPlan ? 'Current Plan' : plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Usage Stats */}
            <div className="bg-white rounded-lg shadow border p-6">
                <h2 className="text-xl font-semibold mb-4">Current Usage</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Events</span>
                            <span className="text-sm font-medium">
                                {subscriptionData?.usage?.events || 0} / {
                                    PLANS.find(p => p.id === currentPlan)?.limits.maxEvents === -1
                                        ? '∞'
                                        : PLANS.find(p => p.id === currentPlan)?.limits.maxEvents
                                }
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                    width: `${Math.min(100, ((subscriptionData?.usage?.events || 0) / (PLANS.find(p => p.id === currentPlan)?.limits.maxEvents || 1)) * 100)}%`
                                }}
                            ></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Team Members</span>
                            <span className="text-sm font-medium">
                                {subscriptionData?.usage?.users || 0} / {
                                    PLANS.find(p => p.id === currentPlan)?.limits.maxUsers === -1
                                        ? '∞'
                                        : PLANS.find(p => p.id === currentPlan)?.limits.maxUsers
                                }
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{
                                    width: `${Math.min(100, ((subscriptionData?.usage?.users || 0) / (PLANS.find(p => p.id === currentPlan)?.limits.maxUsers || 1)) * 100)}%`
                                }}
                            ></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Storage</span>
                            <span className="text-sm font-medium">
                                {(subscriptionData?.usage?.storage || 0).toFixed(2)} GB / {
                                    PLANS.find(p => p.id === currentPlan)?.limits.maxStorage === -1
                                        ? '∞'
                                        : PLANS.find(p => p.id === currentPlan)?.limits.maxStorage + ' GB'
                                }
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{
                                    width: `${Math.min(100, ((subscriptionData?.usage?.storage || 0) / (PLANS.find(p => p.id === currentPlan)?.limits.maxStorage || 1)) * 100)}%`
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
