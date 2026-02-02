'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Save, Loader2, Check, RefreshCw } from 'lucide-react'

const CURRENCY_OPTIONS = [
    { label: 'USD ($)', code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
    { label: 'EUR (€)', code: 'EUR', name: 'Euro', flag: '🇪🇺' },
    { label: 'GBP (£)', code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
    { label: 'INR (₹)', code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
    { label: 'AUD ($)', code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
    { label: 'CAD ($)', code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
    { label: 'AED (dh)', code: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
    { label: 'SGD ($)', code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬' },
]

export default function CurrencySettings() {
    const [defaultCurrency, setDefaultCurrency] = useState('INR')
    const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings/tenant')
            if (res.ok) {
                const data = await res.json()
                setDefaultCurrency(data.currency || 'INR')
                setSupportedCurrencies(data.supportedCurrencies || [])
            }
        } catch (error) {
            console.error('Failed to load currency settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const res = await fetch('/api/admin/settings/tenant', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    defaultCurrency,
                    supportedCurrencies
                })
            })

            if (res.ok) {
                // Show toast or alert
            } else {
                alert('❌ Failed to save settings')
            }
        } catch (error) {
            console.error('Failed to save settings:', error)
            alert('❌ Error saving settings')
        } finally {
            setSaving(false)
        }
    }

    const toggleCurrency = (code: string) => {
        setSupportedCurrencies(prev => {
            if (prev.includes(code)) {
                return prev.filter(c => c !== code)
            } else {
                return [...prev, code]
            }
        })
    }

    if (loading) {
        return (
            <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">Currency & Exchange</h2>
                    <p className="text-gray-500 mt-1">Manage accepted currencies and exchange rates for your events.</p>
                </div>
                <button
                    onClick={loadSettings}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                    title="Refresh Settings"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Settings Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-indigo-600" />
                                Currency Configuration
                            </h3>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Default Currency */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">base Currency</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {CURRENCY_OPTIONS.map((curr) => (
                                        <div
                                            key={`default-${curr.code}`}
                                            onClick={() => setDefaultCurrency(curr.code)}
                                            className={`
                                                relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                                                ${defaultCurrency === curr.code
                                                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            <div className="flex flex-col items-center text-center gap-2">
                                                <span className="text-2xl" role="img" aria-label={curr.name}>{curr.flag}</span>
                                                <div>
                                                    <div className={`font-bold ${defaultCurrency === curr.code ? 'text-indigo-900' : 'text-gray-900'}`}>{curr.code}</div>
                                                    <div className="text-xs text-gray-500">{curr.label}</div>
                                                </div>
                                            </div>
                                            {defaultCurrency === curr.code && (
                                                <div className="absolute top-2 right-2 text-indigo-600">
                                                    <Check className="w-4 h-4 bg-indigo-100 rounded-full p-0.5" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    This is the primary currency for your dashboard and reports.
                                </p>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Supported Currencies */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Accepted Currencies</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {CURRENCY_OPTIONS.map((curr) => (
                                        <div
                                            key={`supported-${curr.code}`}
                                            onClick={() => toggleCurrency(curr.code)}
                                            className={`
                                                flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none
                                                ${supportedCurrencies.includes(curr.code)
                                                    ? 'bg-indigo-50 border-indigo-200'
                                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{curr.flag}</span>
                                                <div>
                                                    <div className="font-medium text-gray-900">{curr.name}</div>
                                                    <div className="text-xs text-gray-500">{curr.code} ({curr.label})</div>
                                                </div>
                                            </div>
                                            <div className={`
                                                w-6 h-6 rounded-full border flex items-center justify-center transition-colors
                                                ${supportedCurrencies.includes(curr.code)
                                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                                    : 'border-gray-300 bg-white'
                                                }
                                            `}>
                                                {supportedCurrencies.includes(curr.code) && <Check className="w-3.5 h-3.5" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-medium transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl p-6 text-white shadow-xl">
                        <h3 className="font-semibold text-lg mb-4">Currency Tips</h3>
                        <div className="space-y-4 text-indigo-100 text-sm">
                            <p>
                                <span className="block text-white font-medium mb-1">Base Currency</span>
                                Ensure your base currency matches your bank account to avoid conversion fees.
                            </p>
                            <p>
                                <span className="block text-white font-medium mb-1">Multi-Currency Support</span>
                                Enabling multiple currencies allows international attendees to pay in their local currency.
                            </p>
                            <div className="pt-4 border-t border-indigo-700/50 mt-4">
                                <p className="text-xs opacity-70">
                                    Exchange rates are updated daily via OpenExchangeRates API.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
