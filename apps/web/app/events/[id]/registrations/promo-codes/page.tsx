"use client"

import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit3, Tag, Percent, DollarSign, Calendar, Users, CheckCircle, XCircle } from 'lucide-react'

type DiscountType = 'PERCENT' | 'FIXED'

type PromoCode = {
  id: number
  eventId: number
  code: string
  discountType: DiscountType
  discountAmount: number
  maxUses: number
  usedCount: number
  maxUsesPerUser: number
  minOrderAmount: number
  applicableTicketIds?: string
  startDate?: string
  endDate?: string
  isActive: boolean
  description?: string
  createdAt: string
}

export default function PromoCodesPage({ params }: { params: { id: string } }) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null)
  const [validatingCode, setValidatingCode] = useState('')
  const [validationResult, setValidationResult] = useState<any>(null)

  // Load promo codes from API
  useEffect(() => {
    const load = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || ''
        const res = await fetch(`${base}/api/events/${params.id}/promo-codes`)
        if (res.ok) {
          const data = await res.json()
          setPromoCodes(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Failed to load promo codes:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  const savePromoCode = async (promoCode: Partial<PromoCode>) => {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || ''
      const isUpdate = promoCode.id

      const res = await fetch(`${base}/api/events/${params.id}/promo-codes${isUpdate ? `/${promoCode.id}` : ''}`, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promoCode)
      })

      if (!res.ok) throw new Error('Failed to save promo code')

      const saved = await res.json()

      if (isUpdate) {
        setPromoCodes(prev => prev.map(p => p.id === saved.id ? saved : p))
      } else {
        setPromoCodes(prev => [...prev, saved])
      }

      setShowModal(false)
      setEditingCode(null)
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const deletePromoCode = async (id: number) => {
    const ok = window.confirm('Delete this promo code?')
    if (!ok) return

    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || ''
      const res = await fetch(`${base}/api/events/${params.id}/promo-codes/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete promo code')

      setPromoCodes(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      alert((error as Error).message)
    }
  }

  const validatePromoCode = async () => {
    if (!validatingCode.trim()) return

    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || ''
      const res = await fetch(`${base}/api/events/${params.id}/promo-codes/validate?code=${encodeURIComponent(validatingCode)}&orderAmount=1000`, {
        method: 'POST'
      })

      if (res.ok) {
        const result = await res.json()
        setValidationResult(result)
      } else {
        setValidationResult({ valid: false, errorMessage: 'Invalid promo code' })
      }
    } catch (error) {
      setValidationResult({ valid: false, errorMessage: 'Validation failed' })
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const formatDiscount = (type: DiscountType, amount: number) => {
    if (type === 'PERCENT') {
      return `${amount}% off`
    } else {
      return `₹${amount} off`
    }
  }

  const getUsageColor = (used: number, max: number) => {
    if (max === -1) return 'text-green-600'
    const percentage = (used / max) * 100
    if (percentage < 50) return 'text-green-600'
    if (percentage < 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading promo codes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Promo Codes</h1>
          <p className="text-sm text-muted-foreground">Event ID: {params.id}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Add Promo Code
        </button>
      </div>

      {/* Promo Codes List */}
      <div className="rounded-lg border bg-white">
        <div className="border-b px-6 py-4">
          <h3 className="text-base font-medium">Promo Codes ({promoCodes.length})</h3>
        </div>
        <div className="p-6">
          {promoCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No promo codes yet</p>
              <p className="text-sm">Create your first promo code to offer discounts</p>
            </div>
          ) : (
            <div className="space-y-4">
              {promoCodes.map((promo) => (
                <div key={promo.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        promo.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {promo.isActive ? 'Active' : 'Inactive'}
                      </div>
                      <div>
                        <p className="font-medium">{promo.code}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDiscount(promo.discountType, promo.discountAmount)}
                          {promo.description && ` • ${promo.description}`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Used: <span className={getUsageColor(promo.usedCount, promo.maxUses)}>
                          {promo.usedCount}/{promo.maxUses === -1 ? '∞' : promo.maxUses}
                        </span>
                      </span>
                      {promo.minOrderAmount > 0 && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Min: ₹{promo.minOrderAmount}
                        </span>
                      )}
                      {promo.endDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Expires: {formatDate(promo.endDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingCode(promo)
                        setShowModal(true)
                      }}
                      className="rounded px-2 py-1 text-xs border hover:bg-white"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => deletePromoCode(promo.id)}
                      className="rounded px-2 py-1 text-xs text-red-700 border hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <PromoCodeModal
          promoCode={editingCode}
          onSave={savePromoCode}
          onClose={() => {
            setShowModal(false)
            setEditingCode(null)
          }}
        />
      )}
    </div>
  )
}

function PromoCodeModal({ promoCode, onSave, onClose }: {
  promoCode: PromoCode | null
  onSave: (promoCode: Partial<PromoCode>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    code: promoCode?.code || '',
    discountType: promoCode?.discountType || 'PERCENT' as DiscountType,
    discountAmount: promoCode?.discountAmount || 10,
    maxUses: promoCode?.maxUses || -1,
    maxUsesPerUser: promoCode?.maxUsesPerUser || 1,
    minOrderAmount: promoCode?.minOrderAmount || 0,
    startDate: promoCode?.startDate ? promoCode.startDate.split('T')[0] : '',
    endDate: promoCode?.endDate ? promoCode.endDate.split('T')[0] : '',
    isActive: promoCode?.isActive ?? true,
    description: promoCode?.description || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      id: promoCode?.id,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold">{promoCode ? 'Edit Promo Code' : 'Add Promo Code'}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Promo Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full rounded-md border px-3 py-2 text-sm uppercase"
                placeholder="SUMMER10"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Discount Type</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as DiscountType })}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="PERCENT">Percentage</option>
                  <option value="FIXED">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {formData.discountType === 'PERCENT' ? 'Percentage (%)' : 'Amount (₹)'}
                </label>
                <input
                  type="number"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  min="0"
                  max={formData.discountType === 'PERCENT' ? 100 : undefined}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Max Uses</label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || -1 })}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  min="-1"
                  placeholder="-1 for unlimited"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Uses Per User</label>
                <input
                  type="number"
                  value={formData.maxUsesPerUser}
                  onChange={(e) => setFormData({ ...formData, maxUsesPerUser: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Min Order Amount (₹)</label>
              <input
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-md border px-3 py-2 text-sm"
                min="0"
                step="0.01"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description (Optional)</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Summer discount for early birds"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <label className="text-sm">Active</label>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
            <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              {promoCode ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
