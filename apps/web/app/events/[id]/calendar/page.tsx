"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import ManageTabs from '@/components/events/ManageTabs'
import { generateCalendarLinks, CalendarEvent as CalEvent } from '@/lib/calendar'
import { Calendar, Download, Bell, ExternalLink, Clock, MapPin, Users, Mic, Star, TrendingUp } from 'lucide-react'

type CalendarEvent = {
  id: number
  eventId: number
  sessionId: number
  title: string
  description: string
  startTime: string
  endTime: string
  location: string
  track: string
  capacity: number
  speakers: Array<{
    id: number
    name: string
    title: string
    bio: string
  }>
  createdAt: string
}

export default function EventCalendarPage({ params }: { params: { id: string } }) {
  const { status } = useSession()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [insights, setInsights] = useState<any>(null)
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([])
  const [reminderMinutes, setReminderMinutes] = useState(15)

  const loadCalendarEvents = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/events/${params.id}/calendar`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load calendar events')
      const data = await res.json()
      setEvents(Array.isArray(data) ? data : [])
      setError(null)
    } catch (e: any) {
      setError(e?.message || 'Failed to load calendar events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status !== 'loading') {
      loadCalendarEvents()
      loadScheduledNotifications()
    }
  }, [status, params.id])

  // Calculate session insights
  useEffect(() => {
    if (events.length > 0) {
      const totalSessions = events.length
      const totalSpeakers = events.reduce((acc, event) => acc + (event.speakers?.length || 0), 0)
      const uniqueSpeakers = new Set(events.flatMap(event => event.speakers?.map(s => s.id) || [])).size
      const totalCapacity = events.reduce((acc, event) => acc + (event.capacity || 0), 0)
      const avgDuration = events.reduce((acc, event) => {
        const duration = new Date(event.endTime).getTime() - new Date(event.startTime).getTime()
        return acc + duration
      }, 0) / events.length / (1000 * 60) // in minutes
      
      const tracks = [...new Set(events.map(event => event.track).filter(Boolean))]
      const upcomingSessions = events.filter(event => new Date(event.startTime) > new Date()).length
      
      setInsights({
        totalSessions,
        totalSpeakers,
        uniqueSpeakers,
        totalCapacity,
        avgDuration: Math.round(avgDuration),
        tracks: tracks.length,
        upcomingSessions
      })
    }
  }, [events])

  const deleteCalendarEvent = async (calendarEventId: number) => {
    if (!confirm('Remove this event from calendar?')) return
    
    try {
      const res = await fetch(`/api/events/${params.id}/calendar?calendarEventId=${calendarEventId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!res.ok) throw new Error('Failed to delete calendar event')
      await loadCalendarEvents()
    } catch (e: any) {
      alert(e?.message || 'Failed to delete calendar event')
    }
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const durationMs = endDate.getTime() - startDate.getTime()
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const exportToCalendar = (event: CalendarEvent) => {
    const calEvent: CalEvent = {
      title: event.title,
      description: event.description,
      startDate: new Date(event.startTime),
      endDate: new Date(event.endTime),
      location: event.location,
      url: `${window.location.origin}/events/${params.id}/calendar`
    }

    const links = generateCalendarLinks(calEvent)
    
    // Show export options
    const exportMenu = document.createElement('div')
    exportMenu.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    exportMenu.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 class="text-lg font-semibold mb-4">Add to Calendar</h3>
        <div class="space-y-2">
          <a href="${links.google}" target="_blank" class="block w-full text-left px-4 py-2 rounded hover:bg-gray-100">
            📅 Google Calendar
          </a>
          <a href="${links.outlook}" target="_blank" class="block w-full text-left px-4 py-2 rounded hover:bg-gray-100">
            📅 Outlook
          </a>
          <a href="${links.yahoo}" target="_blank" class="block w-full text-left px-4 py-2 rounded hover:bg-gray-100">
            📅 Yahoo Calendar
          </a>
          <button onclick="this.closest('.fixed').remove(); (${links.ics})()" class="block w-full text-left px-4 py-2 rounded hover:bg-gray-100">
            💾 Download ICS File
          </button>
        </div>
        <button onclick="this.closest('.fixed').remove()" class="mt-4 w-full px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
          Cancel
        </button>
      </div>
    `
    
    document.body.appendChild(exportMenu)
  }

  const sendNotifications = async (eventId: number) => {
    try {
      const response = await fetch(`/api/events/${params.id}/calendar/${eventId}/notify`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        alert('Notifications sent to all registered users!')
      } else {
        throw new Error('Failed to send notifications')
      }
    } catch (error) {
      alert('Failed to send notifications. Please try again.')
    }
  }

  const scheduleNotifications = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}/calendar/notifications/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reminderMinutes })
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Scheduled ${result.notifications?.length || 0} automatic reminders!`)
        loadScheduledNotifications()
      } else {
        throw new Error('Failed to schedule notifications')
      }
    } catch (error) {
      alert('Failed to schedule notifications. Please try again.')
    }
  }

  const loadScheduledNotifications = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}/calendar/notifications/schedule`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const notifications = await response.json()
        setScheduledNotifications(notifications)
      }
    } catch (error) {
      console.error('Failed to load scheduled notifications:', error)
    }
  }

  if (status === 'loading' || loading) return <div className="p-6">Loading...</div>

  return (
    <div className="space-y-4">
      <ManageTabs eventId={params.id} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            📅 Event Calendar
          </h1>
          <p className="text-sm text-muted-foreground">Sessions and events schedule</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <select
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(Number(e.target.value))}
              className="text-xs border rounded px-2 py-1"
            >
              <option value={5}>5 min before</option>
              <option value={15}>15 min before</option>
              <option value={30}>30 min before</option>
              <option value={60}>1 hour before</option>
            </select>
            <button
              onClick={scheduleNotifications}
              className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
            >
              <Bell className="h-3 w-3" />
              Auto Remind
            </button>
          </div>
          
          <div className="flex rounded-md border">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-medium ${
                viewMode === 'list' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-medium ${
                viewMode === 'calendar' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Calendar View
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-rose-300 bg-rose-50 text-rose-800 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Scheduled Notifications Section */}
      {scheduledNotifications.length > 0 && (
        <div className="rounded-md border bg-white p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-green-600" />
            Scheduled Automatic Reminders ({scheduledNotifications.length})
          </h3>
          <div className="space-y-2">
            {scheduledNotifications.map((notification: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm p-2 bg-green-50 rounded border border-green-200">
                <div className="flex items-center gap-2">
                  <Bell className="h-3 w-3 text-green-600" />
                  <span className="font-medium">{notification.sessionTitle || notification.title}</span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-600">
                    {notification.reminderMinutes} min before session
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {notification.scheduledFor ? new Date(notification.scheduledFor).toLocaleString() : 'Scheduled'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Insights Dashboard */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Total Sessions</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{insights.totalSessions}</div>
            <div className="text-xs text-gray-500">{insights.upcomingSessions} upcoming</div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mic className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Speakers</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{insights.uniqueSpeakers}</div>
            <div className="text-xs text-gray-500">{insights.totalSpeakers} total assignments</div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Total Capacity</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{insights.totalCapacity}</div>
            <div className="text-xs text-gray-500">across all sessions</div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">Avg Duration</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{insights.avgDuration}m</div>
            <div className="text-xs text-gray-500">{insights.tracks} tracks</div>
          </div>
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="rounded-md border bg-white p-8 text-center">
              <div className="text-4xl mb-2">📅</div>
              <h3 className="font-medium mb-1">No Calendar Events</h3>
              <p className="text-sm text-slate-600 mb-4">
                Sessions will appear here when you create them with "Add to calendar" enabled.
              </p>
              <a
                href={`/events/${params.id}/sessions`}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Create Session
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map(event => (
                <div key={event.id} className="rounded-md border bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{event.title}</h3>
                        {event.track && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            {event.track}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 mt-3">
                        <div>
                          <div className="font-medium text-slate-900">📅 When</div>
                          <div>{formatDateTime(event.startTime)}</div>
                          <div className="text-xs">Duration: {formatDuration(event.startTime, event.endTime)}</div>
                        </div>
                        
                        <div>
                          <div className="font-medium text-slate-900">📍 Where</div>
                          <div>{event.location || 'No location specified'}</div>
                          {event.capacity && (
                            <div className="text-xs">Capacity: {event.capacity} people</div>
                          )}
                        </div>
                        
                        <div>
                          <div className="font-medium text-slate-900 flex items-center gap-1">
                            <Mic className="h-3 w-3" />
                            Speakers ({event.speakers?.length || 0})
                          </div>
                          {event.speakers && event.speakers.length > 0 ? (
                            <div className="space-y-2 mt-2">
                              {event.speakers.map(speaker => (
                                <div key={speaker.id} className="bg-gray-50 rounded p-2">
                                  <div className="text-xs font-medium text-gray-900">{speaker.name}</div>
                                  {speaker.title && (
                                    <div className="text-xs text-gray-600">{speaker.title}</div>
                                  )}
                                  {speaker.bio && (
                                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                      {speaker.bio.substring(0, 80)}...
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 mt-1">No speakers assigned</div>
                          )}
                        </div>
                      </div>
                      
                      {event.description && (
                        <div className="mt-3 text-sm text-slate-600">
                          {event.description}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => exportToCalendar(event)}
                        className="rounded-md border border-indigo-300 text-indigo-700 px-2 py-1 text-xs hover:bg-indigo-50 flex items-center gap-1"
                        title="Export to Calendar"
                      >
                        <Calendar className="h-3 w-3" />
                        Export
                      </button>
                      <button
                        onClick={() => sendNotifications(event.id)}
                        className="rounded-md border border-green-300 text-green-700 px-2 py-1 text-xs hover:bg-green-50 flex items-center gap-1"
                        title="Send Notifications"
                      >
                        <Bell className="h-3 w-3" />
                        Notify
                      </button>
                      <a
                        href={`/events/${params.id}/sessions`}
                        className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
                      >
                        Edit Session
                      </a>
                      <button
                        onClick={() => deleteCalendarEvent(event.id)}
                        className="rounded-md border border-rose-300 text-rose-700 px-2 py-1 text-xs hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-md border bg-white p-6">
          <div className="text-center text-slate-600">
            <div className="text-4xl mb-2">🗓️</div>
            <h3 className="font-medium mb-1">Calendar View Coming Soon</h3>
            <p className="text-sm">
              Full calendar grid view will be available in the next update.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
