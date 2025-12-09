"use client"

import { useState } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Download, 
  Mail, 
  Tag,
  Users,
  AlertCircle
} from 'lucide-react'

type BulkOperationsProps = {
  selectedIds: number[]
  eventId: string
  onComplete: () => void
  onClear: () => void
}

export default function BulkOperations({ 
  selectedIds, 
  eventId, 
  onComplete, 
  onClear 
}: BulkOperationsProps) {
  const [loading, setLoading] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailData, setEmailData] = useState({ subject: '', message: '' })

  const performBulkAction = async (action: string, data?: any) => {
    if (selectedIds.length === 0) {
      alert('Please select registrations first')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/bulk/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action,
          registrationIds: selectedIds,
          eventId: parseInt(eventId),
          data
        })
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      if (action === 'export') {
        // Download CSV
        const csv = convertToCSV(result.data)
        downloadCSV(csv, `registrations-${eventId}-${Date.now()}.csv`)
      } else {
        alert(`${action} completed successfully! Affected: ${result.affected} registrations`)
      }

      onComplete()
      onClear()
    } catch (error: any) {
      alert(error.message || `Failed to ${action}`)
    } finally {
      setLoading(false)
    }
  }

  const convertToCSV = (data: any[]) => {
    if (!data.length) return ''
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          JSON.stringify(row[header] || '')
        ).join(',')
      )
    ].join('\n')
    
    return csvContent
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const sendBulkEmail = async () => {
    if (!emailData.subject || !emailData.message) {
      alert('Please fill in subject and message')
      return
    }

    await performBulkAction('send_email', emailData)
    setShowEmailModal(false)
    setEmailData({ subject: '', message: '' })
  }

  if (selectedIds.length === 0) {
    return (
      <div className="bg-gray-50 border rounded-lg p-4 text-center text-sm text-gray-600">
        Select registrations to perform bulk operations
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600" />
          <span className="font-medium">{selectedIds.length} selected</span>
        </div>
        <button
          onClick={onClear}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear selection
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* Approve */}
        <button
          onClick={() => performBulkAction('approve')}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 text-sm"
        >
          <CheckCircle className="h-4 w-4" />
          Approve
        </button>

        {/* Reject */}
        <button
          onClick={() => performBulkAction('reject')}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 text-sm"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </button>

        {/* Export */}
        <button
          onClick={() => performBulkAction('export')}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 text-sm"
        >
          <Download className="h-4 w-4" />
          Export
        </button>

        {/* Email */}
        <button
          onClick={() => setShowEmailModal(true)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 disabled:opacity-50 text-sm"
        >
          <Mail className="h-4 w-4" />
          Email
        </button>

        {/* Assign Tickets */}
        <button
          onClick={() => performBulkAction('assign_tickets', { ticketType: 'general' })}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 disabled:opacity-50 text-sm"
        >
          <Tag className="h-4 w-4" />
          Assign Tickets
        </button>

        {/* Delete */}
        <button
          onClick={() => {
            if (confirm(`Delete ${selectedIds.length} registrations? This cannot be undone.`)) {
              performBulkAction('delete')
            }
          }}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 text-sm"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          Processing...
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Send Bulk Email</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="Event update..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  rows={4}
                  placeholder="Your message to attendees..."
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-md">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  This will send email to {selectedIds.length} registrants
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2 border rounded-md text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={sendBulkEmail}
                disabled={!emailData.subject || !emailData.message}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
