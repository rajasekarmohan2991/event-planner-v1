'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Plus, Edit, Trash2, Save, X, Search, Database,
  Settings, Check, MoreHorizontal, RefreshCw, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { LoadingSpinner } from '@/components/loading'

interface LookupItem {
  id: string
  value: string
  label: string
  description?: string
  sortOrder: number
  isActive: boolean
  isDefault: boolean
  isSystem: boolean
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
  const { toast } = useToast()

  const [categories, setCategories] = useState<LookupCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<LookupCategory | null>(null)

  // Search States
  const [searchTerm, setSearchTerm] = useState('')

  // Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<LookupItem | null>(null)

  // Form States
  const [categoryForm, setCategoryForm] = useState({ name: '', label: '', description: '' })
  const [optionForm, setOptionForm] = useState({ value: '', label: '', description: '', sortOrder: 0 })
  const [saving, setSaving] = useState(false)

  // Auth Guard
  useEffect(() => {
    if (status === 'loading') return
    if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard')
    }
  }, [session, status, router])

  // Initial Load
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
        // If we have a selected category, refresh it
        if (selectedCategory) {
          const updated = data.categories.find((c: any) => c.id === selectedCategory.id)
          if (updated) setSelectedCategory(updated)
        } else if (data.categories.length > 0) {
          // Select first by default if none selected
          setSelectedCategory(data.categories[0])
        }
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
      toast({ title: 'Error', description: 'Failed to load lookup data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSeedDefaults = async () => {
    if (!confirm('This will populate the database with all standard lookup values. Continue?')) return

    try {
      setSeeding(true)
      const res = await fetch('/api/admin/lookup/seed', { method: 'POST' })
      if (res.ok) {
        toast({ title: 'Success', description: 'System lookups seeded successfully!' })
        await loadCategories()
      } else {
        throw new Error('Seeding failed')
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to seed defaults', variant: 'destructive' })
    } finally {
      setSeeding(false)
    }
  }

  const handleCreateCategory = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/lookup/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Category created' })
        setIsCategoryModalOpen(false)
        setCategoryForm({ name: '', label: '', description: '' })
        await loadCategories()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.message, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create category', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveOption = async () => {
    if (!selectedCategory) return

    try {
      setSaving(true)
      const url = editingOption
        ? `/api/admin/lookup/items/${editingOption.id}`
        : `/api/admin/lookup/categories/${selectedCategory.id}/items`

      const method = editingOption ? 'PUT' : 'POST'

      // Auto-uppercase value
      const payload = { ...optionForm, value: optionForm.value.toUpperCase().replace(/\s+/g, '_') }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast({ title: 'Success', description: editingOption ? 'Option updated' : 'Option added' })
        setIsOptionModalOpen(false)
        setEditingOption(null)
        setOptionForm({ value: '', label: '', description: '', sortOrder: 0 })
        await loadCategories()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.message, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save option', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOption = async (item: LookupItem) => {
    if (!confirm('Are you sure? This cannot be undone.')) return

    try {
      const res = await fetch(`/api/admin/lookup/items/${item.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Option deleted' })
        await loadCategories()
      } else {
        const err = await res.json()
        toast({ title: 'Error', description: err.message, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete option', variant: 'destructive' })
    }
  }

  const handleToggleActive = async (item: LookupItem) => {
    try {
      const res = await fetch(`/api/admin/lookup/items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      })
      if (res.ok) await loadCategories()
    } catch (error) {
      console.error(error)
    }
  }

  // Filter Categories
  const filteredCategories = categories.filter(c =>
    c.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Lookup Management</h1>
          <p className="text-sm text-gray-500">
            Configure system-wide dropdown options and enum values
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => loadCategories()} disabled={loading}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSeedDefaults} disabled={seeding}>
            <Database className="w-4 h-4 mr-2" />
            {seeding ? 'Seeding...' : 'Initialize System Defaults'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

        {/* Left Sidebar: Categories List */}
        <Card className="lg:col-span-3 flex flex-col h-full border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search categories..."
                className="pl-9 bg-gray-50 border-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" /> New Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Lookup Category</DialogTitle>
                  <DialogDescription>Add a new group for dropdown options.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Internal Name (Slug)</label>
                    <Input
                      placeholder="e.g. event_category"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Display Label</label>
                    <Input
                      placeholder="e.g. Event Category"
                      value={categoryForm.label}
                      onChange={(e) => setCategoryForm({ ...categoryForm, label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      placeholder="Optional description"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateCategory} disabled={saving}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No categories found</div>
            ) : (
              filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "w-full text-left px-3 py-3 rounded-md text-sm transition-all duration-200 group relative flex items-center justify-between",
                    selectedCategory?.id === cat.id
                      ? "bg-indigo-50 text-indigo-700 font-medium border-l-4 border-indigo-600 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <span className="truncate">{cat.label}</span>
                  <Badge variant="secondary" className={cn(
                    "ml-2 text-[10px] h-5 px-1.5 min-w-[1.5rem] justify-center",
                    selectedCategory?.id === cat.id ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"
                  )}>
                    {cat.options.length}
                  </Badge>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Right Panel: Options Management */}
        <Card className="lg:col-span-9 h-full flex flex-col border-gray-200 shadow-sm overflow-hidden">
          {selectedCategory ? (
            <>
              <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-white z-10">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    {selectedCategory.label}
                    <Badge variant="outline" className="font-mono text-xs text-gray-400">
                      {selectedCategory.name}
                    </Badge>
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{selectedCategory.description || 'No description provided'}</p>
                </div>
                <Button onClick={() => {
                  setEditingOption(null);
                  setOptionForm({ value: '', label: '', description: '', sortOrder: selectedCategory.options.length });
                  setIsOptionModalOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Option
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-0">
                <Table>
                  <TableHeader className="bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
                    <TableRow>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCategory.options.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-64 text-center text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <Database className="w-8 h-8 opacity-20" />
                            <p>No options defined for this category.</p>
                            <Button variant="link" onClick={() => setIsOptionModalOpen(true)}>Add your first option</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedCategory.options.map((option) => (
                        <TableRow key={option.id} className="group hover:bg-gray-50/50">
                          <TableCell>
                            <button
                              onClick={() => handleToggleActive(option)}
                              className={cn(
                                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                                option.isActive ? "bg-emerald-500" : "bg-gray-300"
                              )}
                              title={option.isActive ? 'Click to disable' : 'Click to enable'}
                            >
                              <span
                                className={cn(
                                  "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                                  option.isActive ? "translate-x-5" : "translate-x-1"
                                )}
                              />
                            </button>
                          </TableCell>
                          <TableCell className="font-medium">
                            {option.label}
                            {option.isDefault && (
                              <Badge variant="secondary" className="ml-2 text-[10px] bg-blue-50 text-blue-700 border-blue-100">Default</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-gray-500">{option.value}</TableCell>
                          <TableCell className="text-gray-500 text-sm">{option.description || '-'}</TableCell>
                          <TableCell>
                            {option.isSystem && (
                              <Badge variant="outline" className="text-[10px] px-1 h-5 border-amber-200 bg-amber-50 text-amber-700 flex w-fit gap-1">
                                <AlertCircle className="w-3 h-3" /> System
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-indigo-600"
                                onClick={() => {
                                  setEditingOption(option);
                                  setOptionForm({
                                    value: option.value,
                                    label: option.label,
                                    description: option.description || '',
                                    sortOrder: option.sortOrder
                                  });
                                  setIsOptionModalOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-red-600"
                                onClick={() => handleDeleteOption(option)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
              <Settings className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Select a Category</h3>
              <p className="max-w-xs text-center mt-2">Choose a category from the sidebar to manage its dropdown options.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Option Add/Edit Modal */}
      <Dialog open={isOptionModalOpen} onOpenChange={setIsOptionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOption ? 'Edit Option' : 'Add New Option'}</DialogTitle>
            <DialogDescription>
              {editingOption ? 'Update existing dropdown value.' : `Add a value to ${selectedCategory?.label}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Internal Value (System)</label>
              <Input
                placeholder="e.g. CONFERENCE"
                value={optionForm.value}
                onChange={(e) => setOptionForm({ ...optionForm, value: e.target.value.toUpperCase() })}
                disabled={!!editingOption} // Lock value on edit
              />
              <p className="text-xs text-muted-foreground">Unique identifier used in code/db. Uppercase recommended.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Label</label>
              <Input
                placeholder="e.g. Conference"
                value={optionForm.label}
                onChange={(e) => setOptionForm({ ...optionForm, label: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Short description"
                value={optionForm.description}
                onChange={(e) => setOptionForm({ ...optionForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort Order</label>
              <Input
                type="number"
                value={optionForm.sortOrder}
                onChange={(e) => setOptionForm({ ...optionForm, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOptionModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveOption} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
