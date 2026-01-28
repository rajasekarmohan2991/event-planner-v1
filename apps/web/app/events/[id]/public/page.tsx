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
  Car,
  Sparkles,
  Heart
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
      <div className="min-h-screen bg-rose-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-rose-50/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] shadow-xl shadow-rose-100 p-12 text-center max-w-lg w-full border border-rose-100">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-rose-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Event Not Found</h1>
          <p className="text-slate-500 mb-8">The event you are looking for does not exist, has been removed, or the link is incorrect.</p>
          <Link href="/dashboard/user" className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold hover:shadow-lg hover:shadow-rose-200 transition-all w-full">
            Browse All Events
          </Link>
        </div>
      </div>
    )
  }

  const isEventEnded = event.isEnded

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-rose-100 selection:text-rose-900 font-sans">
      {/* Navbar */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-rose-100 shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link href="/dashboard/user" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-bold text-xl group-hover:rotate-12 transition-transform shadow-lg shadow-rose-200">P</div>
            <span className={`font-bold text-xl tracking-tight transition-colors ${scrolled ? 'text-slate-900' : 'text-slate-900'}`}>Plannr</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {!isEventEnded && (
              <Link href={`/events/${id}/register`}
                className="px-6 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 hover:shadow-lg transition-all active:scale-95 shadow-md">
                Get Tickets
              </Link>
            )}
          </div>

          <button className="md:hidden p-2 rounded-lg bg-rose-50 text-rose-600">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      <main>
        {/* Hero Section - Light & Refreshing */}
        <section className="relative pt-32 md:pt-40 pb-20 overflow-hidden">
          {/* Background Decorative Blobs */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[80%] bg-rose-200/20 blur-[120px] rounded-full mix-blend-multiply" />
            <div className="absolute top-[10%] -right-[10%] w-[60%] h-[80%] bg-purple-200/20 blur-[120px] rounded-full mix-blend-multiply" />
            <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-orange-100/40 blur-[100px] rounded-full mix-blend-multiply" />
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
            <div className="grid lg:grid-cols-12 gap-10 items-start">
              {/* Left Column: Brief Info */}
              <div className="lg:col-span-12 space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-4 py-1.5 rounded-full bg-white border border-rose-100 text-xs font-bold uppercase tracking-widest text-rose-600 shadow-sm flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      {event.category || 'Event'}
                    </span>
                    
                    {isEventEnded ? (
                       <span className="px-4 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3" />
                        Event Ended
                      </span>
                    ) : (
                      <span className="px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Event
                      </span>
                    )}
                  </div>

                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1] text-slate-900">
                    {event.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-y-4 gap-x-8 text-lg md:text-xl text-slate-600">
                    <div className="flex items-center gap-2.5 p-2 pr-4 rounded-xl hover:bg-white/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <span className="font-medium">{event.startsAt ? new Date(event.startsAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Date TBA'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-2 pr-4 rounded-xl hover:bg-white/50 transition-colors">
                       <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <span className="font-medium">{event.eventMode === 'VIRTUAL' ? 'Online Event' : (event.venue || event.city || 'Venue TBA')}</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-8 space-y-12 mt-8">
                {/* Clean Summary Card */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-rose-100/50 border border-rose-50 p-2 md:p-3">
                  <div className="w-full aspect-[16/9] md:aspect-[21/9] rounded-[2rem] overflow-hidden relative shadow-inner">
                    <img
                      src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=2070&auto=format&fit=crop'}
                      alt={event.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                    {isEventEnded && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-slate-900 font-black text-2xl uppercase tracking-widest border-4 border-slate-900 px-8 py-3 rounded-2xl transform -rotate-12">Event Ended</span>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Date & Time</p>
                      <p className="text-xl font-bold text-slate-900">
                        {event.startsAt ? new Date(event.startsAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}
                      </p>
                      <p className="text-slate-500 font-medium">
                        {event.startsAt ? new Date(event.startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'TBA'} - {event.endsAt ? new Date(event.endsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'TBA'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">Location</p>
                      <p className="text-xl font-bold text-slate-900">{event.eventMode === 'VIRTUAL' ? 'Online' : (event.venue || event.city || 'TBA')}</p>
                      {travelTime && (
                        <div className="flex items-center gap-2 text-rose-600 font-bold text-sm mt-1 bg-rose-50 px-3 py-1.5 rounded-full self-start inline-flex">
                           <Car className="w-4 h-4" />
                           <span>~{travelTime} ({distance} km) away</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="px-6 pb-6 md:px-8 md:pb-8">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-800">
                      About the event
                    </h3>
                    <div className={`prose prose-lg prose-slate max-w-none text-slate-600 relative ${!showFullDescription ? 'max-h-60 overflow-hidden' : ''}`}>
                      {event.description ? (
                        <div className="whitespace-pre-wrap leading-relaxed space-y-4">
                          {event.description}
                        </div>
                      ) : (
                        <p className="italic text-slate-400">No description provided for this event.</p>
                      )}
                      {!showFullDescription && event.description && event.description.length > 300 && (
                        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                      )}
                    </div>
                    {event.description && event.description.length > 300 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="mt-6 text-rose-600 font-bold flex items-center gap-1.5 hover:gap-3 transition-all px-4 py-2 rounded-full hover:bg-rose-50"
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
                  <div className="flex border-b border-slate-100 overflow-x-auto scrollbar-hide px-2">
                    {[
                      { id: 'overview', label: 'Overview' },
                      { id: 'agenda', label: 'Agenda' },
                      { id: 'lineup', label: 'Speakers' },
                      { id: 'faq', label: 'FAQ' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-8 py-4 font-bold text-sm uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
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
                            <div className="bg-white border border-rose-50 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                               <h4 className="font-bold text-xl mb-6 flex items-center gap-3 text-slate-900">
                                 <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                                    <Info className="w-5 h-5" />
                                 </div>
                                 Highlights
                               </h4>
                               <ul className="space-y-4">
                                  <li className="flex items-start gap-4">
                                     <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                     </div>
                                     <span className="text-slate-600 font-medium">Immersive experience at {event.venue || 'a premium venue'}</span>
                                  </li>
                                  <li className="flex items-start gap-4">
                                     <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                     </div>
                                     <span className="text-slate-600 font-medium">Networking opportunities with industry leaders</span>
                                  </li>
                                  <li className="flex items-start gap-4">
                                     <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                     </div>
                                     <span className="text-slate-600 font-medium">Exclusive access to post-event materials</span>
                                  </li>
                               </ul>
                            </div>
                            
                            <div className="bg-white border border-purple-50 p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                               <h4 className="font-bold text-xl mb-6 flex items-center gap-3 text-slate-900">
                                 <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                    <Users className="w-5 h-5" />
                                 </div>
                                 Who Should Attend
                               </h4>
                               <p className="text-slate-600 leading-relaxed font-medium">
                                  This event is perfect for professionals, enthusiasts, and anyone looking to gain deep insights into {event.category || 'the industry'}. Whether you're a beginner or an expert, you'll find value here.
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
                              <div key={session.id} className="flex gap-6 group bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-rose-100 hover:shadow-lg hover:shadow-rose-100/30 transition-all">
                                <div className="w-24 md:w-32 flex-shrink-0 flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-2 h-full min-h-[5rem]">
                                  <span className="text-slate-900 font-black text-lg">
                                     {new Date(session.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).split(' ')[0]}
                                  </span>
                                  <span className="text-slate-400 font-bold text-xs uppercase">
                                     {new Date(session.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).split(' ')[1]}
                                  </span>
                                </div>
                                <div className="flex-1 py-2">
                                  <h4 className="text-xl font-bold text-slate-900 group-hover:text-rose-600 transition-colors">{session.title}</h4>
                                  <p className="text-slate-500 mt-2 font-medium">{session.description}</p>
                                  {session.room && <div className="mt-4 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full inline-block tracking-widest uppercase">{session.room}</div>}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
                              <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                              <p className="text-slate-500 font-medium">Detailed agenda coming soon.</p>
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
                          className="grid sm:grid-cols-2 gap-6"
                        >
                          {event.speakers && event.speakers.length > 0 ? (
                            event.speakers.map((speaker: any) => (
                              <div key={speaker.id} className="group p-6 rounded-[2.5rem] bg-white border border-slate-100 hover:border-rose-100 hover:shadow-xl hover:shadow-rose-100/30 transition-all">
                                <div className="flex items-center gap-5">
                                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-rose-50 shadow-inner">
                                    {speaker.photoUrl ? (
                                      <img src={speaker.photoUrl} alt={speaker.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-rose-300">
                                        <User className="w-8 h-8" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-xl text-slate-900">{speaker.name}</h4>
                                    <p className="text-rose-600 font-bold text-sm uppercase tracking-wider mt-1">{speaker.title}</p>
                                  </div>
                                </div>
                                <p className="mt-6 text-slate-600 text-sm leading-relaxed">{speaker.bio || "Speaker bio coming soon."}</p>
                              </div>
                            ))
                          ) : (
                             <div className="col-span-2 text-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
                              <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                              <p className="text-slate-500 font-medium">Speakers list to be announced.</p>
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
                            <details key={i} className="group rounded-[2rem] border border-slate-100 bg-white open:shadow-xl open:shadow-rose-100/30 open:border-rose-100 transition-all duration-300">
                              <summary className="flex items-center justify-between p-8 cursor-pointer font-bold text-lg list-none text-slate-800">
                                <span>{faq.q}</span>
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-open:bg-rose-50 group-open:text-rose-600 transition-colors">
                                   <ChevronDown className="w-5 h-5 text-slate-400 group-open:text-rose-600 transition-transform group-open:rotate-180" />
                                </div>
                              </summary>
                              <div className="px-8 pb-8 text-slate-600 leading-relaxed font-medium">
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
              <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-8">
                <div className={`bg-white rounded-[3rem] shadow-2xl shadow-rose-100/50 border border-rose-50 p-8 flex flex-col gap-8 ${isEventEnded ? 'opacity-80 grayscale-[0.5]' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Tickets from</p>
                      <p className="text-5xl font-black text-slate-900 tracking-tight">{event.priceInr ? `₹${event.priceInr}` : 'FREE'}</p>
                    </div>
                    <div className="w-16 h-16 rounded-[1.5rem] bg-rose-50 flex items-center justify-center text-rose-600 transform rotate-3">
                      <Ticket className="w-8 h-8" strokeWidth={2} />
                    </div>
                  </div>

                  {isEventEnded ? (
                    <div className="bg-red-50 rounded-[2rem] p-8 text-center border border-red-100">
                      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-red-900 mb-2">Event Ended</h3>
                      <p className="text-red-600/80 font-medium">Bookings are closed.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-5">
                        <div className="flex items-center gap-4 text-sm font-bold text-slate-600">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                             <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span>Instant Confirmation</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-bold text-slate-600">
                           <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                             <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span>Secure Payment</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-bold text-slate-600">
                           <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                             <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span>Mobile Ticket</span>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4">
                        <Link href={`/events/${id}/register`}
                          className="w-full py-6 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black uppercase tracking-widest text-sm hover:shadow-xl hover:shadow-rose-200 transition-all active:scale-[0.98] text-center block"
                        >
                          Book Ticket Now
                        </Link>
                        <button className="w-full py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold text-sm hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center gap-2">
                          <Share2 className="w-4 h-4" /> Share Event
                        </button>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-5 flex gap-4 items-center border border-slate-100">
                        <div className="relative">
                           <div className="w-3 h-3 bg-amber-400 rounded-full animate-ping absolute top-0 left-0" />
                           <AlertCircle className="w-5 h-5 text-amber-500 relative z-10" />
                        </div>
                        <p className="text-xs font-bold text-slate-600 leading-tight">Hurry! Only {event.registrationCount > 0 ? (100 - event.registrationCount % 100) : 100} spots left for this session.</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Organizer Card */}
                <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Organized by</h5>
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
                      {event.organizerLogo ? (
                        <img src={event.organizerLogo} alt={event.organizerName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-xl text-slate-900">{event.organizerName || 'Event Organizer'}</p>
                      <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mt-1">{event.organizerEventsCount || 0} Hosted Events</p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleFollow}
                    className={`w-full py-4 rounded-2xl border-2 transition-all font-bold text-sm flex items-center justify-center gap-2 ${isFollowing ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-600'}`}
                  >
                    {isFollowing ? (
                        <>Following <CheckCircle2 className="w-4 h-4" /></>
                    ) : (
                        <>Follow Organizer <Heart className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Decoration */}
        {!isEventEnded && (
          <section className="py-24 max-w-7xl mx-auto px-4">
            <div className="bg-gradient-to-br from-rose-600 to-pink-600 rounded-[4rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-rose-200">
              <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] bg-white/10 blur-[100px] rounded-full" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[80%] bg-purple-500/30 blur-[100px] rounded-full" />
              
              <div className="relative z-10 space-y-8">
                <h2 className="text-4xl md:text-6xl font-black max-w-4xl mx-auto leading-[1.1] tracking-tight">Ready to join us?</h2>
                <p className="text-xl text-rose-100 max-w-2xl mx-auto font-medium">Secure your spot today and be part of this amazing experience.</p>
                <Link href={`/events/${id}/register`}
                  className="inline-flex items-center gap-3 px-10 py-6 bg-white text-rose-600 rounded-2xl font-black uppercase tracking-widest text-sm hover:shadow-2xl hover:scale-105 transition-all active:scale-95"
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
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-rose-900/10 border border-rose-100 p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Tickets from</p>
                <p className="text-2xl font-black text-slate-900">{event?.priceInr ? `₹${event.priceInr}` : 'FREE'}</p>
              </div>
              <Link href={`/events/${id}/register`} className="px-8 py-4 rounded-xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-slate-900/20">
                Book Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="bg-white py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-rose-200">P</div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Plannr</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-slate-400 uppercase tracking-widest">
            <button className="hover:text-rose-600 transition-colors">Privacy</button>
            <button className="hover:text-rose-600 transition-colors">Terms</button>
            <button className="hover:text-rose-600 transition-colors">Support</button>
          </div>
          <p className="text-sm text-slate-400 font-medium tracking-tight">© 2026 Plannr. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
