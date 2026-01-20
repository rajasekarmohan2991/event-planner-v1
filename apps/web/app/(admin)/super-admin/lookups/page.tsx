'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X, Search, Filter, Power, PowerOff } from 'lucide-react'

interface LookupCategory {
  id: string
  name: string
  code: string
  description: string
  is_global: boolean
  is_system: boolean
  value_count: number
}

interface LookupValue {
  id: string
  value: string
  label: string
  description?: string
  color_code?: string
  icon?: string
  sort_order: number
  is_active: boolean
  is_default: boolean
  is_system: boolean
  metadata?: any
}

export default function LookupManagementPage() {
  const [categories, setCategories] = useState<LookupCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [values, setValues] = useState<LookupValue[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    value: '',
    label: '',
    description: '',
    colorCode: '',
    icon: '',
    sortOrder: 0,
    isActive: true,
    isDefault: false
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      fetchValues(selectedCategory)
    }
  }, [selectedCategory])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/lookups')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchValues = async (categoryCode: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/lookups?category=${categoryCode}`)
      const data = await res.json()
      setValues(data.values || [])
    } catch (error) {
      console.error('Error fetching values:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddValue = async () => {
    if (!selectedCategory || !formData.value || !formData.label) {
      alert('Please fill in required fields')
      return
    }

    try {
      const res = await fetch('/api/admin/lookups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryCode: selectedCategory,
          ...formData
        })
      })

      if (res.ok) {
        setShowAddForm(false)
        resetForm()
        fetchValues(selectedCategory)
        alert('Value added successfully!')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add value')
      }
    } catch (error) {
      console.error('Error adding value:', error)
      alert('Failed to add value')
    }
  }

  const handleUpdateValue = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/lookups/values/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setEditingId(null)
        resetForm()
        if (selectedCategory) fetchValues(selectedCategory)
        alert('Value updated successfully!')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update value')
      }
    } catch (error) {
      console.error('Error updating value:', error)
      alert('Failed to update value')
    }
  }

  const handleToggleActive = async (id: string, currentLabel: string) => {
    try {
      const res = await fetch(`/api/admin/lookups/values/${id}/toggle`, {
        method: 'PATCH'
      })

      if (res.ok) {
        const data = await res.json()
        if (selectedCategory) fetchValues(selectedCategory)
        alert(data.message)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to toggle value')
      }
    } catch (error) {
      console.error('Error toggling value:', error)
      alert('Failed to toggle value')
    }
  }

  const handleDeleteValue = async (id: string, label: string) => {
    if (!confirm(`Are you sure you want to delete "${label}"?`)) return

    try {
      const res = await fetch(`/api/admin/lookups/values/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        if (selectedCategory) fetchValues(selectedCategory)
        alert('Value deleted successfully!')
      } else {
        const error = await res.json()
        alert(error.error || error.message || 'Failed to delete value')
      }
    } catch (error) {
      console.error('Error deleting value:', error)
      alert('Failed to delete value')
    }
  }

  const startEdit = (value: LookupValue) => {
    setEditingId(value.id)
    setFormData({
      value: value.value,
      label: value.label,
      description: value.description || '',
      colorCode: value.color_code || '',
      icon: value.icon || '',
      sortOrder: value.sort_order,
      isActive: value.is_active,
      isDefault: value.is_default
    })
  }

  const resetForm = () => {
    setFormData({
      value: '',
      label: '',
      description: '',
      colorCode: '',
      icon: '',
      sortOrder: 0,
      isActive: true,
      isDefault: false
    })
  }

  const filteredValues = values.filter(v =>
    v.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Lookup Management</h1>
        <p className="text-gray-600">
          Manage dynamic dropdown values for events, registrations, and system settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Categories</h2>
            {loading && !categories.length ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.code)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${selectedCategory === cat.code
                        ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{cat.name}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {cat.description}
                        </div>
                      </div>
                      <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                        {cat.value_count}
                      </span>
                    </div>
                    {cat.is_system && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                        System
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Values Panel */}
        <div className="lg:col-span-2">
          {selectedCategory ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">
                    {categories.find(c => c.code === selectedCategory)?.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {categories.find(c => c.code === selectedCategory)?.description}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Add Option
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search values..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Add Form */}
              {showAddForm && (
                <div className="p-4 bg-blue-50 border-b">
                  <h3 className="font-semibold mb-3">Add New Value</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Value (e.g., PREMIUM)*"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value.toUpperCase() })}
                      className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Label (e.g., Premium)*"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="col-span-2 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Sort Order"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                      className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm">Active</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.isDefault}
                          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm">Default</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleAddValue}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Save size={16} />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false)
                        resetForm()
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Values Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">Loading values...</td>
                      </tr>
                    ) : filteredValues.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">
                          No values found. Click "Add Option" to create one.
                        </td>
                      </tr>
                    ) : (
                      filteredValues.map(value => (
                        <tr key={value.id} className={!value.is_active ? 'bg-gray-50 opacity-60' : ''}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${value.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                              {value.is_system && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                                  System
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">{value.label}</td>
                          <td className="px-6 py-4">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">{value.value}</code>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{value.description || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              {/* Toggle Button - Available for ALL values */}
                              <button
                                onClick={() => handleToggleActive(value.id, value.label)}
                                className={`p-2 rounded ${value.is_active
                                    ? 'text-green-600 hover:bg-green-50'
                                    : 'text-gray-400 hover:bg-gray-100'
                                  }`}
                                title={value.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {value.is_active ? <Power size={16} /> : <PowerOff size={16} />}
                              </button>

                              {/* Edit Button - Available for ALL values */}
                              <button
                                onClick={() => startEdit(value)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>

                              {/* Delete Button - Only for custom values */}
                              {!value.is_system ? (
                                <button
                                  onClick={() => handleDeleteValue(value.id, value.label)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="p-2 text-gray-300 cursor-not-allowed rounded"
                                  title="System values cannot be deleted (use deactivate instead)"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Edit Modal */}
              {editingId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold mb-4">Edit Value</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Label*</label>
                        <input
                          type="text"
                          value={formData.label}
                          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Sort Order</label>
                        <input
                          type="number"
                          value={formData.sortOrder}
                          onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm">Active</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.isDefault}
                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm">Default</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={() => handleUpdateValue(editingId)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <Save size={16} />
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null)
                          resetForm()
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <Filter size={48} className="mx-auto mb-4 text-gray-400" />
              <p>Select a category from the left to manage its values</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
