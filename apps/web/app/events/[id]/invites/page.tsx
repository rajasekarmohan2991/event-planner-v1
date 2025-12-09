"use client"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Mail, Send, Trash2, UserPlus, Upload, Download, CheckCircle, Clock, XCircle } from 'lucide-react'

interface Invitee {
  email: string
  name?: string
  organization?: string
  category?: string
  discountCode?: string
}

export default function EventInvitesPage() {
  const params = useParams()
  const eventId = params?.id as string
  const [invites, setInvites] = useState<any[]>([])
  const [invitees, setInvitees] = useState<Invitee[]>([{ email: '', name: '', organization: '', category: 'General' }])
  const [sending, setSending] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [bulkText, setBulkText] = useState('')

  useEffect(() => {
    loadInvites()
  }, [eventId])

  const loadInvites = () => {
    fetch(`/api/events/${eventId}/invites`)
      .then(r => r.json())
      .then(d => setInvites(d.invites || []))
  }

  const addInvitee = () => {
    setInvitees([...invitees, { email: '', name: '', organization: '', category: 'General' }])
  }

  const updateInvitee = (index: number, field: keyof Invitee, value: string) => {
    const updated = [...invitees]
    updated[index] = { ...updated[index], [field]: value }
    setInvitees(updated)
  }

  const removeInvitee = (index: number) => {
    setInvitees(invitees.filter((_, i) => i !== index))
  }

  const sendInvites = async () => {
    const validInvitees = invitees.filter(inv => inv.email.includes('@'))
    if (validInvitees.length === 0) {
      alert('Please add at least one valid email')
      return
    }

    setSending(true)
    try {
      const res = await fetch(`/api/events/${eventId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitees: validInvitees })
      })
      const data = await res.json()
      alert(data.message || 'Invites sent successfully!')
      setInvitees([{ email: '', name: '', organization: '', category: 'General' }])
      loadInvites()
    } catch (err) {
      alert('Failed to send invites')
    }
    setSending(false)
  }

  const processBulkUpload = () => {
    // Format: email,name,organization,category,discountCode
    const lines = bulkText.split('\n').filter(l => l.trim())
    const parsed: Invitee[] = []
    
    lines.forEach(line => {
      const [email, name, organization, category, discountCode] = line.split(',').map(s => s.trim())
      if (email && email.includes('@')) {
        parsed.push({ email, name, organization, category: category || 'General', discountCode })
      }
    })
    
    setInvitees(parsed)
    setShowBulkUpload(false)
    setBulkText('')
  }

  const exportInvites = () => {
    const csv = ['Email,Name,Organization,Category,Invite Code,Status,Sent At']
    invites.forEach(inv => {
      csv.push(`${inv.email},${inv.inviteeName || ''},${inv.organization || ''},${inv.category || ''},${inv.inviteCode},${inv.usedAt ? 'Used' : 'Pending'},${new Date(inv.invitedAt).toLocaleDateString()}`)
    })
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `event-${eventId}-invites.csv`
    a.click()
  }

  const handleApprove = async (inviteId: string, approvalType: 'FULL' | 'PARTIAL') => {
    if (!confirm(`Approve this registration with ${approvalType} access?`)) return
    
    try {
      const res = await fetch(`/api/events/${eventId}/invites/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteId,
          approvalStatus: 'APPROVED',
          approvalType
        })
      })
      const data = await res.json()
      if (res.ok) {
        alert(data.message || 'Registration approved! Email sent to invitee.')
        loadInvites()
      } else {
        alert(data.error || 'Failed to approve')
      }
    } catch (err) {
      alert('Failed to approve registration')
    }
  }

  const handleReject = async (inviteId: string) => {
    const reason = prompt('Reason for rejection (optional):')
    if (reason === null) return // User cancelled
    
    try {
      const res = await fetch(`/api/events/${eventId}/invites/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteId,
          approvalStatus: 'REJECTED',
          rejectionReason: reason
        })
      })
      const data = await res.json()
      if (res.ok) {
        alert(data.message || 'Registration rejected. Email sent to invitee.')
        loadInvites()
      } else {
        alert(data.error || 'Failed to reject')
      }
    } catch (err) {
      alert('Failed to reject registration')
    }
  }

  const handleRevoke = async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this invite? The user will not be able to register.')) return
    
    try {
      const res = await fetch(`/api/events/${eventId}/invites?inviteId=${inviteId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        alert(data.message || 'Invite revoked')
        loadInvites()
      } else {
        alert(data.error || 'Failed to revoke')
      }
    } catch (err) {
      alert('Failed to revoke invite')
    }
  }

  const getStatusBadge = (invite: any) => {
    if (invite.response === 'INTERESTED' && invite.approvalStatus === 'APPROVED') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs"><CheckCircle className="w-3 h-3" /> Approved</span>
    }
    if (invite.response === 'INTERESTED' && invite.approvalStatus === 'REJECTED') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs"><XCircle className="w-3 h-3" /> Rejected</span>
    }
    if (invite.response === 'INTERESTED') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs"><Clock className="w-3 h-3" /> Pending Approval</span>
    }
    if (invite.response === 'NOT_INTERESTED') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"><XCircle className="w-3 h-3" /> Declined</span>
    }
    if (invite.usedAt) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs"><CheckCircle className="w-3 h-3" /> Registered</span>
    }
    if (invite.status === 'REVOKED') {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs"><XCircle className="w-3 h-3" /> Revoked</span>
    }
    if (new Date(invite.expiresAt) < new Date()) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"><Clock className="w-3 h-3" /> Expired</span>
    }
    return <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"><Clock className="w-3 h-3" /> Sent</span>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📧 Invite-Only Registration</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowBulkUpload(!showBulkUpload)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2">
            <Upload className="w-4 h-4" /> Bulk Upload
          </button>
          <button onClick={exportInvites} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {showBulkUpload && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold mb-2">Bulk Upload Invitees</h3>
          <p className="text-sm text-gray-600 mb-4">Format: email,name,organization,category,discountCode (one per line)</p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="user@example.com,John Doe,Acme Corp,VIP,SAVE20&#10;jane@example.com,Jane Smith,Tech Inc,Speaker,SPEAKER50"
            rows={6}
            className="w-full border rounded-lg px-4 py-2 mb-4 font-mono text-sm"
          />
          <div className="flex gap-2">
            <button onClick={processBulkUpload} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Process Upload</button>
            <button onClick={() => setShowBulkUpload(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5" /> Add Invitees
        </h2>
        
        <div className="space-y-4">
          {invitees.map((invitee, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-3">
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={invitee.email}
                  onChange={(e) => updateInvitee(index, 'email', e.target.value)}
                  placeholder="user@example.com"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={invitee.name}
                  onChange={(e) => updateInvitee(index, 'name', e.target.value)}
                  placeholder="John Doe"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Organization</label>
                <input
                  type="text"
                  value={invitee.organization}
                  onChange={(e) => updateInvitee(index, 'organization', e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={invitee.category}
                  onChange={(e) => updateInvitee(index, 'category', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="General">General</option>
                  <option value="VIP">VIP</option>
                  <option value="Speaker">Speaker</option>
                  <option value="Sponsor">Sponsor</option>
                  <option value="Media">Media</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Discount Code</label>
                <input
                  type="text"
                  value={invitee.discountCode}
                  onChange={(e) => updateInvitee(index, 'discountCode', e.target.value)}
                  placeholder="SAVE20"
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="col-span-1">
                <button
                  onClick={() => removeInvitee(index)}
                  className="w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={addInvitee} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Add Another
          </button>
          <button
            onClick={sendInvites}
            disabled={sending}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : `Send ${invitees.filter(i => i.email).length} Invitation(s)`}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">📋 Sent Invitations ({invites.length})</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 text-sm font-medium">Email</th>
                <th className="text-left p-3 text-sm font-medium">Name</th>
                <th className="text-left p-3 text-sm font-medium">Organization</th>
                <th className="text-left p-3 text-sm font-medium">Category</th>
                <th className="text-left p-3 text-sm font-medium">Status</th>
                <th className="text-left p-3 text-sm font-medium">Sent</th>
                <th className="text-left p-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No invitations sent yet. Add invitees above to get started.
                  </td>
                </tr>
              ) : (
                invites.map(inv => (
                  <tr key={inv.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{inv.email}</td>
                    <td className="p-3 text-sm">{inv.inviteeName || '-'}</td>
                    <td className="p-3 text-sm">{inv.organization || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        inv.category === 'VIP' ? 'bg-purple-100 text-purple-700' :
                        inv.category === 'Speaker' ? 'bg-blue-100 text-blue-700' :
                        inv.category === 'Sponsor' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {inv.category || 'General'}
                      </span>
                    </td>
                    <td className="p-3">{getStatusBadge(inv)}</td>
                    <td className="p-3 text-sm text-gray-600">{new Date(inv.invitedAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      {inv.response === 'INTERESTED' && !inv.approvalStatus && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(inv.id, 'FULL')}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                            title="Approve with full access"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleReject(inv.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
                            title="Reject registration"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      )}
                      {inv.approvalStatus === 'APPROVED' && (
                        <span className="text-xs text-green-600">✓ Approved</span>
                      )}
                      {inv.approvalStatus === 'REJECTED' && (
                        <span className="text-xs text-red-600">✗ Rejected</span>
                      )}
                      {inv.status !== 'REVOKED' && !inv.usedAt && !inv.response && (
                        <button
                          onClick={() => handleRevoke(inv.id)}
                          className="ml-2 px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs font-medium"
                          title="Revoke invite"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
