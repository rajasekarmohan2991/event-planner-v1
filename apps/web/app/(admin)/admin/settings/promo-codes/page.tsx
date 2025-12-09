'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Check, X, Percent, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'

type PromoCode = {
  id: string
  code: string
  discountType: 'PERCENT' | 'FIXED'
  discountValue: number
  maxUses: number | null
  maxUsesPerUser: number | null
  minOrderAmount: number
  startDate: string | null
  endDate: string | null
  active: boolean
  usageCount: number
  createdAt: string
}

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENT' as 'PERCENT' | 'FIXED',
    discountValue: 0,
    maxUses: '',
    maxUsesPerUser: '',
    minOrderAmount: 0,
    startDate: '',
    endDate: '',
    active: true
  })

  const loadPromoCodes = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/promo-codes/db', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setPromoCodes(data)
      }
    } catch (error) {
      console.error('Error loading promo codes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPromoCodes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload = {
        ...formData,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        maxUsesPerUser: formData.maxUsesPerUser ? parseInt(formData.maxUsesPerUser) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null
      }

      const url = editingId ? '/api/admin/promo-codes/db' : '/api/admin/promo-codes/db'
      const method = editingId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload)
      })

      if (res.ok) {
        alert(editingId ? 'Promo code updated!' : 'Promo code created!')
        setShowForm(false)
        setEditingId(null)
        resetForm()
        loadPromoCodes()
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to save promo code')
    }
  }

  const handleEdit = (promoCode: PromoCode) => {
    setFormData({
      code: promoCode.code,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      maxUses: promoCode.maxUses?.toString() || '',
      maxUsesPerUser: promoCode.maxUsesPerUser?.toString() || '',
      minOrderAmount: promoCode.minOrderAmount,
      startDate: promoCode.startDate?.split('T')[0] || '',
      endDate: promoCode.endDate?.split('T')[0] || '',
      active: promoCode.active
    })
    setEditingId(promoCode.id)
    setShowForm(true)
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/promo-codes/db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentActive })
      })

      if (res.ok) {
        loadPromoCodes()
      }
    } catch (error) {
      alert('Failed to toggle promo code status')
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'PERCENT',
      discountValue: 0,
      maxUses: '',
      maxUsesPerUser: '',
      minOrderAmount: 0,
      startDate: '',
      endDate: '',
      active: true
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promo Codes Management</h1>
          <p className="text-sm text-gray-600">Create and manage discount codes for events</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            resetForm()
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          New Promo Code
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Promo Code' : 'Create New Promo Code'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="SUMMER25"
                  required
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount Type *</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={!!editingId}
                >
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Discount Value *</label>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder={formData.discountType === 'PERCENT' ? '25' : '500'}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min Order Amount (₹)</label>
                <input
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Max Uses (Total)</label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Unlimited"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Uses Per User</label>
                <input
                  type="number"
                  value={formData.maxUsesPerUser}
                  onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Unlimited"
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded"
              />
              <label className="text-sm font-medium">Active</label>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {editingId ? 'Update' : 'Create'} Promo Code
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  resetForm()
                }}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading promo codes...</div>
        ) : promoCodes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No promo codes yet. Create your first one!</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">Code</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Discount</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Usage</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Valid Period</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((code) => (
                <tr key={code.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-indigo-600">{code.code}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {code.discountType === 'PERCENT' ? (
                        <><Percent className="w-4 h-4" /> {code.discountValue}%</>
                      ) : (
                        <><DollarSign className="w-4 h-4" /> ₹{code.discountValue}</>
                      )}
                    </div>
                    {code.minOrderAmount > 0 && (
                      <div className="text-xs text-gray-500">Min: ₹{code.minOrderAmount}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      {code.usageCount} / {code.maxUses || '∞'}
                    </div>
                    {code.maxUsesPerUser && (
                      <div className="text-xs text-gray-500">Max {code.maxUsesPerUser}/user</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {code.startDate && <div>From: {new Date(code.startDate).toLocaleDateString()}</div>}
                    {code.endDate && <div>To: {new Date(code.endDate).toLocaleDateString()}</div>}
                    {!code.startDate && !code.endDate && <span className="text-gray-400">No limit</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(code.id, code.active)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        code.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {code.active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {code.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleEdit(code)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
