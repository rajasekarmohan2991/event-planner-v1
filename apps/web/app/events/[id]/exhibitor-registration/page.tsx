"use client"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import ManageTabs from '@/components/events/ManageTabs'

export default function ExhibitorRegistrationPage() {
  const params = useParams()
  const eventId = (params as any)?.id as string
  const [exhibitors, setExhibitors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) return
    fetch(`/api/events/${eventId}/exhibitors`)
      .then(r => r.json())
      .then(data => {
        setExhibitors(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [eventId])

  return (
    <div className="space-y-6">
      <ManageTabs eventId={eventId} />
      
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Exhibitor Registrations</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage exhibitor registrations for this event
            </p>
          </div>
          <a
            href={`/events/${eventId}/exhibitor-registration/register`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            + Register as Exhibitor
          </a>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">Company Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Contact Person</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Email</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Phone</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Booth Type</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Booth Size</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Payment Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Loading exhibitors...
                  </td>
                </tr>
              ) : exhibitors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No exhibitor registrations yet
                  </td>
                </tr>
              ) : (
                exhibitors.map((ex: any) => (
                  <tr key={ex.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{ex.company_name}</td>
                    <td className="px-4 py-3">{ex.contact_name}</td>
                    <td className="px-4 py-3 text-sm">{ex.contact_email}</td>
                    <td className="px-4 py-3 text-sm">{ex.contact_phone}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                        {ex.booth_type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{ex.booth_size || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        ex.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        ex.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {ex.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        ex.payment_status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        ex.payment_status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ex.payment_status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {ex.status === 'PENDING_APPROVAL' ? (
                        <button
                          className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                          disabled={approvingId === ex.id}
                          onClick={async () => {
                            try {
                              setApprovingId(ex.id)
                              const res = await fetch(`/api/events/${eventId}/exhibitors/${ex.id}/approve`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({})
                              })
                              if (res.ok) {
                                setExhibitors(prev => prev.map((it: any) => it.id === ex.id ? { ...it, status: 'APPROVED' } : it))
                              } else {
                                const err = await res.json().catch(() => ({}))
                                alert(err.message || 'Failed to approve')
                              }
                            } finally {
                              setApprovingId(null)
                            }
                          }}
                        >
                          {approvingId === ex.id ? 'Approving…' : 'Approve'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
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
