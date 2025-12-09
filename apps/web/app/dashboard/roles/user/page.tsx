'use client'

import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { UserSidebar } from '@/components/user/sidebar'
import { useEffect, useState } from 'react'
import CitySelectionModal from '@/components/CitySelectionModal'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ModernEventCard from '@/components/events/ModernEventCard'

export default function UserDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [showCityModal, setShowCityModal] = useState(false)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [myEvents, setMyEvents] = useState<any[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  
  // Check if user can create events (EVENT_MANAGER, ADMIN, SUPER_ADMIN)
  const canCreateEvents = session?.user?.role && ['EVENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)

  useEffect(() => {
    // Check if user has selected a city
    fetch('/api/user/city')
      .then(res => res.json())
      .then(data => {
        if (!data.city) {
          setShowCityModal(true)
        } else {
          setSelectedCity(data.city.split(',')[0])
        }
      })
      .catch(console.error)

    // Load user's events if they can create events
    if (canCreateEvents) {
      loadMyEvents()
    } else {
      setLoadingEvents(false)
    }
  }, [canCreateEvents])

  const loadMyEvents = async () => {
    try {
      setLoadingEvents(true)
      const res = await fetch('/api/events?my=true', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setMyEvents(data.events || [])
      }
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoadingEvents(false)
    }
  }

  const handleCitySelected = (city: string) => {
    setSelectedCity(city)
    setShowCityModal(false)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden md:block shrink-0"><UserSidebar /></div>
      <main className="flex-1 p-4 md:p-6">
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
            <p className="text-slate-600">Choose how you'd like to get started</p>
          </div>
        </div>
        {/* Primary choices after login */}
        <div className="grid gap-3 sm:grid-cols-2 mb-6">
          <Link
            href="/events/new"
            className="group rounded-xl border bg-white p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-md bg-indigo-50 text-indigo-700 inline-flex items-center justify-center overflow-hidden">
                {/* Ping ring for motion */}
                <span className="absolute inset-0 m-auto h-8 w-8 rounded-full bg-indigo-200/60 animate-ping" />
                {/* Rotating dashed circle (CSS-only) */}
                <span className="absolute h-8 w-8 rounded-full border-2 border-dashed border-indigo-400 animate-spin" style={{ animationDuration: '2.2s' }} />
                {/* Icon bounce */}
                <Plus className="relative h-5 w-5 animate-bounce" style={{ animationDuration: '1.6s' }} />
              </div>
              <div className="font-semibold">Create your events</div>
            </div>
            <div className="mt-2 text-sm text-slate-600">Create an event, configure tickets/RSVPs, and go live.</div>
          </Link>
          <Link
            href="/explore"
            className="group rounded-xl border bg-white p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 rounded-md bg-violet-50 text-violet-700 inline-flex items-center justify-center overflow-hidden">
                {/* Ping ring for motion */}
                <span className="absolute inset-0 m-auto h-8 w-8 rounded-full bg-violet-200/60 animate-ping" />
                {/* Rotating dashed circle (CSS-only) */}
                <span className="absolute h-8 w-8 rounded-full border-2 border-dashed border-violet-400 animate-spin" style={{ animationDuration: '2.2s' }} />
                {/* Icon bounce */}
                <Users className="relative h-5 w-5 animate-bounce" style={{ animationDuration: '1.6s' }} />
              </div>
              <div className="font-semibold">Explore events</div>
            </div>
            <div className="mt-2 text-sm text-slate-600">Find events and register as an attendee.</div>
            <div className="mt-3 inline-flex items-center gap-1 text-violet-700 text-sm group-hover:underline">Browse events</div>
          </Link>
        </div>

        {/* My Events Section */}
        {canCreateEvents && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">My Events</h2>
              <Link
                href="/events"
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                View all
              </Link>
            </div>
            
            {loadingEvents ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : myEvents.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {myEvents.slice(0, 6).map(event => (
                  <ModernEventCard
                    key={event.id}
                    event={event}
                    onEdit={(id) => router.push(`/events/${id}/info`)}
                    onDelete={(event) => {
                      // Handle delete action
                      console.log('Delete event:', event)
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border p-8 text-center">
                <div className="text-gray-400 mb-2">
                  <Plus className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No events yet</h3>
                <p className="text-gray-600 mb-4">Create your first event using the sidebar button</p>
              </div>
            )}
          </div>
        )}

        <CitySelectionModal 
          open={showCityModal} 
          onClose={() => setShowCityModal(false)}
          onCitySelected={handleCitySelected}
        />
      </main>
    </div>
  )
}
