"use client"

import { useSession } from "next-auth/react"
import ManageTabs from '@/components/events/ManageTabs'
import { useEffect, useMemo, useState } from 'react'
import { Send, MessageSquare } from 'lucide-react'

type FeedPost = {
  id: string
  message: string
  author: string
  createdAt: string
}

export default function EventEngagementPage({ params }: { params: { id: string } }) {
  const { status, data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [registrations, setRegistrations] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])

  // Feed state
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [posting, setPosting] = useState(false)

  const totals = useMemo(() => ({
    registrations: registrations.length,
    tickets: tickets.length,
    sessions: sessions.length,
  }), [registrations, tickets, sessions])

  const loadFeed = async () => {
    try {
      const res = await fetch(`/api/events/${params.id}/feed`, {
        cache: 'no-store',
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setFeedPosts(data.posts || [])
      }
    } catch (e) {
      console.error('Failed to load feed:', e)
    }
  }

  useEffect(() => {
    let aborted = false
    async function load() {
      try {
        setLoading(true); setError(null)
        const [rRes, tRes, sRes] = await Promise.all([
          fetch(`/api/events/${params.id}/registrations?page=0&size=50`, { cache: 'no-store', credentials: 'include' }),
          fetch(`/api/events/${params.id}/tickets`, { cache: 'no-store', credentials: 'include' }),
          fetch(`/api/events/${params.id}/sessions?page=0&size=50`, { cache: 'no-store', credentials: 'include' }),
        ])

        const rJson = rRes.ok ? await rRes.json() : { registrations: [] }
        const tJson = tRes.ok ? await tRes.json() : []
        const sJson = sRes.ok ? await sRes.json() : { content: [] }

        if (aborted) return
        // Handle new registrations API format
        const registrationsList = rJson?.registrations || rJson?.content || []
        setRegistrations(Array.isArray(registrationsList) ? registrationsList : [])
        setTickets(Array.isArray(tJson) ? tJson : (Array.isArray(tJson?.content) ? tJson.content : []))
        setSessions(Array.isArray(sJson?.content) ? sJson.content : [])

        // Load feed
        await loadFeed()
      } catch (e: any) {
        if (!aborted) setError(e?.message || 'Failed to load engagement metrics')
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    if (status !== 'loading') load()
    return () => { aborted = true }
  }, [status, params.id])

  const postMessage = async () => {
    if (!newMessage.trim()) return

    setPosting(true)
    try {
      const res = await fetch(`/api/events/${params.id}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: newMessage })
      })

      if (!res.ok) throw new Error('Failed to post message')

      const data = await res.json()
      // Add new post to the top of the feed
      setFeedPosts(prev => [data.post, ...prev])
      setNewMessage('')
    } catch (e: any) {
      alert(e?.message || 'Failed to post message')
    } finally {
      setPosting(false)
    }
  }

  if (status === 'loading') return <div className="p-6">Loading...</div>
  return (
    <div className="space-y-4">
      <ManageTabs eventId={params.id} />
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Engagement</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-md border bg-white p-4">
          <div className="text-xs text-muted-foreground">Registrations</div>
          <div className="text-2xl font-semibold">{totals.registrations}</div>
        </div>
        <div className="rounded-md border bg-white p-4">
          <div className="text-xs text-muted-foreground">Tickets</div>
          <div className="text-2xl font-semibold">{totals.tickets}</div>
        </div>
        <div className="rounded-md border bg-white p-4">
          <div className="text-xs text-muted-foreground">Sessions</div>
          <div className="text-2xl font-semibold">{totals.sessions}</div>
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-sm text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="p-4 text-sm text-rose-600">{error}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Event Feed - Takes 2 columns */}
          <div className="lg:col-span-2 rounded-md border bg-white p-4 space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-600" />
              <h2 className="text-sm font-semibold">Event Feed</h2>
            </div>

            {/* Post Input */}
            <div className="space-y-2">
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Share an update with attendees..."
                className="w-full rounded-md border px-3 py-2 text-sm min-h-20 resize-none"
                disabled={posting}
              />
              <div className="flex justify-end">
                <button
                  onClick={postMessage}
                  disabled={posting || !newMessage.trim()}
                  className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>

            {/* Feed Posts */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {feedPosts.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No posts yet. Be the first to share an update!
                </div>
              ) : (
                feedPosts.map(post => (
                  <div key={post.id} className="rounded-md border p-3 bg-slate-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-sm">{post.author}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{post.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar - Recent Activity */}
          <div className="space-y-4">
            <div className="rounded-md border bg-white p-4">
              <div className="text-sm font-medium mb-2">Recent Registrations</div>
              {registrations.length === 0 ? (
                <div className="text-sm text-muted-foreground">No registrations yet.</div>
              ) : (
                <ul className="text-sm divide-y">
                  {registrations.slice(0, 5).map((r: any) => {
                    const name = r.firstName && r.lastName ? `${r.firstName} ${r.lastName}` : r.name || r.email || `#${r.id}`
                    const email = r.email || r.dataJson?.email || ''
                    const status = r.status || 'REGISTERED'
                    return (
                      <li key={r.id} className="py-2">
                        <div className="font-medium truncate text-xs">{name}</div>
                        <div className="text-xs text-muted-foreground truncate">{email}</div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="rounded-md border bg-white p-4">
              <div className="text-sm font-medium mb-2">Upcoming Sessions</div>
              {sessions.length === 0 ? (
                <div className="text-sm text-muted-foreground">No sessions yet.</div>
              ) : (
                <ul className="text-sm divide-y">
                  {sessions.slice(0, 5).map((s: any) => (
                    <li key={s.id} className="py-2">
                      <div className="font-medium truncate text-xs">{s.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.startTime}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
