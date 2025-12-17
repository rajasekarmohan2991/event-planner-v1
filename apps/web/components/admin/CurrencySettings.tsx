'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Save, Loader2 } from 'lucide-react'

const CURRENCY_OPTIONS = [
    { label: 'USD ($)', code: 'USD' },
    { label: 'EUR (€)', code: 'EUR' },
    { label: 'GBP (£)', code: 'GBP' },
    { label: 'INR (₹)', code: 'INR' },
    { label: 'AUD ($)', code: 'AUD' },
    { label: 'CAD ($)', code: 'CAD' },
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
                alert('✅ Settings saved successfully')
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
            <div className="p-6 flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight text-gray-900">Currency & Exchange</h2>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl">
                <div className="flex items-center gap-4 mb-6 p-4 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                    <div className="bg-white p-2 rounded-md shadow-sm">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm">Default Currency: {defaultCurrency}</p>
                        <p className="text-xs opacity-80 mt-0.5">Base currency for all transactions</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        <label className="block text-sm font-semibold text-gray-900">Supported Currencies</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {CURRENCY_OPTIONS.map((curr) => (
                                <div
                                    key={curr.code}
                                    onClick={() => toggleCurrency(curr.code)}
                                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all select-none ${supportedCurrencies.includes(curr.code)
                                            ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                            : 'hover:bg-gray-50 border-gray-200'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${supportedCurrencies.includes(curr.code) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
                                        }`}>
                                        {supportedCurrencies.includes(curr.code) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                    <span className={`text-sm font-medium ${supportedCurrencies.includes(curr.code) ? 'text-indigo-900' : 'text-gray-700'}`}>{curr.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors shadow-sm hover:shadow"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
