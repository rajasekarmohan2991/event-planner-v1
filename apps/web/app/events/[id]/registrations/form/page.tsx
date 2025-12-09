"use client"

import { useEffect, useState } from 'react'
import { Plus, Trash2, GripVertical, Eye } from 'lucide-react'

type FieldType = 'text' | 'email' | 'tel' | 'number' | 'select' | 'checkbox' | 'textarea' | 'file'

type Field = {
  id?: number
  key: string
  label: string
  type: FieldType
  required: boolean
  optionsJson?: string
  orderIndex: number
  visibility: string
}

export default function RegistrationFormPage({ params }: { params: { id: string } }) {
  const [fields, setFields] = useState<Field[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [editingField, setEditingField] = useState<Field | null>(null)
  const [showFieldModal, setShowFieldModal] = useState(false)

  // Load fields from API
  useEffect(() => {
    const load = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || ''
        const res = await fetch(`${base}/api/events/${params.id}/registrations/form`)
        if (!res.ok) return
        const data = await res.json()
        setFields(Array.isArray(data) ? data : [])
      } catch {}
    }
    load()
  }, [params.id])

  const saveField = async (field: Field) => {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || ''
      if (field.id) {
        const res = await fetch(`${base}/api/events/${params.id}/registrations/form/fields/${field.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(field)
        })
        if (!res.ok) throw new Error('Failed to update field')
        const updated = await res.json()
        setFields(prev => prev.map(f => f.id === updated.id ? updated : f))
      } else {
        const res = await fetch(`${base}/api/events/${params.id}/registrations/form/fields`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...field, orderIndex: fields.length })
        })
        if (!res.ok) throw new Error('Failed to create field')
        const created = await res.json()
        setFields(prev => [...prev, created])
      }
    } catch (e) {
      alert((e as any)?.message || 'Failed to save field')
    }
  }

  const deleteField = async (id: number) => {
    const ok = window.confirm('Delete this field?')
    if (!ok) return
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || ''
      const res = await fetch(`${base}/api/events/${params.id}/registrations/form/fields/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete field')
      setFields(prev => prev.filter(f => f.id !== id))
    } catch (e) {
      alert((e as any)?.message || 'Failed to delete field')
    }
  }

  const openFieldModal = (field?: Field) => {
    setEditingField(field || { key: '', label: '', type: 'text', required: false, orderIndex: fields.length, visibility: 'PUBLIC' })
    setShowFieldModal(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Registration Form Builder</h1>
          <p className="text-sm text-muted-foreground">Event ID: {params.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" /> {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <button
            onClick={() => openFieldModal()}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Add Field
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Field List */}
        <div className="rounded-lg border bg-white p-4 space-y-2">
          <div className="text-sm font-medium mb-2">Form Fields ({fields.length})</div>
          {fields.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">No fields yet. Add your first field.</div>
          ) : (
            fields.map((f, i) => (
              <div key={f.id || i} className="flex items-center gap-2 rounded-md border p-3 bg-slate-50">
                <GripVertical className="h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{f.label}</div>
                  <div className="text-xs text-muted-foreground">{f.type} {f.required && '(required)'}</div>
                </div>
                <button
                  onClick={() => openFieldModal(f)}
                  className="rounded px-2 py-1 text-xs border hover:bg-white"
                >Edit</button>
                <button
                  onClick={() => f.id && deleteField(f.id)}
                  className="rounded px-2 py-1 text-xs text-red-700 border hover:bg-red-50"
                ><Trash2 className="h-3 w-3" /></button>
              </div>
            ))
          )}
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="rounded-lg border bg-white p-4">
            <div className="text-sm font-medium mb-4">Form Preview</div>
            <div className="space-y-4">
              {fields.map((f, i) => (
                <div key={f.id || i}>
                  <label className="block text-sm font-medium mb-1">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </label>
                  {f.type === 'textarea' ? (
                    <textarea className="w-full rounded-md border px-3 py-2 text-sm" rows={3} disabled />
                  ) : f.type === 'select' ? (
                    <select className="w-full rounded-md border px-3 py-2 text-sm" disabled>
                      <option>Select...</option>
                      {f.optionsJson && JSON.parse(f.optionsJson).map((opt: string, idx: number) => (
                        <option key={idx}>{opt}</option>
                      ))}
                    </select>
                  ) : f.type === 'checkbox' ? (
                    <div className="space-y-1">
                      {f.optionsJson && JSON.parse(f.optionsJson).map((opt: string, idx: number) => (
                        <label key={idx} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" disabled /> {opt}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input type={f.type} className="w-full rounded-md border px-3 py-2 text-sm" disabled />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Field Modal */}
      {showFieldModal && editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border bg-white shadow-lg">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold">{editingField.id ? 'Edit Field' : 'Add Field'}</h3>
              <button onClick={() => setShowFieldModal(false)} className="text-slate-500 hover:text-slate-700">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Field Key</label>
                <input
                  value={editingField.key}
                  onChange={(e) => setEditingField({ ...editingField, key: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="e.g., firstName"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Label</label>
                <input
                  value={editingField.label}
                  onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="e.g., First Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={editingField.type}
                  onChange={(e) => setEditingField({ ...editingField, type: e.target.value as FieldType })}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="tel">Phone</option>
                  <option value="number">Number</option>
                  <option value="textarea">Textarea</option>
                  <option value="select">Select (Dropdown)</option>
                  <option value="checkbox">Checkbox (Multiple)</option>
                  <option value="file">File Upload</option>
                </select>
              </div>
              {(editingField.type === 'select' || editingField.type === 'checkbox') && (
                <div>
                  <label className="block text-sm font-medium mb-1">Options (comma-separated)</label>
                  <input
                    value={editingField.optionsJson ? JSON.parse(editingField.optionsJson).join(', ') : ''}
                    onChange={(e) => setEditingField({ ...editingField, optionsJson: JSON.stringify(e.target.value.split(',').map(s => s.trim()).filter(Boolean)) })}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingField.required}
                  onChange={(e) => setEditingField({ ...editingField, required: e.target.checked })}
                />
                <label className="text-sm">Required field</label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <button onClick={() => setShowFieldModal(false)} className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
              <button
                onClick={async () => {
                  await saveField(editingField)
                  setShowFieldModal(false)
                }}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
