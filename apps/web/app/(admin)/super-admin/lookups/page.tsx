'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X, Search, Filter } from 'lucide-react'

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
  const [categorySearch, setCategorySearch] = useState('')

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
        // alert('Value added successfully!') // Removed alert for smoother UX
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
        // alert('Value updated successfully!')
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
        // const data = await res.json()
        if (selectedCategory) fetchValues(selectedCategory)
        // alert(data.message)
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
        // alert('Value deleted successfully!')
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

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold mb-2">Lookup Management</h1>
        <p className="text-gray-600">
          Manage dynamic dropdown values for events, registrations, and system settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1 flex flex-col bg-white rounded-lg shadow min-h-0">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold mb-4">Categories</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {loading && !categories.length ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No categories match your search</div>
            ) : (
              <div className="space-y-1">
                {filteredCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.code)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${selectedCategory === cat.code
                      ? 'bg-blue-50 border border-blue-200 shadow-sm'
                      : 'hover:bg-gray-50 border border-transparent'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className={`font-medium truncate ${selectedCategory === cat.code ? 'text-blue-700' : 'text-gray-900'}`}>{cat.name}</div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {cat.description}
                        </div>
                      </div>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${selectedCategory === cat.code ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {cat.value_count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Values Panel */}
        <div className="lg:col-span-2 flex flex-col bg-white rounded-lg shadow min-h-0">
          {selectedCategory ? (
            <>
              <div className="p-4 border-b flex justify-between items-center bg-gray-50/50 rounded-t-lg">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {categories.find(c => c.code === selectedCategory)?.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {categories.find(c => c.code === selectedCategory)?.description}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Plus size={16} />
                  Add Option
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search values..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Add Form */}
              {showAddForm && (
                <div className="p-6 bg-blue-50/50 border-b animate-in slide-in-from-top-2 duration-200">
                  <h3 className="font-semibold mb-4 text-blue-900 flex items-center gap-2">
                    <Plus size={18} /> Add New Value
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Value Code*</label>
                      <input
                        type="text"
                        placeholder="E.g., PREMIUM"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      <p className="text-[10px] text-gray-500 mt-1">Uppercase, no spaces (e.g., IN_PROGRESS)</p>
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Display Label*</label>
                      <input
                        type="text"
                        placeholder="E.g., Premium Ticket"
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        placeholder="Optional description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Sort Order</label>
                      <input
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    <div className="col-span-1 flex items-end pb-2 gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isDefault}
                          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Default Selection</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4 pt-4 border-t border-blue-100">
                    <button
                      onClick={handleAddValue}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm font-medium shadow-sm"
                    >
                      <Save size={16} />
                      Save Value
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false)
                        resetForm()
                      }}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Values Table */}
              <div className="overflow-auto flex-1">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b sticky top-0 bg-white z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Label</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Value Code</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Description</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-500">
                          <div className="animate-pulse flex flex-col items-center">
                            <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 w-24 bg-gray-200 rounded"></div>
                          </div>
                        </td>
                      </tr>
                    ) : filteredValues.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <Filter className="w-8 h-8 text-gray-300 mb-2" />
                            <p className="font-medium text-gray-900">No values found</p>
                            <p className="text-sm mt-1">Try searching or add a new value.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredValues.map(value => (
                        <tr key={value.id} className={`group hover:bg-gray-50 transition-colors ${!value.is_active ? 'bg-gray-50/50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {/* Switch Toggle Button */}
                              <button
                                onClick={() => handleToggleActive(value.id, value.label)}
                                title={value.is_active ? 'One - Click to Deactivate' : 'Off - Click to Activate'}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${value.is_active ? 'bg-green-500' : 'bg-gray-200'
                                  }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${value.is_active ? 'translate-x-[16px]' : 'translate-x-0'
                                    }`}
                                />
                              </button>
                              {value.is_system && (
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] uppercase font-bold tracking-wider rounded border border-gray-200 ml-2">
                                  System
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">{value.label}</td>
                          <td className="px-6 py-4">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-700 border border-gray-200">{value.value}</code>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate" title={value.description}>
                            {value.description || '-'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEdit(value)}
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>

                              <button
                                onClick={() => handleDeleteValue(value.id, value.label)}
                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-auto overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Edit Value</h3>
                      <button onClick={() => { setEditingId(null); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Label*</label>
                        <input
                          type="text"
                          value={formData.label}
                          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                        <input
                          type="number"
                          value={formData.sortOrder}
                          onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-6 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors w-full">
                          <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="text-sm font-medium">Active</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors w-full">
                          <input
                            type="checkbox"
                            checked={formData.isDefault}
                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="text-sm font-medium">Default</span>
                        </label>
                      </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 border-t flex gap-3 justify-end">
                      <button
                        onClick={() => {
                          setEditingId(null)
                          resetForm()
                        }}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateValue(editingId)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm shadow-sm"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-500 min-h-[400px]">
              <div className="max-w-md">
                <Filter size={64} className="mx-auto mb-6 text-gray-200" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Category</h3>
                <p className="text-gray-500">Choose a category from the sidebar to manage its values, or use the search bar to find specific categories.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
