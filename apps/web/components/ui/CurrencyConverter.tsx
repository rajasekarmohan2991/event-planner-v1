'use client'

import { useState, useEffect } from 'react'
import { ArrowRightLeft, RefreshCw } from 'lucide-react'
import { AVAILABLE_CURRENCIES, Currency, getCurrencyByCode, formatCurrency } from '@/lib/currency'

export default function CurrencyConverter() {
    const [amount, setAmount] = useState<number>(100)
    const [fromCode, setFromCode] = useState<string>('USD')
    const [toCode, setToCode] = useState<string>('EUR')
    const [rates, setRates] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<string | null>(null)

    useEffect(() => {
        fetchRates()
    }, [])

    const fetchRates = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/currency/rates')
            if (res.ok) {
                const data = await res.json()
                setRates(data.rates)
                setLastUpdated(data.lastUpdated)
            }
        } catch (err) {
            console.error('Failed to fetch rates', err)
        } finally {
            setLoading(false)
        }
    }

    const convert = (val: number, from: string, to: string) => {
        if (from === to) return val
        if (!rates[from] || !rates[to]) return val

        // Convert to USD first (Base)
        const inUSD = val / rates[from]
        // Then to Target
        const result = inUSD * rates[to]

        return result
    }

    const result = convert(amount, fromCode, toCode)
    const toCurrency = getCurrencyByCode(toCode)

    return (
        <div className="bg-white p-6 rounded-lg border shadow-sm max-w-md">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Currency Converter</h3>
                <button
                    onClick={fetchRates}
                    disabled={loading}
                    className={`p-2 rounded-full hover:bg-gray-100 ${loading ? 'animate-spin' : ''}`}
                    title="Refresh Rates"
                >
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full p-2 border rounded-md"
                        min="0"
                    />
                </div>

                <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                        <select
                            value={fromCode}
                            onChange={(e) => setFromCode(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        >
                            {AVAILABLE_CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-6">
                        <button
                            onClick={() => {
                                const temp = fromCode
                                setFromCode(toCode)
                                setToCode(temp)
                            }}
                            className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 border"
                        >
                            <ArrowRightLeft className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                        <select
                            value={toCode}
                            onChange={(e) => setToCode(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        >
                            {AVAILABLE_CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-md text-center">
                    <div className="text-sm text-gray-500 mb-1">
                        1 {fromCode} = {(convert(1, fromCode, toCode) || 1).toFixed(4)} {toCode}
                    </div>
                    <div className="text-2xl font-bold text-indigo-600">
                        {formatCurrency(result, toCurrency)}
                    </div>
                </div>

                {lastUpdated && (
                    <div className="text-xs text-center text-gray-400">
                        Rates updated: {new Date(lastUpdated).toLocaleDateString()}
                    </div>
                )}
            </div>
        </div>
    )
}
