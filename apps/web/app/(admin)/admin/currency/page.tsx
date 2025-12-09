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

export default function CurrencySettingsPage() {
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
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Currency Settings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage supported currencies and exchange rates
        </p>
      </div>

      <div className="bg-white rounded-lg border p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6 p-4 bg-indigo-50 text-indigo-700 rounded-lg">
          <DollarSign className="w-6 h-6" />
          <div>
            <p className="font-medium">Default Currency: {defaultCurrency}</p>
            <p className="text-sm opacity-80">Base currency for all transactions</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <label className="block text-sm font-medium text-gray-700">Supported Currencies</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CURRENCY_OPTIONS.map((curr) => (
                <div 
                  key={curr.code} 
                  onClick={() => toggleCurrency(curr.code)}
                  className="flex items-center gap-2 p-3 border rounded hover:bg-gray-50 cursor-pointer select-none"
                >
                  <input 
                    type="checkbox" 
                    checked={supportedCurrencies.includes(curr.code)} 
                    onChange={() => {}} // Handled by div onClick
                    className="rounded text-indigo-600" 
                  />
                  <span className="text-sm">{curr.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
