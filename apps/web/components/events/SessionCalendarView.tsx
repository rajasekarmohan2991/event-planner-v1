"use client"

import { useMemo } from 'react'
import { Calendar, Clock, MapPin, Users, Radio } from 'lucide-react'

interface Session {
  id: number
  title: string
  description?: string
  startTime: string
  endTime: string
  room?: string
  track?: string
  capacity?: number
}

interface SessionCalendarViewProps {
  sessions: Session[]
  onSessionClick?: (sessionId: number) => void
  eventId?: string
}

export default function SessionCalendarView({ sessions, onSessionClick, eventId }: SessionCalendarViewProps) {
  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const grouped: Record<string, Session[]> = {}
    
    sessions.forEach(session => {
      const date = new Date(session.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(session)
    })
    
    // Sort sessions within each date by start time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      )
    })
    
    return grouped
  }, [sessions])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getTrackColor = (track?: string) => {
    if (!track) return 'bg-gray-100 text-gray-700'
    
    const colors: Record<string, string> = {
      'TECHNICAL': 'bg-blue-100 text-blue-700',
      'BUSINESS': 'bg-green-100 text-green-700',
      'DESIGN': 'bg-purple-100 text-purple-700',
      'MARKETING': 'bg-pink-100 text-pink-700',
      'WORKSHOP': 'bg-orange-100 text-orange-700',
      'KEYNOTE': 'bg-red-100 text-red-700'
    }
    
    return colors[track.toUpperCase()] || 'bg-gray-100 text-gray-700'
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No sessions scheduled yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(sessionsByDate).map(([date, dateSessions]) => (
        <div key={date} className="bg-white rounded-lg border shadow-sm overflow-hidden">
          {/* Date Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <h3 className="text-lg font-semibold">{date}</h3>
              <span className="ml-auto text-sm opacity-90">
                {dateSessions.length} session{dateSessions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Sessions Timeline */}
          <div className="divide-y">
            {dateSessions.map((session, index) => {
              const duration = Math.round(
                (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60)
              )

              return (
                <div
                  key={session.id}
                  onClick={() => onSessionClick?.(session.id)}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className="flex gap-4">
                    {/* Time Column */}
                    <div className="flex-shrink-0 w-32">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <Clock className="h-4 w-4 text-indigo-600" />
                        {formatTime(session.startTime)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 ml-6">
                        {duration} min
                      </div>
                    </div>

                    {/* Session Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {session.title}
                          </h4>
                          {session.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {session.description}
                            </p>
                          )}
                        </div>
                        
                        {session.track && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTrackColor(session.track)}`}>
                            {session.track}
                          </span>
                        )}
                      </div>

                      {/* Meta Information */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                        {session.room && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{session.room}</span>
                          </div>
                        )}
                        {session.capacity && (
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span>Capacity: {session.capacity}</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          Ends: {formatTime(session.endTime)}
                        </div>
                        {eventId && (
                          <a 
                            href={`/events/${eventId}/sessions/${session.id}/stream`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium transition-colors"
                          >
                            <Radio className="h-3 w-3" />
                            Stream
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Connector Line (except for last item) */}
                  {index < dateSessions.length - 1 && (
                    <div className="ml-16 mt-4 border-l-2 border-gray-200 h-4" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
