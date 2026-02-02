'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Trash2, X, ArrowLeft, Users } from 'lucide-react'

type User = {
  id: number
  name: string
  email: string
  role: string
  createdAt: string
  company?: {
    id: string
    name: string
  }
  tenantRole?: string
}

const AVAILABLE_ROLES = [
  { value: 'ADMIN', label: 'Company Admin', description: 'Full access to company resources' },
  { value: 'EVENT_MANAGER', label: 'Event Manager', description: 'Can create and manage events' },
  { value: 'USER', label: 'Member', description: 'Regular member access' }
]

export default function CompanyUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const companyId = params?.id as string
  
  const [users, setUsers] = useState<User[]>([])
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'USER' })
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)
  
  const currentUserRole = session?.user?.role as string

  // Check authorization
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || !['SUPER_ADMIN'].includes(session.user?.role as string)) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  // Fetch users and company details
  useEffect(() => {
    async function loadData() {
      if (!companyId) return
      
      try {
        setLoading(true)
        
        // Fetch company details first
        const companyRes = await fetch(`/api/super-admin/companies/${companyId}`)
        if (companyRes.ok) {
          const data = await companyRes.json()
          setCompanyName(data.company.name)
        }
        
        // Fetch users filtered by company
        // We might need to update the API to support filtering by companyId
        // For now assuming the API supports it or we filter client side
        const res = await fetch(`/api/admin/users?companyId=${companyId}&limit=100`)
        if (!res.ok) throw new Error('Failed to load users')
        const data = await res.json()
        
        // Filter users belonging to this company if API doesn't support filtering
        const companyUsers = data.users?.filter((u: User) => u.company?.id === companyId) || []
        setUsers(companyUsers)
        
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    if (session && companyId) {
      loadData()
    }
  }, [session, companyId])

  const handleEditClick = (user: User) => {
    setEditingUser(user)
    setSelectedRole(user.role)
    setMessage(null)
  }

  const handleCancelEdit = () => {
    setEditingUser(null)
    setSelectedRole('')
  }

  const handleSaveRole = async () => {
    if (!editingUser || !selectedRole) return
    try {
      setSaving(true)
      setMessage(null)
      const res = await fetch(`/api/admin/users/${editingUser.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to update role')
      }
      // Update local state
      setUsers(users.map(u => 
        u.id === editingUser.id ? { ...u, role: selectedRole } : u
      ))
      setMessage({ type: 'success', text: `Role updated to ${selectedRole}` })
      setTimeout(() => {
        setEditingUser(null)
        setMessage(null)
      }, 2000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setMessage({ type: 'error', text: 'Please fill all required fields' })
      return
    }
    try {
      setSaving(true)
      setMessage(null)
      // Include companyId in user creation
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newUser, companyId })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to create user')
      }
      const createdUser = await res.json()
      setUsers([...users, createdUser])
      setMessage({ type: 'success', text: 'User created successfully' })
      setShowCreateModal(false)
      setNewUser({ name: '', email: '', password: '', role: 'USER' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      setDeletingUserId(userId)
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to delete user')
      }
      setUsers(users.filter(u => u.id !== userId))
      setMessage({ type: 'success', text: 'User deleted successfully' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setDeletingUserId(null)
    }
  }

  if (status === 'loading' || loading) {
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
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-6">
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => router.push(`/super-admin/companies/${companyId}`)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Company Details</span>
          </button>
          
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {companyName} Users
                </h1>
                <p className="text-gray-600 mt-1">Manage users for this company</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Member
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`px-4 py-3 rounded border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-200/50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm">Name</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm">Email</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm">Role</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm">Created</th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No users found for this company
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' :
                        user.role === 'EVENT_MANAGER' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm px-3 py-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deletingUserId === user.id}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        >
                          {deletingUserId === user.id ? '...' : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-xl font-bold mb-6">Edit User Role</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
                <div className="space-y-2">
                  {AVAILABLE_ROLES.map((role) => (
                    <label key={role.value} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={selectedRole === role.value}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-sm">{role.label}</div>
                        <div className="text-xs text-gray-500">{role.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRole}
                  disabled={saving || !selectedRole}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add Company Member</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {AVAILABLE_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
