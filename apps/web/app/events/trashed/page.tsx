'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, RotateCcw, AlertCircle } from 'lucide-react'

export default function TrashedEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/events?showTrashed=true')
      .then(r => r.json())
      .then(data => {
        const trashed = (data.events || []).filter((e: any) => e.status === 'TRASHED')
        setEvents(trashed)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleRestore = async (id: string) => {
    if (!confirm('Restore this event?')) return
    try {
      await fetch(`/api/events/${id}/restore`, { method: 'PATCH' })
      alert('Event restored!')
      window.location.reload()
    } catch (e) {
      alert('Failed to restore')
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trash2 className="w-8 h-8 text-red-600" />
            Trashed Events ({events.length})
          </h1>
          <button
            onClick={() => router.push('/events')}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Back to Events
          </button>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Trashed Events</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-sm p-6 border-2 border-red-200">
                <div className="mb-4">
                  <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">TRASHED</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{event.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{event.location}</p>
                <button
                  onClick={() => handleRestore(event.id)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore Event
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
