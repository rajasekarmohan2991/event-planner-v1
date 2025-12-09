'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, X } from 'lucide-react'
import dynamicImport from 'next/dynamic'

const LottieAnimation = dynamicImport(() => import('@/components/animations/LottieAnimation').then(mod => mod.LottieAnimation), { ssr: false })

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
  approvedBy?: {
    id: number
    name: string
    email: string
  }
  tenantRole?: string
}

const AVAILABLE_ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', description: 'Full system access' },
  { value: 'ADMIN', label: 'Admin', description: 'Tenant admin access' },
  { value: 'EVENT_MANAGER', label: 'Event Manager', description: 'Can create and manage events' },
  { value: 'USER', label: 'User', description: 'Regular user access' }
]

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
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
    
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user?.role as string)) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  // Fetch users
  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true)
        const res = await fetch('/api/admin/users?page=1&limit=100')
        if (!res.ok) throw new Error('Failed to load users')
        const data = await res.json()
        setUsers(data.users || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    if (session) {
      loadUsers()
    }
  }, [session])

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
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
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

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Modern Header */}
      <div className="bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 backdrop-blur-sm rounded-2xl shadow-sm border border-indigo-100/50 p-6 hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20">
              <LottieAnimation
                animationUrl="/animations/login.json"
                loop={true}
                autoplay={true}
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">User Management</h1>
              <p className="text-gray-600 mt-2 text-lg">Manage user roles and permissions</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN') && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:scale-105 font-medium"
              >
                <Plus className="w-5 h-5" />
                Add User
              </button>
            )}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg">
              <div className="text-sm font-medium opacity-90">Total Users</div>
              <div className="text-2xl font-bold">{users.length}</div>
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

      {/* Modern Users Table */}
      <div className="bg-gradient-to-br from-white via-blue-50/10 to-indigo-50/20 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100/50 overflow-hidden hover:shadow-xl transition-all">
        <div className="px-8 py-6 bg-gradient-to-r from-indigo-50/40 via-purple-50/30 to-blue-50/40 border-b border-indigo-100/50">
          <h2 className="text-xl font-semibold text-gray-900">Users Overview</h2>
          <p className="text-gray-600 text-sm mt-1">Manage and update user roles</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gradient-to-r from-gray-50/50 to-gray-100/30 border-b border-gray-200/50">
              <tr>
                <th className="w-16 px-4 py-4 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider">ID</th>
                <th className="w-32 px-4 py-4 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider">Name</th>
                <th className="w-48 px-4 py-4 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider">Email</th>
                <th className="w-40 px-4 py-4 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider">Company</th>
                <th className="w-32 px-4 py-4 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider">Role</th>
                <th className="w-28 px-4 py-4 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider">Created</th>
                <th className="w-44 px-4 py-4 text-right font-semibold text-gray-700 text-sm uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-purple-50/30 transition-all duration-200">
                  <td className="px-4 py-4 text-gray-600 font-mono text-sm truncate">{user.id}</td>
                  <td className="px-4 py-4 font-semibold text-gray-900 truncate">{user.name}</td>
                  <td className="px-4 py-4 text-gray-600 text-sm truncate" title={user.email}>{user.email}</td>
                  <td className="px-4 py-4">
                    {user.company ? (
                      <div className="truncate">
                        <div className="font-medium text-gray-900 text-sm truncate">{user.company.name}</div>
                        <div className="text-xs text-gray-500 truncate">ID: {user.company.id}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No Company</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                        user.role === 'SUPER_ADMIN' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' :
                        user.role === 'ADMIN' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                        user.role === 'EVENT_MANAGER' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                        'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                      }`}>
                        {user.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' :
                         user.role === 'ADMIN' ? 'ADMIN' :
                         user.role === 'EVENT_MANAGER' ? 'MANAGER' : 'USER'}
                      </span>
                      {user.tenantRole && (
                        <div className="text-xs text-gray-500 truncate">
                          Company: {user.tenantRole.replace('TENANT_', '')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600 text-xs">
                    {new Date(user.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN') && (
                        <button
                          onClick={() => handleEditClick(user)}
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1.5 rounded-lg font-medium text-xs hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                        >
                          Edit
                        </button>
                      )}
                      {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN') && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deletingUserId === user.id}
                          className="bg-gradient-to-r from-red-500 to-red-600 text-white p-1.5 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                          title="Delete User"
                        >
                          {deletingUserId === user.id ? '...' : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200/50">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Edit User Role</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                <div className="text-sm text-gray-600">
                  <div className="font-medium">{editingUser.name}</div>
                  <div>{editingUser.email}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
                <div className="space-y-2">
                  {AVAILABLE_ROLES.map((role) => (
                    <label
                      key={role.value}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className="flex items-center justify-center w-5 h-5">
                        <input
                          type="radio"
                          name="role"
                          value={role.value}
                          checked={selectedRole === role.value}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="w-4 h-4 text-indigo-600"
                        />
                      </div>
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
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 hover:scale-105"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRole}
                  disabled={saving || !selectedRole}
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl disabled:opacity-50 transition-all duration-200 hover:scale-105 shadow-lg"
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
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Create New User</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {AVAILABLE_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 hover:scale-105"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={saving}
                  className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl disabled:opacity-50 transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
