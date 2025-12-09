"use client"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Users, UserCheck, UserX, Clock, Download } from 'lucide-react'

export default function RSVPReportsPage() {
  const params = useParams()
  const eventId = params.id as string
  const [rsvps, setRsvps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ going: 0, maybe: 0, notGoing: 0, pending: 0, total: 0 })

  useEffect(() => {
    fetchRSVPs()
  }, [eventId])

  const fetchRSVPs = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/rsvp-reports`)
      const data = await response.json()
      setRsvps(data.rsvps || [])
      setStats(data.stats || { going: 0, maybe: 0, notGoing: 0, pending: 0, total: 0 })
    } catch (error) {
      console.error('Error fetching RSVPs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'GOING': return 'bg-green-100 text-green-800 border-green-200'
      case 'MAYBE': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'NOT_GOING': return 'bg-red-100 text-red-800 border-red-200'
      case 'PENDING': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Response', 'Status', 'Created At']
    const rows = rsvps.map(r => [
      r.name || 'N/A',
      r.email,
      r.responseType || 'PENDING',
      r.status || 'NOT_REGISTERED',
      new Date(r.createdAt).toLocaleString()
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rsvp-report-${eventId}-${Date.now()}.csv`
    a.click()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">RSVP Reports</h1>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Going</span>
          </div>
          <div className="text-3xl font-bold text-green-700">{stats.going}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-blue-600 font-medium">Maybe</span>
          </div>
          <div className="text-3xl font-bold text-blue-700">{stats.maybe}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserX className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-600 font-medium">Not Going</span>
          </div>
          <div className="text-3xl font-bold text-red-700">{stats.notGoing}</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600 font-medium">Total</span>
          </div>
          <div className="text-3xl font-bold text-gray-700">{stats.total}</div>
        </div>
      </div>

      {/* RSVP Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Email</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Response</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : rsvps.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-500">No RSVP responses yet</td></tr>
            ) : (
              rsvps.map((rsvp, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{rsvp.name || 'N/A'}</td>
                  <td className="px-4 py-3">{rsvp.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(rsvp.responseType)}`}>
                      {rsvp.responseType || 'PENDING'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{rsvp.status || 'NOT_REGISTERED'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(rsvp.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
