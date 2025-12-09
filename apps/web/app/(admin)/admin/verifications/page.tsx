"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Edit2, Save, X, Check } from 'lucide-react'

type VerificationItem = {
  id: string
  companyName?: string
  croNumber?: string
  riskFlags?: string
  idType?: string
  docUrl?: string
  user?: {
    name: string
    email: string
  }
}

type VerificationData = {
  organization?: { items: VerificationItem[] }
  individual?: { items: VerificationItem[] }
}

function StatusTabs({ current, onStatusChange }: { current: string, onStatusChange: (status: string) => void }) {
  const tabs = ['PENDING', 'APPROVED', 'REJECTED']
  return (
    <div className="flex gap-2 mb-4">
      {tabs.map((t) => (
        <button 
          key={t} 
          onClick={() => onStatusChange(t)}
          className={`px-3 py-1 rounded border ${current===t? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

function EditableCell({ 
  value, 
  onSave, 
  type = 'text' 
}: { 
  value: string
  onSave: (newValue: string) => void
  type?: 'text' | 'email'
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)

  const handleSave = () => {
    onSave(editValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="px-2 py-1 border rounded text-sm flex-1"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') handleCancel()
          }}
        />
        <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className="flex-1">{value || '-'}</span>
      <button 
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded"
      >
        <Edit2 className="w-3 h-3" />
      </button>
    </div>
  )
}

function ApproveRejectButtons({ id, onAction }: { id: string, onAction: (id: string, action: 'approve' | 'reject') => void }) {
  const [loading, setLoading] = useState(false)

  const handleAction = async (action: 'approve' | 'reject') => {
    setLoading(true)
    await onAction(id, action)
    setLoading(false)
  }

  return (
    <div className="flex gap-2">
      <button 
        onClick={() => handleAction('approve')}
        disabled={loading}
        className="px-2 py-1 border rounded text-green-600 hover:bg-green-50 disabled:opacity-50"
      >
        Approve
      </button>
      <button 
        onClick={() => handleAction('reject')}
        disabled={loading}
        className="px-2 py-1 border rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  )
}

export default function AdminVerificationsPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [currentStatus, setCurrentStatus] = useState('PENDING')
  const [data, setData] = useState<VerificationData>({})
  const [loading, setLoading] = useState(true)

  const userRole = String(session?.user?.role || '')
  const hasAccess = session && ['SUPER_ADMIN', 'ADMIN'].includes(userRole)

  useEffect(() => {
    const statusParam = searchParams?.get('status')
    if (statusParam) {
      setCurrentStatus(statusParam.toUpperCase())
    }
  }, [searchParams])

  const fetchVerifications = async (status: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/verifications?status=${encodeURIComponent(status)}`, { 
        cache: 'no-store',
        credentials: 'include'
      })
      if (!res.ok) throw new Error('Failed to load verifications')
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching verifications:', error)
      setData({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasAccess) {
      fetchVerifications(currentStatus)
    }
  }, [currentStatus, hasAccess])

  const handleStatusChange = (status: string) => {
    setCurrentStatus(status)
    // Update URL without page reload
    const url = new URL(window.location.href)
    url.searchParams.set('status', status)
    window.history.pushState({}, '', url.toString())
  }

  const handleFieldUpdate = async (id: string, field: string, value: string, type: 'organization' | 'individual') => {
    try {
      const res = await fetch(`/api/admin/verifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [field]: value })
      })
      
      if (res.ok) {
        // Update local state
        setData(prev => {
          const updated = { ...prev }
          if (updated[type]?.items) {
            updated[type]!.items = updated[type]!.items.map(item => 
              item.id === id ? { ...item, [field]: value } : item
            )
          }
          return updated
        })
      } else {
        alert('Failed to update field')
      }
    } catch (error) {
      console.error('Error updating field:', error)
      alert('Failed to update field')
    }
  }

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/admin/verifications/${id}/${action}`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (res.ok) {
        // Refresh data
        fetchVerifications(currentStatus)
      } else {
        alert(`Failed to ${action} verification`)
      }
    } catch (error) {
      console.error(`Error ${action}ing verification:`, error)
      alert(`Failed to ${action} verification`)
    }
  }

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>
  }

  if (!hasAccess) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Forbidden</h1>
        <p>You do not have access to this page.</p>
      </div>
    )
  }
  
  if (loading) {
    return <div className="p-6">Loading verifications...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Verifications</h1>
        <StatusTabs current={currentStatus} onStatusChange={handleStatusChange} />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Organizations</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Company</th>
                <th className="p-2 text-left">CRO</th>
                <th className="p-2 text-left">Risk Flags</th>
                <th className="p-2 text-left">User</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.organization?.items?.map((o) => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">
                    <EditableCell 
                      value={o.companyName || ''} 
                      onSave={(value) => handleFieldUpdate(o.id, 'companyName', value, 'organization')}
                    />
                  </td>
                  <td className="p-2">
                    <EditableCell 
                      value={o.croNumber || ''} 
                      onSave={(value) => handleFieldUpdate(o.id, 'croNumber', value, 'organization')}
                    />
                  </td>
                  <td className="p-2">
                    <EditableCell 
                      value={o.riskFlags || ''} 
                      onSave={(value) => handleFieldUpdate(o.id, 'riskFlags', value, 'organization')}
                    />
                  </td>
                  <td className="p-2">
                    <div className="text-sm">
                      <div className="font-medium">{o.user?.name || '-'}</div>
                      <div className="text-gray-500">{o.user?.email || '-'}</div>
                    </div>
                  </td>
                  <td className="p-2">
                    <ApproveRejectButtons id={o.id} onAction={handleAction} />
                  </td>
                </tr>
              )) || []}
              {(!data.organization?.items || data.organization.items.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    No organization verifications found for {currentStatus.toLowerCase()} status
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <h2 className="text-xl font-semibold">Individuals</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">ID Type</th>
                <th className="p-2 text-left">Document</th>
                <th className="p-2 text-left">User</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.individual?.items?.map((i) => (
                <tr key={i.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">
                    <EditableCell 
                      value={i.idType || ''} 
                      onSave={(value) => handleFieldUpdate(i.id, 'idType', value, 'individual')}
                    />
                  </td>
                  <td className="p-2">
                    {i.docUrl ? (
                      <a className="text-blue-600 underline hover:text-blue-800" href={i.docUrl} target="_blank" rel="noopener noreferrer">
                        View Document
                      </a>
                    ) : (
                      <span className="text-gray-500">No document</span>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="text-sm">
                      <div className="font-medium">{i.user?.name || '-'}</div>
                      <div className="text-gray-500">{i.user?.email || '-'}</div>
                    </div>
                  </td>
                  <td className="p-2">
                    <ApproveRejectButtons id={i.id} onAction={handleAction} />
                  </td>
                </tr>
              )) || []}
              {(!data.individual?.items || data.individual.items.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    No individual verifications found for {currentStatus.toLowerCase()} status
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
