"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  Calendar,
  MapPin,
  Clock,
  Share2,
  ArrowLeft,
  Ticket,
  Info,
  MessageCircle,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { motion } from "framer-motion"
import { BrandedLoader } from "@/components/ui/branded-loader" // Assuming this exists or generic loader

export default function PublicEventPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'agenda' | 'faq'>('overview')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return;

    // Reset state
    setLoading(true)
    setError(null)

    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${id}/public`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })

        if (!res.ok) {
          // If 404, we throw specific error
          if (res.status === 404) throw new Error('Event not found')
          throw new Error('Failed to load event')
        }

        const data = await res.json()
        setEvent(data)
      } catch (e: any) {
        console.error(e)
        setEvent(null)
        setError(e.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [id])

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: `Check out ${event.name}!`,
          url: url
        })
      } catch (e) {
        // Ignore abort
      }
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const navigateToMap = () => {
    if (event?.latitude && event?.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`, '_blank')
    } else if (event?.venue) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue + ' ' + event.city)}`, '_blank')
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50"><div className="animate-pulse text-slate-700 font-semibold">Loading Event...</div></div>

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Event Not Found</h1>
        <p className="text-slate-500 max-w-md mx-auto mb-8 text-lg">
          This event may have been cancelled, deleted, or the link is incorrect.
        </p>
        <Link href="/dashboard/user" className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-white transition-all bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg hover:shadow-xl hover:scale-105">
          Go to Events
        </Link>
      </div>
    )
  }

  const isEnded = event.isEnded
  const remainingSpots = Math.max(0, 100 - (event.registrationCount || 0)) // Using 100 as placeholder capacity if not in API yet, fix later

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header Image - Clean without text */}
      <div className="relative h-[40vh] md:h-[50vh] w-full bg-slate-900 overflow-hidden">
        {event.bannerUrl ? (
          <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600" />
        )}
        {/* Subtle gradient at bottom for smooth blending */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-900/50 to-transparent" />

        {/* Navigation & Share */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center z-20">
          <Link href="/dashboard/user" className="w-11 h-11 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-slate-700 hover:bg-white shadow-lg transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <button onClick={handleShare} className="w-11 h-11 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-slate-700 hover:bg-white shadow-lg transition-all">
            {copied ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Content Card - Floating overlap */}
      <div className="max-w-5xl mx-auto px-4 relative z-10 -mt-20 md:-mt-32 pb-20">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          
          {/* Event Header Section */}
          <div className="p-6 md:p-10 border-b border-slate-100">
            <div className="flex flex-col gap-6">
              
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-4 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-lg border border-indigo-100">
                    {event.category || 'Event'}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
                    {event.name}
                  </h1>
                </div>
                
                {/* Price Tag - Desktop */}
                <div className="hidden md:block text-right">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Ticket Price</p>
                  <p className="text-4xl font-black text-slate-900">
                    {event.priceInr ? `₹${event.priceInr.toLocaleString()}` : <span className="text-green-600">Free</span>}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-0.5">Date</p>
                    <p className="font-bold text-slate-900">
                      {new Date(event.startsAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-0.5">Time</p>
                    <p className="font-bold text-slate-900">
                      {new Date(event.startsAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-indigo-50 hover:border-indigo-100 transition-colors group" onClick={navigateToMap}>
                  <div className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-600 group-hover:text-indigo-700">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-0.5">Location</p>
                    <p className="font-bold text-slate-900 truncate pr-2 group-hover:text-indigo-700">
                      {event.venue || event.city}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row gap-4 pt-4">
                {isEnded ? (
                  <button disabled className="w-full md:w-auto px-8 py-4 rounded-xl bg-slate-100 text-slate-400 font-bold text-lg cursor-not-allowed flex-1 text-center">
                    Event Ended
                  </button>
                ) : (
                  <button
                    onClick={() => router.push(`/events/${id}/register`)}
                    className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-xl shadow-indigo-200 hover:shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2 flex-1"
                  >
                    <Ticket className="w-5 h-5" />
                    Book Tickets Now
                  </button>
                )}
                
                {/* Organizer Info */}
                {event.organizerName && (
                  <div className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {event.organizerName[0]}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Organized by</p>
                      <p className="font-bold text-slate-900 text-sm">{event.organizerName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Promo Banner - Compact */}
          {!isEnded && event.promoCodes && event.promoCodes.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white relative overflow-hidden">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Ticket className="w-4 h-4" />
                  <div>
                    <p className="text-sm font-semibold">Special Offer</p>
                    <p className="text-xs text-indigo-100">
                      Use code <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-white">{event.promoCodes[0].code}</span> for {event.promoCodes[0].type === 'PERCENT' ? `${event.promoCodes[0].amount}%` : `₹${event.promoCodes[0].amount}`} off
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(event.promoCodes[0].code);
                    alert('Code copied!');
                  }}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold backdrop-blur-sm transition-colors whitespace-nowrap"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* Tabs - Compact */}
          <div className="flex items-center gap-6 border-b border-slate-200 mb-6 overflow-x-auto">
            {['Overview', 'Agenda', 'FAQ'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase() as any)}
                className={`pb-3 text-sm font-semibold relative transition-colors ${activeTab === tab.toLowerCase() ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {tab}
                {activeTab === tab.toLowerCase() && (
                  <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                )}
              </button>
            ))}
          </div>

          {/* Content Areas - Compact */}
          <div className="min-h-[200px] px-1">
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">About this Event</h3>
                  <div className="text-slate-600 leading-relaxed text-sm">
                    {event.description || 'No description provided.'}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col md:flex-row gap-5 items-start">
                  <img
                    src={`https://api.maptiler.com/maps/streets/static/${event.longitude},${event.latitude},14/300x150.png?key=fXmTWJM642uPLXP4QqHV`}
                    alt="Map"
                    className="w-full md:w-40 h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity bg-slate-200"
                    onError={(e) => e.currentTarget.src = 'https://placehold.co/300x150?text=Map'}
                    onClick={navigateToMap}
                  />
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-slate-900 text-sm">Venue Location</h4>
                    <p className="text-slate-600 text-sm">{event.venue || 'Venue TBD'}</p>
                    <p className="text-slate-500 text-xs">{event.city}</p>
                    <button onClick={navigateToMap} className="text-indigo-600 text-xs font-semibold flex items-center gap-1 hover:underline">
                      Get Directions <MapPin className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'agenda' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {event.sessions && event.sessions.length > 0 ? (
                  event.sessions.map((session: any) => (
                    <div key={session.id} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="md:w-32 shrink-0 text-center md:text-left">
                        <p className="font-bold text-slate-900">{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-xs text-slate-400">{new Date(session.startTime).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1">{session.title}</h4>
                        <p className="text-sm text-slate-600 mb-2">{session.description}</p>
                        {session.speakers?.length > 0 && (
                          <div className="flex items-center gap-2">
                            {session.speakers.map((s: any) => (
                              <div key={s.speaker.id} className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                {s.speaker.photoUrl && <img src={s.speaker.photoUrl} className="w-4 h-4 rounded-full" />}
                                {s.speaker.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Detailed agenda coming soon.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'faq' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Placeholder FAQs */}
                {[
                  { q: "Is there parking available?", a: "Yes, there is designated parking at the venue." },
                  { q: "Can I get a refund?", a: "Refunds are processed up to 48 hours before the event start time." },
                  { q: "Is food provided?", a: "Light refreshments and beverages will be available throughout the event." }
                ].map((faq, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-5 hover:border-indigo-200 hover:shadow-md transition-all bg-white">
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-indigo-500" />
                      {faq.q}
                    </h4>
                    <p className="text-slate-600 text-sm ml-6">{faq.a}</p>
                  </div>
                ))}

                <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 text-center border border-indigo-100">
                  <p className="text-sm font-bold text-indigo-900 mb-2">Still have questions?</p>
                  <div className="flex items-center justify-center gap-4 text-sm text-indigo-700">
                    <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> support@eventplanner.com</span>
                    <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> +1 (555) 123-4567</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

        </div>
      </div>

      {/* Sticky Bottom Bar for Mobile */}
      {!isEnded && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-50 flex items-center justify-between shadow-2xl">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Total</p>
            <p className="text-xl font-black text-slate-900">{event.priceInr ? `₹${event.priceInr}` : 'Free'}</p>
          </div>
          <button
            onClick={() => router.push(`/events/${id}/register`)}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Book Now
          </button>
        </div>
      )}

    </div>
  )
}
