'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Users,
  Ticket,
  ChevronRight,
  ChevronDown,
  User,
  Share2,
  Info,
  CheckCircle2,
  AlertCircle,
  Menu,
  Car
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocationDetection } from '@/hooks/useLocationDetection'

// Helper to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in km
  return d
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}

function estimateTravelTime(distanceKm: number) {
  // Assume average speed of 30km/h in city traffic
  const speed = 30
  const timeHours = distanceKm / speed
  const timeMinutes = Math.round(timeHours * 60)
  
  if (timeMinutes < 60) {
    return `${timeMinutes} mins`
  }
  const hours = Math.floor(timeMinutes / 60)
  const mins = timeMinutes % 60
  return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
}

export default function PublicEventPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const { location: userLocation } = useLocationDetection()
  
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<any | null>(null)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'lineup' | 'agenda' | 'faq'>('overview')
  const [scrolled, setScrolled] = useState(false)
  const [travelTime, setTravelTime] = useState<string | null>(null)
  const [distance, setDistance] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!id) return
    let cancelled = false
      ; (async () => {
        try {
          const eventRes = await fetch(`/api/events/${id}/public`, { cache: 'no-store' })
          if (!eventRes.ok) throw new Error('Event not found')
          const data = await eventRes.json()
          if (!cancelled) setEvent(data)
        } catch (e) {
          if (!cancelled) setEvent(null)
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    return () => { cancelled = true }
  }, [id])

  // Calculate travel time when event and user location are available
  useEffect(() => {
    if (event?.latitude && event?.longitude && userLocation?.latitude && userLocation?.longitude) {
      const dist = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        event.latitude,
        event.longitude
      )
      setDistance(dist.toFixed(1))
      setTravelTime(estimateTravelTime(dist))
    }
  }, [event, userLocation])

  if (!id) return null

  // Mock FAQ if not present in event data
  const faqs = [
    {
      q: "What should I bring to the event?",
      a: "Please bring your ticket (digital or printed) and a valid ID. If it's a workshop, you might want to bring a notebook and pen."
    },
    {
      q: "Is there parking available?",
      a: "Yes, there is parking available at the venue. We recommend arriving early to secure a spot."
    },
    {
      q: "What is the refund policy?",
      a: "Refunds are available up to 48 hours before the event starts. Please contact support for assistance."
    }
  ]

  const toggleFollow = () => {
    setIsFollowing(!isFollowing)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-lg w-full">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-slate-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Event Not Found</h1>
          <p className="text-slate-500 mb-8">The event you are looking for does not exist, has been removed, or the link is incorrect.</p>
          <Link href="/dashboard/user" className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors w-full">
            Browse All Events
          </Link>
        </div>
      </div>
    )
  }

  const isEventEnded = event.isEnded

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 font-sans">
      {/* Navbar */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md border-b shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link href="/dashboard/user" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl group-hover:rotate-12 transition-transform shadow-lg">P</div>
            <span className={`font-bold text-xl tracking-tight transition-colors ${scrolled ? 'text-slate-900' : 'text-slate-900 md:text-white'}`}>Plannr</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {!isEventEnded && (
              <Link href={`/events/${id}/register`}
                className="px-6 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95 shadow-md">
                Get Tickets
              </Link>
            )}
          </div>

          <button className="md:hidden p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 md:pt-0">
          <div className="absolute top-0 inset-x-0 h-[600px] bg-slate-900 overflow-hidden hidden md:block">
            {/* Background Decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-slate-900/80 to-purple-900/60" />
            
            {event.bannerUrl && (
              <img
                src={event.bannerUrl}
                alt={event.name}
                className="w-full h-full object-cover opacity-50 mix-blend-overlay"
              />
            )}
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-40 relative z-10">
            <div className="grid lg:grid-cols-12 gap-10 items-start">
              {/* Left Column: Brief Info */}
              <div className="lg:col-span-12 space-y-6 md:text-white">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold uppercase tracking-widest text-indigo-600 md:text-white">
                      {event.category || 'Event'}
                    </span>
                    
                    {isEventEnded ? (
                       <span className="px-3 py-1 rounded-full bg-red-500/80 backdrop-blur-md border border-red-400/30 text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3" />
                        Event Ended
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-green-500/80 backdrop-blur-md border border-green-400/30 text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Live Event
                      </span>
                    )}
                  </div>

                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-slate-900 md:text-white">
                    {event.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-lg md:text-xl text-slate-600 md:text-white/90">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-500 md:text-indigo-300" />
                      <span>{event.startsAt ? new Date(event.startsAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Date TBA'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-indigo-500 md:text-indigo-300" />
                      <span>{event.eventMode === 'VIRTUAL' ? 'Online Event' : (event.venue || event.city || 'Venue TBA')}</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-8 space-y-12">
                {/* Glassmorphism Summary Card */}
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-100 border p-1 md:p-8">
                  <div className="md:hidden w-full aspect-[16/9] rounded-2xl overflow-hidden mb-6 relative">
                    <img
                      src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=2070&auto=format&fit=crop'}
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                    {isEventEnded && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-xl uppercase tracking-widest border-2 border-white px-6 py-2 rounded-lg transform -rotate-12">Event Ended</span>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 px-6 pb-6 md:p-0">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date & Time</p>
                      <p className="text-lg font-bold text-slate-900">
                        {event.startsAt ? new Date(event.startsAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}
                      </p>
                      <p className="text-slate-500 font-medium">
                        {event.startsAt ? new Date(event.startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'TBA'} - {event.endsAt ? new Date(event.endsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'TBA'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location</p>
                      <p className="text-lg font-bold text-slate-900">{event.eventMode === 'VIRTUAL' ? 'Online' : (event.venue || event.city || 'TBA')}</p>
                      {travelTime && (
                        <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm mt-1">
                           <Car className="w-4 h-4" />
                           <span>~{travelTime} ({distance} km) from your location</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description Section with Read More */}
                  <div className="mt-10 border-t pt-10 px-6 pb-6 md:p-0 md:border-none md:mt-12">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                      About this event
                    </h3>
                    <div className={`prose prose-slate max-w-none text-slate-600 relative ${!showFullDescription ? 'max-h-60 overflow-hidden' : ''}`}>
                      {event.description ? (
                        <div className="whitespace-pre-wrap leading-relaxed space-y-4">
                          {event.description}
                        </div>
                      ) : (
                        <p className="italic text-slate-400">No description provided for this event.</p>
                      )}
                      {!showFullDescription && event.description && event.description.length > 300 && (
                        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                      )}
                    </div>
                    {event.description && event.description.length > 300 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="mt-4 text-indigo-600 font-bold flex items-center gap-1.5 hover:gap-3 transition-all"
                      >
                        {showFullDescription ? (
                          <>Show less <ChevronDown className="w-4 h-4 rotate-180" /></>
                        ) : (
                          <>Read more <ChevronDown className="w-4 h-4" /></>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabs: Lineup, Agenda, FAQ */}
                <div className="space-y-8">
                  <div className="flex border-b overflow-x-auto scrollbar-hide">
                    {[
                      { id: 'overview', label: 'Overview' },
                      { id: 'agenda', label: 'Agenda' },
                      { id: 'lineup', label: 'Speakers' },
                      { id: 'faq', label: 'FAQ' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-8 py-4 font-bold text-sm uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="py-2">
                    <AnimatePresence mode="wait">
                      {activeTab === 'overview' && (
                         <motion.div
                           key="overview"
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           className="grid md:grid-cols-2 gap-6"
                         >
                            <div className="bg-slate-50 p-6 rounded-2xl">
                               <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                 <Info className="w-5 h-5 text-indigo-600" />
                                 Event Highlights
                               </h4>
                               <ul className="space-y-3">
                                  <li className="flex items-start gap-3">
                                     <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                     <span className="text-slate-700">Immersive experience at {event.venue || 'a premium venue'}</span>
                                  </li>
                                  <li className="flex items-start gap-3">
                                     <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                     <span className="text-slate-700">Networking opportunities with industry leaders</span>
                                  </li>
                                  <li className="flex items-start gap-3">
                                     <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                     <span className="text-slate-700">Exclusive access to post-event materials</span>
                                  </li>
                               </ul>
                            </div>
                            
                            <div className="bg-slate-50 p-6 rounded-2xl">
                               <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                 <Users className="w-5 h-5 text-indigo-600" />
                                 Who Should Attend
                               </h4>
                               <p className="text-slate-600 mb-4">
                                  This event is perfect for professionals, enthusiasts, and anyone looking to gain deep insights into {event.category || 'the industry'}.
                               </p>
                            </div>
                         </motion.div>
                      )}

                      {activeTab === 'agenda' && (
                        <motion.div
                          key="agenda"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-6"
                        >
                          {event.sessions && event.sessions.length > 0 ? (
                            event.sessions.map((session: any, i: number) => (
                              <div key={session.id} className="flex gap-6 group">
                                <div className="w-32 flex-shrink-0 text-slate-400 font-bold pt-1">
                                  {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex-1 pb-8 border-l-2 border-slate-100 pl-8 relative group-last:border-transparent">
                                  <div className="absolute top-1 -left-[9px] w-4 h-4 rounded-full border-4 border-white bg-indigo-600 shadow-sm" />
                                  <h4 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{session.title}</h4>
                                  <p className="text-slate-500 mt-2">{session.description}</p>
                                  {session.room && <div className="mt-3 text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full inline-block">{session.room}</div>}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl">
                              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                              <p className="text-slate-500">Detailed agenda coming soon.</p>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {activeTab === 'lineup' && (
                        <motion.div
                          key="lineup"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="grid sm:grid-cols-2 gap-8"
                        >
                          {event.speakers && event.speakers.length > 0 ? (
                            event.speakers.map((speaker: any) => (
                              <div key={speaker.id} className="group p-6 rounded-3xl bg-slate-50 hover:bg-indigo-50 transition-colors border-2 border-transparent hover:border-indigo-100">
                                <div className="flex items-center gap-4">
                                  <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 border-4 border-white shadow-md">
                                    {speaker.photoUrl ? (
                                      <img src={speaker.photoUrl} alt={speaker.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                                        <User className="w-10 h-10" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-xl text-slate-900">{speaker.name}</h4>
                                    <p className="text-indigo-600 font-semibold text-sm">{speaker.title}</p>
                                  </div>
                                </div>
                                <p className="mt-4 text-slate-600 text-sm line-clamp-3 italic">{speaker.bio || "Speaker bio coming soon."}</p>
                              </div>
                            ))
                          ) : (
                             <div className="col-span-2 text-center py-12 bg-slate-50 rounded-2xl">
                              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                              <p className="text-slate-500">Speakers list to be announced.</p>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {activeTab === 'faq' && (
                        <motion.div
                          key="faq"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          {faqs.map((faq, i) => (
                            <details key={i} className="group rounded-2xl border bg-slate-50/50 open:bg-white open:shadow-xl open:shadow-indigo-50/50 transition-all duration-300">
                              <summary className="flex items-center justify-between p-6 cursor-pointer font-bold text-lg list-none">
                                <span>{faq.q}</span>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-open:rotate-90 transition-transform" />
                              </summary>
                              <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                                {faq.a}
                              </div>
                            </details>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Ticket Sticking Sidebar */}
              <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-6">
                <div className={`bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-200 border-4 border-indigo-50 p-8 flex flex-col gap-8 ${isEventEnded ? 'opacity-80 grayscale-[0.5]' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Tickets starting at</p>
                      <p className="text-4xl font-extrabold text-slate-900">{event.priceInr ? `₹${event.priceInr}` : 'FREE'}</p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Ticket className="w-8 h-8" strokeWidth={2.5} />
                    </div>
                  </div>

                  {isEventEnded ? (
                    <div className="bg-red-50 rounded-2xl p-6 text-center border-2 border-red-100">
                      <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-red-700 mb-1">Event Has Ended</h3>
                      <p className="text-red-600/80 text-sm">Ticket booking is closed for this event.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <span>Instant Confirmation</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <span>Secure Payment</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <span>Mobile Ticket</span>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4">
                        <Link href={`/events/${id}/register`}
                          className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-sm hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-[0.98] text-center block"
                        >
                          Book Ticket Now
                        </Link>
                        <button className="w-full py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold text-sm hover:border-indigo-100 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                          <Share2 className="w-4 h-4" /> Share Event
                        </button>
                      </div>

                      <div className="bg-amber-50 rounded-2xl p-4 flex gap-3 items-center border border-amber-100">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <p className="text-xs font-bold text-amber-900 leading-tight">Limited capacity: {event.registrationCount > 0 ? (100 - event.registrationCount % 100) : 100} spots left.</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Organizer Card */}
                <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Organized by</h5>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center border border-white/20">
                      {event.organizerLogo ? (
                        <img src={event.organizerLogo} alt={event.organizerName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-white/40" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{event.organizerName || 'Event Organizer'}</p>
                      <p className="text-xs font-medium text-slate-400">{event.organizerEventsCount || 0} Hosted Events</p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleFollow}
                    className={`w-full py-4 rounded-xl border transition-all font-bold text-sm ${isFollowing ? 'bg-white text-indigo-900 border-white' : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'}`}
                  >
                    {isFollowing ? 'Following' : 'Follow Organizer'}
                  </button>
                  <button className="w-full text-slate-500 hover:text-white mt-4 text-sm font-bold transition-colors">Contact Support</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Decoration */}
        {!isEventEnded && (
          <section className="py-24 max-w-7xl mx-auto px-4">
            <div className="bg-indigo-600 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
              <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] bg-indigo-400/20 blur-[100px] rounded-full" />
              <div className="relative z-10 space-y-8">
                <h2 className="text-4xl md:text-5xl font-black max-w-3xl mx-auto leading-tight">Ready to join us?</h2>
                <p className="text-xl text-indigo-100 max-w-2xl mx-auto">Secure your spot today and be part of this amazing experience.</p>
                <Link href={`/events/${id}/register`}
                  className="inline-flex items-center gap-3 px-10 py-5 bg-white text-indigo-600 rounded-full font-black uppercase tracking-widest text-sm hover:shadow-2xl hover:scale-105 transition-all active:scale-95"
                >
                  Book Ticket <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Mobile Sticky Bar */}
      <AnimatePresence>
        {scrolled && !isEventEnded && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 inset-x-0 z-50 p-4 md:hidden"
          >
            <div className="bg-white rounded-3xl shadow-2xl border p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Starting at</p>
                <p className="text-xl font-black text-slate-900">{event?.priceInr ? `₹${event.priceInr}` : 'FREE'}</p>
              </div>
              <Link href={`/events/${id}/register`} className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest">
                Book Ticket
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="bg-slate-50 py-20 border-t">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">P</div>
            <span className="font-bold text-lg tracking-tight text-slate-900">Plannr</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-slate-400 uppercase tracking-widest">
            <button className="hover:text-indigo-600 transition-colors">Privacy</button>
            <button className="hover:text-indigo-600 transition-colors">Terms</button>
            <button className="hover:text-indigo-600 transition-colors">Support</button>
          </div>
          <p className="text-sm text-slate-400 font-medium tracking-tight">© 2026 Plannr. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
