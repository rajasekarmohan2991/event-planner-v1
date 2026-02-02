"use client"

import { useEffect, useState } from 'react'

type PaymentSettings = {
  id: number
  taxRatePercent: number
}

export default function PaymentSettingsPage({ params }: { params: { id: string } }) {
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let aborted = false
    const load = async () => {
      try {
        const res = await fetch(`/api/events/${params.id}/payment-settings`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load payment settings')
        const data = await res.json()
        if (!aborted) setSettings(data)
      } catch {
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    load()
    return () => { aborted = true }
  }, [params.id])

  const save = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${params.id}/payment-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSettings(await res.json())
    } catch (e: any) {
      alert(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load payment settings</p>
      </div>
    )
  }

  const previewSubtotal = 1000
  const previewTax = Math.round((settings.taxRatePercent / 100) * previewSubtotal)
  const previewTotal = previewSubtotal + previewTax

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Payment Settings</h1>
          <p className="text-sm text-muted-foreground">Event ID: {params.id}</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>

      <div className="rounded-lg border bg-white p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
          <select
            value={settings.taxRatePercent}
            onChange={e => setSettings({ ...settings, taxRatePercent: parseInt(e.target.value) })}
            className="w-40 rounded-md border px-3 py-2 text-sm"
          >
            <option value={0}>0%</option>
            <option value={12}>12%</option>
            <option value={18}>18% (default)</option>
            <option value={28}>28%</option>
          </select>
        </div>

        <div className="rounded-md border bg-slate-50 p-4 text-sm">
          <div className="font-medium mb-2">Preview (for subtotal ₹{previewSubtotal})</div>
          <div className="grid grid-cols-2 max-w-xs gap-y-1">
            <div>Tax ({settings.taxRatePercent}%)</div>
            <div className="text-right">₹{previewTax}</div>
            <div className="font-medium">Total</div>
            <div className="text-right font-medium">₹{previewTotal}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
