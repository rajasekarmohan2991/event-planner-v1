'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'

interface LookupItem {
  id: string
  value: string
  label: string
  description?: string
  sortOrder: number
  isActive: boolean
  isDefault: boolean
}

interface LookupCategory {
  id: string
  name: string
  label: string
  description?: string
  isActive: boolean
  options: LookupItem[]
}

export default function LookupManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<LookupCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<LookupCategory | null>(null)
  const [editingItem, setEditingItem] = useState<LookupItem | null>(null)
  const [newItem, setNewItem] = useState({ value: '', label: '', description: '', sortOrder: 0 })
  const [saving, setSaving] = useState(false)

  // Check if user is SUPER_ADMIN
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/login')
      return
    }
    if ((session.user as any)?.role !== 'SUPER_ADMIN') {
      alert('Access Denied: Super Admin only')
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    if ((session?.user as any)?.role === 'SUPER_ADMIN') {
      loadCategories()
    }
  }, [session])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/lookup/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async () => {
    if (!selectedCategory || !newItem.value || !newItem.label) return

    try {
      setSaving(true)
      const res = await fetch(`/api/admin/lookup/categories/${selectedCategory.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      })

      if (res.ok) {
        setNewItem({ value: '', label: '', description: '', sortOrder: 0 })
        await loadCategories()
        alert('✅ Option added successfully!')
      } else {
        const data = await res.json()
        alert('❌ ' + (data.message || 'Failed to add option'))
      }
    } catch (error) {
      console.error('Failed to add item:', error)
      alert('❌ Failed to add option')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateItem = async (item: LookupItem) => {
    if (!editingItem) return

    try {
      setSaving(true)
      const res = await fetch(`/api/admin/lookup/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      })

      if (res.ok) {
        setEditingItem(null)
        await loadCategories()
        alert('✅ Option updated successfully!')
      } else {
        const data = await res.json()
        alert('❌ ' + (data.message || 'Failed to update option'))
      }
    } catch (error) {
      console.error('Failed to update item:', error)
      alert('❌ Failed to update option')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this option? This action cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      const res = await fetch(`/api/admin/lookup/items/${itemId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await loadCategories()
        alert('✅ Option deleted successfully!')
      } else {
        const data = await res.json()
        alert('❌ ' + (data.message || 'Failed to delete option'))
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
      alert('❌ Failed to delete option')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (item: LookupItem) => {
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/lookup/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, isActive: !item.isActive }),
      })

      if (res.ok) {
        await loadCategories()
      }
    } catch (error) {
      console.error('Failed to toggle active:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSetDefault = async (item: LookupItem) => {
    if (item.isDefault) return
    
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/lookup/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, isDefault: true }),
      })

      if (res.ok) {
        await loadCategories()
      } else {
        alert('❌ Failed to set default')
      }
    } catch (error) {
      console.error('Failed to set default:', error)
      alert('❌ Failed to set default')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lookup Data Management</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage dropdown options for events, tickets, and other entities
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories List */}
        <div className="lg:col-span-1 bg-white rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-4">Categories</h2>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedCategory?.id === category.id
                    ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">{category.label}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {category.options.length} items
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Items Management */}
        <div className="lg:col-span-2 bg-white rounded-lg border p-6">
          {selectedCategory ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">{selectedCategory.label}</h2>
                  <p className="text-sm text-gray-600">{selectedCategory.description}</p>
                </div>
              </div>

              {/* Add New Item Form */}
              <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-indigo-900 mb-3">Add New Option</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Value (e.g., CONFERENCE)"
                    value={newItem.value}
                    onChange={(e) => setNewItem({ ...newItem, value: e.target.value.toUpperCase() })}
                    className="px-3 py-2 border rounded-md text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Label (e.g., Conference)"
                    value={newItem.label}
                    onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                    className="px-3 py-2 border rounded-md text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="px-3 py-2 border rounded-md text-sm col-span-2"
                  />
                  <button
                    onClick={handleAddItem}
                    disabled={!newItem.value || !newItem.label || saving}
                    className="col-span-2 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    {saving ? 'Adding...' : 'Add Option'}
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h3 className="font-medium text-gray-700 mb-3">Current Options</h3>
                {selectedCategory.options.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No options yet. Add your first option above.
                  </div>
                ) : (
                  selectedCategory.options.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        editingItem?.id === item.id ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'
                      }`}
                    >
                      {editingItem?.id === item.id ? (
                        <>
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={editingItem.value}
                              onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value.toUpperCase() })}
                              className="w-full px-2 py-1 border rounded text-sm"
                              placeholder="Value"
                            />
                            <input
                              type="text"
                              value={editingItem.label}
                              onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                              placeholder="Label"
                            />
                            <input
                              type="text"
                              value={editingItem.description || ''}
                              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                              placeholder="Description"
                            />
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <button
                              onClick={() => handleUpdateItem(item)}
                              disabled={saving}
                              className="p-2 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                              title="Save"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              disabled={saving}
                              className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-900">{item.label}</div>
                              {!item.isActive && (
                                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">Value: {item.value}</div>
                            {item.description && (
                              <div className="text-xs text-gray-600 mt-1">{item.description}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSetDefault(item)}
                              disabled={saving || item.isDefault}
                              className={`px-2 py-1 text-xs rounded ${
                                item.isDefault
                                  ? 'bg-blue-100 text-blue-700 cursor-default'
                                  : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                              } disabled:opacity-50`}
                              title={item.isDefault ? 'Already Default' : 'Set as Default'}
                            >
                              {item.isDefault ? 'Default' : 'Make Default'}
                            </button>
                            <button
                              onClick={() => handleToggleActive(item)}
                              disabled={saving}
                              className={`px-2 py-1 text-xs rounded ${
                                item.isActive
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              } disabled:opacity-50`}
                              title={item.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {item.isActive ? 'Active' : 'Inactive'}
                            </button>
                            <button
                              onClick={() => setEditingItem(item)}
                              disabled={saving}
                              className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              disabled={saving || item.isDefault}
                              className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              title={item.isDefault ? 'Cannot delete default option' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <p>Select a category to manage its options</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
