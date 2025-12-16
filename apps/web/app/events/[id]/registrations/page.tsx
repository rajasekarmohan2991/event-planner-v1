"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Clock, Users, UserCheck, UserX, Edit, ChevronDown, Mail, UserPlus } from "lucide-react"

type Registration = {
  id: string
  eventId: number
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  jobTitle: string
  status: string
  type: string
  approvedAt?: string | null
  approvedBy?: string | null
  cancelledAt?: string | null
  cancelReason?: string | null
  checkedIn: boolean
  checkedInAt?: string | null
  createdAt: string
  registeredAt: string
}

type RegistrationResponse = {
  registrations: Registration[]
  pagination: {
    page: number
    size: number
    total: number
    totalPages: number
  }
}

export default function RegistrationsOverview({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const [eventId, setEventId] = useState<string>('')
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [pagination, setPagination] = useState({ page: 0, size: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([])
  const [bulkActionLoading, setBulkActionLoading] = useState<boolean>(false)
  const [showAddMenu, setShowAddMenu] = useState<boolean>(false)

  // Handle params being a Promise in Next.js 15
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await Promise.resolve(params)
      setEventId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  const loadRegistrations = async (status = selectedStatus) => {
    if (!eventId) return
    setLoading(true)
    try {
      const params_obj = new URLSearchParams({
        page: '0',
        size: '1000' // Load all registrations
      })
      if (status !== 'all') params_obj.set('status', status)
      
      const res = await fetch(`/api/events/${eventId}/registrations?${params_obj}`, { 
        cache: 'no-store',
        next: { revalidate: 0 },
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      console.log('📋 Registration API response status:', res.status)
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('📋 Registration API error:', res.status, errorText)
        throw new Error(`API Error: ${res.status} - ${errorText}`)
      }
      
      const data: RegistrationResponse = await res.json()
      console.log('📋 Registration API data:', data)
      
      if (data.registrations) {
        setRegistrations(data.registrations)
        setPagination(data.pagination)
        console.log('📋 Set registrations:', data.registrations.length, 'items')
      } else {
        // Fallback for old API format
        setRegistrations(Array.isArray(data) ? data : [])
        setPagination({ page: 0, size: 20, total: Array.isArray(data) ? data.length : 0, totalPages: 1 })
        console.log('📋 Used fallback format')
      }
    } catch (error) {
      console.error('Error loading registrations:', error)
      setRegistrations([])
      setPagination({ page: 0, size: 20, total: 0, totalPages: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (eventId) {
      loadRegistrations()
    }
  }, [eventId, selectedStatus])

  const handleApproveRegistration = async (registrationId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/registrations/${registrationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Approved via registration management' })
      })
      
      if (res.ok) {
        await loadRegistrations()
        alert('Registration approved successfully!')
      } else {
        const error = await res.json()
        alert(`Failed to approve: ${error.message}`)
      }
    } catch (error) {
      alert('Error approving registration')
    }
  }

  const handleCancelRegistration = async (registrationId: string) => {
    const reason = prompt('Enter cancellation reason:')
    if (!reason) return
    
    try {
      const res = await fetch(`/api/events/${eventId}/registrations/${registrationId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      
      if (res.ok) {
        await loadRegistrations()
        alert('Registration cancelled successfully!')
      } else {
        const error = await res.json()
        alert(`Failed to cancel: ${error.message}`)
      }
    } catch (error) {
      alert('Error cancelling registration')
    }
  }

  const handleBulkApprove = async () => {
    if (selectedRegistrations.length === 0) {
      alert('Please select registrations to approve')
      return
    }
    
    setBulkActionLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/registrations/bulk-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          registrationIds: selectedRegistrations,
          notes: 'Bulk approved via registration management'
        })
      })
      
      if (res.ok) {
        const result = await res.json()
        await loadRegistrations()
        setSelectedRegistrations([])
        alert(`Bulk approval completed: ${result.summary.approved} approved, ${result.summary.failed} failed`)
      } else {
        const error = await res.json()
        alert(`Bulk approval failed: ${error.message}`)
      }
    } catch (error) {
      alert('Error during bulk approval')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'CANCELLED': return <XCircle className="w-4 h-4 text-red-600" />
      case 'PENDING': return <Clock className="w-4 h-4 text-yellow-600" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-700 bg-green-50 border-green-200'
      case 'CANCELLED': return 'text-red-700 bg-red-50 border-red-200'
      case 'PENDING': return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const pendingCount = registrations.filter(r => r.status === 'PENDING').length
  const approvedCount = registrations.filter(r => r.status === 'APPROVED').length
  const cancelledCount = registrations.filter(r => r.status === 'CANCELLED').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registration Management</h1>
          <p className="text-sm text-gray-600">Event ID: {eventId}</p>
        </div>
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Add Registration
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {/* Dropdown Menu */}
          {showAddMenu && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowAddMenu(false)}
              ></div>
              
              {/* Menu */}
              <div className="absolute right-0 top-12 z-20 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                <div className="py-1">
                  <Link
                    href={`/events/${eventId}/register`}
                    onClick={() => setShowAddMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
                      <UserPlus className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Open Registration</div>
                      <div className="text-xs text-gray-500">Direct registration form</div>
                    </div>
                  </Link>
                  
                  <Link
                    href={`/events/${eventId}/invites`}
                    onClick={() => setShowAddMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-t"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50">
                      <Mail className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Send Invites</div>
                      <div className="text-xs text-gray-500">Invite-only registration</div>
                    </div>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          href={`/events/${eventId}/registrations/approvals`}
          className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border-2 border-green-200 hover:border-green-300 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-900">Registration Approvals</h3>
              </div>
              <p className="text-sm text-green-700">Review and approve pending registrations</p>
              {pendingCount > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  {pendingCount} Pending
                </div>
              )}
            </div>
            <ChevronDown className="w-6 h-6 text-green-600 transform -rotate-90 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link 
          href={`/events/${eventId}/registrations/cancellation-approvals`}
          className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-lg border-2 border-red-200 hover:border-red-300 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-red-900">Cancellation Approvals</h3>
              </div>
              <p className="text-sm text-red-700">Review and process cancellation requests</p>
              {cancelledCount > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  <UserX className="w-4 h-4" />
                  {cancelledCount} Cancelled
                </div>
              )}
            </div>
            <ChevronDown className="w-6 h-6 text-red-600 transform -rotate-90 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-gray-600">Pending</span>
          </div>
          <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Approved</span>
          </div>
          <div className="text-2xl font-bold text-green-700">{approvedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-gray-600">Cancelled</span>
          </div>
          <div className="text-2xl font-bold text-red-700">{cancelledCount}</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by status:</label>
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        
        {selectedRegistrations.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{selectedRegistrations.length} selected</span>
            <button
              onClick={handleBulkApprove}
              disabled={bulkActionLoading}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {bulkActionLoading ? 'Approving...' : 'Bulk Approve'}
            </button>
          </div>
        )}
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 w-12">
                <input
                  type="checkbox"
                  checked={selectedRegistrations.length === registrations.length && registrations.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRegistrations(registrations.map(r => r.id))
                    } else {
                      setSelectedRegistrations([])
                    }
                  }}
                  className="rounded"
                />
              </th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Registered</th>
              <th className="text-left px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-8 text-center text-gray-500" colSpan={8}>Loading registrations...</td></tr>
            ) : registrations.length === 0 ? (
              <tr><td className="px-4 py-8 text-center text-gray-500" colSpan={8}>No registrations found</td></tr>
            ) : registrations.map(registration => (
              <tr key={registration.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRegistrations.includes(registration.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRegistrations([...selectedRegistrations, registration.id])
                      } else {
                        setSelectedRegistrations(selectedRegistrations.filter(id => id !== registration.id))
                      }
                    }}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3 font-medium">
                  {registration.firstName} {registration.lastName}
                </td>
                <td className="px-4 py-3 text-gray-600">{registration.email}</td>
                <td className="px-4 py-3">
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(registration.status)}`}>
                    {getStatusIcon(registration.status)}
                    {registration.status}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{registration.type}</td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(registration.registeredAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button className="text-indigo-600 hover:text-indigo-900 p-1" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => loadRegistrations(selectedStatus, pagination.page - 1)}
            disabled={pagination.page <= 0 || loading}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page + 1} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <button
            onClick={() => loadRegistrations(selectedStatus, pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages - 1 || loading}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
