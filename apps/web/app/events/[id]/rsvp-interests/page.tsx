"use client"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Users, ThumbsUp, HelpCircle, ThumbsDown, Clock, Mail, User } from 'lucide-react'

interface RSVPInterest {
  id: string
  name: string
  email: string
  responseType: string
  status: string
  createdAt: string
}

export default function RSVPInterestsPage() {
  const params = useParams()
  const eventId = params.id as string
  const [interests, setInterests] = useState<RSVPInterest[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ going: 0, maybe: 0, notGoing: 0, pending: 0, total: 0 })

  useEffect(() => {
    loadInterests()
  }, [eventId])

  const loadInterests = async () => {
    try {
      setLoading(true)
      
      // Fetch summary
      const summaryRes = await fetch(`/api/events/${eventId}/rsvp-interest`)
      if (summaryRes.ok) {
        const data = await summaryRes.json()
        setSummary(data)
      }

      // Fetch detailed list
      const listRes = await fetch(`/api/events/${eventId}/rsvp-interests/list`)
      if (listRes.ok) {
        const data = await listRes.json()
        setInterests(data.interests || [])
      }
    } catch (error) {
      console.error('Failed to load RSVP interests:', error)
    } finally {
      setLoading(false)
    }
  }

  const getResponseIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'GOING': return <ThumbsUp className="w-5 h-5 text-green-600" />
      case 'MAYBE': return <HelpCircle className="w-5 h-5 text-yellow-600" />
      case 'NOT_GOING': return <ThumbsDown className="w-5 h-5 text-red-600" />
      default: return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getResponseBadge = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'GOING': return 'bg-green-100 text-green-800'
      case 'MAYBE': return 'bg-yellow-100 text-yellow-800'
      case 'NOT_GOING': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">RSVP Interests</h1>
          <button
            onClick={loadInterests}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Going</p>
                <p className="text-3xl font-bold text-green-700">{summary.going}</p>
              </div>
              <ThumbsUp className="w-10 h-10 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Maybe</p>
                <p className="text-3xl font-bold text-yellow-700">{summary.maybe}</p>
              </div>
              <HelpCircle className="w-10 h-10 text-yellow-600 opacity-50" />
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Not Going</p>
                <p className="text-3xl font-bold text-red-700">{summary.notGoing}</p>
              </div>
              <ThumbsDown className="w-10 h-10 text-red-600 opacity-50" />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total</p>
                <p className="text-3xl font-bold text-blue-700">{summary.total}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Interests List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Responses</h2>
          </div>
          
          {interests.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>No RSVP interests yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {interests.map((interest) => (
                <div key={interest.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getResponseIcon(interest.responseType)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <p className="font-medium text-gray-900">
                            {interest.name || 'Anonymous'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-600">{interest.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getResponseBadge(interest.responseType)}`}>
                        {interest.responseType}
                      </span>
                      <p className="text-sm text-gray-500">
                        {new Date(interest.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
