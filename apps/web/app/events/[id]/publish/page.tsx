"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { CheckCircle, Globe, Eye, Calendar, MapPin } from "lucide-react"

export default function PublishEventPage({ params }: { params: { id: string } }) {
  const { status } = useSession()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const res = await fetch(`/api/events/${params.id}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setEvent(data)
        }
      } catch (e) {
        console.error('Failed to load event', e)
      } finally {
        setLoading(false)
      }
    }
    loadEvent()
  }, [params.id])

  const handlePublish = async () => {
    setPublishing(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/events/${params.id}/publish`, {
        method: 'PATCH',
      })
      if (!res.ok) {
        throw new Error('Failed to publish event')
      }
      const data = await res.json()
      setEvent(data)
      setMessage('Event published successfully! 🎉')
      
      // Redirect to event overview after 2 seconds
      setTimeout(() => {
        router.push(`/events/${params.id}`)
      }, 2000)
    } catch (e: any) {
      setMessage(e?.message || 'Failed to publish event')
    } finally {
      setPublishing(false)
    }
  }

  if (status === 'loading' || loading) {
    return <div className="p-6">Loading...</div>
  }

  const isPublished = event?.status === 'LIVE'
  const publicUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/events/${params.id}/public`
    : ''

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Publish Event</h1>
        <p className="text-muted-foreground mt-2">
          Make your event live and accessible to the public
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successfully') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Event Preview Card */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">{event?.name || event?.title}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {event?.startTime && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.startTime).toLocaleDateString()}
                </div>
              )}
              {event?.venue && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {event.venue}
                </div>
              )}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isPublished 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isPublished ? 'Published' : 'Draft'}
          </div>
        </div>

        {event?.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {event.description}
          </p>
        )}
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Pre-publish Checklist</h3>
        <div className="space-y-3">
          <ChecklistItem 
            checked={!!event?.name} 
            label="Event name is set" 
          />
          <ChecklistItem 
            checked={!!event?.startTime} 
            label="Event date and time configured" 
          />
          <ChecklistItem 
            checked={!!event?.venue} 
            label="Venue information added" 
          />
          <ChecklistItem 
            checked={!!event?.description} 
            label="Event description provided" 
          />
        </div>
      </div>

      {/* Public URL */}
      {isPublished && publicUrl && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 space-y-3">
          <div className="flex items-center gap-2 text-blue-900">
            <Globe className="w-5 h-5" />
            <h3 className="font-semibold">Public Event Page</h3>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={publicUrl}
              readOnly
              className="flex-1 px-3 py-2 border rounded text-sm bg-white"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicUrl)
                setMessage('URL copied to clipboard!')
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Copy
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-white border rounded text-sm hover:bg-gray-50 flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              View
            </a>
          </div>
        </div>
      )}

      {/* Publish Button */}
      <div className="flex gap-3">
        {!isPublished && (
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {publishing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Publish Event
              </>
            )}
          </button>
        )}
        <button
          onClick={() => router.push(`/events/${params.id}`)}
          className="px-6 py-3 border rounded-lg font-medium hover:bg-gray-50"
        >
          {isPublished ? 'Back to Dashboard' : 'Cancel'}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p>
          <strong>Note:</strong> Publishing your event will make it visible to the public. 
          Attendees will be able to view event details and register through the public event page.
        </p>
      </div>
    </div>
  )
}

function ChecklistItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
        checked ? 'bg-green-100' : 'bg-gray-100'
      }`}>
        {checked && <CheckCircle className="w-4 h-4 text-green-600" />}
      </div>
      <span className={checked ? 'text-gray-900' : 'text-gray-500'}>{label}</span>
    </div>
  )
}
