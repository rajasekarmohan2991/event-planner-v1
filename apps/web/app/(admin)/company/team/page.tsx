'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { UserPlus, Mail, Shield, Calendar, Edit2, Trash2, X, CheckCircle, XCircle, Clock } from 'lucide-react'

type TeamInvite = {
  id: string
  name: string
  email: string
  role: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  invitedAt: string
  respondedAt?: string
}

const TEAM_ROLES = [
  { value: 'EVENT_MANAGER', label: 'Event Manager', description: 'Can create and manage events' },
  { value: 'STAFF', label: 'Staff', description: 'Can manage registrations and check-ins' },
  { value: 'VIEWER', label: 'Viewer', description: 'Read-only access' }
]

export default function TeamInvitationsPage() {
  const { data: session } = useSession()
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingInvite, setEditingInvite] = useState<TeamInvite | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', role: 'EVENT_MANAGER' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadInvites()
  }, [])

  async function loadInvites() {
    try {
      setLoading(true)
      const res = await fetch('/api/company/team/invites')
      if (!res.ok) throw new Error('Failed to load invites')
      const data = await res.json()
      setInvites(data.invites || [])
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSaving(true)
      setMessage(null)

      const url = editingInvite
        ? `/api/company/team/invites/${editingInvite.id}`
        : '/api/company/team/invites'

      const method = editingInvite ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.message || 'Failed to save invite')
      }

      setMessage({ type: 'success', text: editingInvite ? 'Invite updated' : 'Invite sent successfully' })
      setShowModal(false)
      setFormData({ name: '', email: '', role: 'EVENT_MANAGER' })
      setEditingInvite(null)
      loadInvites()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this invitation?')) return

    try {
      const res = await fetch(`/api/company/team/invites/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete invite')

      setMessage({ type: 'success', text: 'Invite deleted' })
      loadInvites()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  async function handleStatusChange(id: string, status: 'APPROVED' | 'REJECTED') {
    try {
      const res = await fetch(`/api/company/team/invites/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!res.ok) throw new Error('Failed to update status')

      setMessage({ type: 'success', text: `Invite ${status.toLowerCase()}` })
      loadInvites()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  function openEditModal(invite: TeamInvite) {
    setEditingInvite(invite)
    setFormData({ name: invite.name, email: invite.email, role: invite.role })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingInvite(null)
    setFormData({ name: '', email: '', role: 'EVENT_MANAGER' })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          Approved
        </span>
      case 'REJECTED':
        return <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
          <XCircle className="w-4 h-4" />
          Rejected
        </span>
      case 'PENDING':
        return <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          <Clock className="w-4 h-4" />
          Pending
        </span>
      default:
        return null
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Team Invitations
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Invite team members to work for your company</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 hover:scale-105 font-medium"
          >
            <UserPlus className="w-5 h-5" />
            Invite Team Member
          </button>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`px-4 py-3 rounded-lg border ${message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
          }`}>
          {message.text}
        </div>
      )}

      {/* Invites Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200/50">
          <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
          <p className="text-gray-600 text-sm mt-1">Manage invitations and team member access</p>
        </div>

        {invites.length === 0 ? (
          <div className="p-12 text-center">
            <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No team invitations yet</p>
            <p className="text-gray-400 text-sm mt-2">Start by inviting your first team member</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50/50 to-gray-100/30 border-b border-gray-200/50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700 text-sm uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {invites.map((invite) => (
                <tr key={invite.id} className="hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-purple-50/30 transition-all duration-200">
                  <td className="px-6 py-5 font-semibold text-gray-900">{invite.name}</td>
                  <td className="px-6 py-5 text-gray-600 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {invite.email}
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                      <Shield className="w-4 h-4" />
                      {invite.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    {getStatusBadge(invite.status)}
                  </td>
                  <td className="px-6 py-5 text-gray-600 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(invite.invitedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {invite.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(invite.id, 'APPROVED')}
                            className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(invite.id, 'REJECTED')}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openEditModal(invite)}
                        className="p-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(invite.id)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {editingInvite ? 'Edit Invitation' : 'Invite Team Member'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {TEAM_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 hover:scale-105"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-xl disabled:opacity-50 transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  {saving ? 'Sending...' : editingInvite ? 'Update' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
