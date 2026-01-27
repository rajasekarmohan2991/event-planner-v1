'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  MapPin,
  Users,
  Ticket,
  Clock,
  ChevronRight,
  ChevronDown,
  User,
  Share2,
  Heart,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Menu,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PublicEventPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<any | null>(null)
  const [site, setSite] = useState<any | null>(null)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'lineup' | 'agenda' | 'faq'>('overview')
  const [scrolled, setScrolled] = useState(false)

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

          const designRes = await fetch(`/api/events/${id}/design/published`, { cache: 'no-store' })
          if (designRes.ok) {
            const pub = await designRes.json()
            if (!cancelled) setSite(pub?.site || null)
          }
        } catch (e) {
          if (!cancelled) setEvent(null)
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    return () => { cancelled = true }
  }, [id])

  if (!id) return null

  const primaryColor = site?.colors?.primary || '#6366f1' // Indigo 500

  // Mock FAQ if not present in event data
  const faqs = [
    {
      q: "What exactly will I learn in this masterclass?",
      a: "You will learn the exact operating system to scale revenue, automate your team, and build a business that runs without you."
    },
    {
      q: "Is this just going to be a sales pitch disguised as training?",
      a: "No, this is a value-packed training session with actionable frameworks. While there will be an opportunity to work further with us at the end, the core training is standalone."
    },
    {
      q: "I've tried EOS, Scaling Up, and other business frameworks. How is this different?",
      a: "This framework focuses specifically on the founder identity shift and the Unshakable Operating System which prioritizes governance over just management."
    }
  ]

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 italic-none font-sans">
      {/* Navbar */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl group-hover:rotate-12 transition-transform shadow-lg">E</div>
            <span className={`font-bold text-xl tracking-tight transition-colors ${scrolled ? 'text-slate-900' : 'text-slate-900 md:text-white'}`}>Plannr</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <button className={`text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-indigo-600' : 'text-slate-600 md:text-white/80 md:hover:text-white'}`}>Explore</button>
            <button className={`text-sm font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-indigo-600' : 'text-slate-600 md:text-white/80 md:hover:text-white'}`}>Contact</button>
            <Link href={`/events/${id}/register`}
              className="px-6 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95 shadow-md">
              Get Tickets
            </Link>
          </div>

          <button className="md:hidden p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {loading ? (
        <div className="pt-32 px-4 max-w-7xl mx-auto">
          <div className="h-[500px] w-full bg-slate-100 animate-pulse rounded-3xl" />
        </div>
      ) : !event ? (
        <div className="pt-40 text-center">
          <h1 className="text-3xl font-bold text-slate-800">Event Not Found</h1>
          <p className="text-slate-500 mt-2">The event you are looking for does not exist or has been moved.</p>
          <Link href="/" className="mt-6 inline-block text-indigo-600 font-medium font-sans">Back to Home</Link>
        </div>
      ) : (
        <main>
          {/* Hero Section */}
          <section className="relative pt-24 md:pt-0">
            <div className="absolute top-0 inset-x-0 h-[600px] bg-indigo-900 overflow-hidden hidden md:block">
              {/* Background Decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-transparent to-purple-900/50" />
              <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] bg-indigo-500/20 blur-[120px] rounded-full" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[80%] bg-purple-500/20 blur-[120px] rounded-full" />

              {event.bannerUrl && (
                <img
                  src={event.bannerUrl}
                  alt={event.name}
                  className="w-full h-full object-cover opacity-40 mix-blend-overlay"
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
                      <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold uppercase tracking-widest">
                        {event.category || 'Event'}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-indigo-500/40 backdrop-blur-md border border-indigo-400/30 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Live Event
                      </span>
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                      {event.name}
                    </h1>

                    <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-lg md:text-xl md:text-white/80">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-400" />
                        <span>By <span className="font-bold underline cursor-pointer">{event.organizerName || 'Dr. Toby Potter'}</span></span>
                        <button
                          onClick={(e) => {
                            const btn = e.currentTarget;
                            btn.innerText = btn.innerText === 'Following' ? 'Follow' : 'Following';
                            btn.classList.toggle('bg-white');
                            btn.classList.toggle('text-indigo-600');
                          }}
                          className="bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1 rounded-full text-sm font-semibold ml-2 transition-all active:scale-95"
                        >
                          Follow
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-indigo-400" />
                        <span>{event.eventMode === 'VIRTUAL' ? 'Online event' : (event.venue || event.city || 'TBA')}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-12">
                  {/* Glassmorphism Summary Card (Floating on Desktop) */}
                  <div className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-100 border p-1 md:p-8">
                    <div className="md:hidden w-full aspect-[16/9] rounded-2xl overflow-hidden mb-6">
                      <img
                        src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=2070&auto=format&fit=crop'}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 px-6 pb-6 md:p-0">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date & Time</p>
                        <p className="text-lg font-bold text-slate-900">
                          {event.startsAt ? new Date(event.startsAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}
                        </p>
                        <p className="text-slate-500 font-medium">
                          {event.startsAt ? new Date(event.startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '5:30am'} - {event.endsAt ? new Date(event.endsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '6:30am'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location</p>
                        <p className="text-lg font-bold text-slate-900">{event.eventMode === 'VIRTUAL' ? 'Online' : (event.venue || event.city || 'TBA')}</p>
                        <p className="text-indigo-600 font-medium cursor-pointer hover:underline text-sm">View on map</p>
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
                          <div className="space-y-4 leading-relaxed">
                            <p className="font-bold text-slate-900 text-lg">The exact operating system to scale revenue, automate your team, and build a business that runs without you. Join the free masterclass.</p>
                            <p>Discover what's possible when you finally install the operating system your business has been missing.</p>
                            <p>In this powerful session, Dr. Toby Potter, founder of The Unshakable Brand, reveals the exact framework that helped him escape the founder trap and build businesses that run without him. Whether you're stuck at a revenue plateau, drowning in daily operations, or exhausted from being the bottleneck in every decision, this masterclass will show you the identity shifts, systems, and structures that separate business owners who scale from those who stay stuck, overwhelmed, or burning out.</p>
                          </div>
                        )}
                        {!showFullDescription && (
                          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                        )}
                      </div>
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
                    </div>
                  </div>

                  {/* Tabs: Lineup, Agenda, FAQ */}
                  <div className="space-y-8">
                    <div className="flex border-b overflow-x-auto scrollbar-hide">
                      {[
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
                              <div className="space-y-6">
                                {[
                                  { t: "7:00 PM", title: "Welcome & Opening", d: "Introduction to the Scale Your Business framework." },
                                  { t: "7:05 PM", title: "The Problem: Why High-Performers Drift", d: "Understanding the drift effect in entrepreneurship." },
                                  { t: "7:20 PM", title: "Secret #1: The Identity Gap", d: "How your self-image limits your business growth." },
                                  { t: "7:35 PM", title: "Live Q&A with Dr. Toby Potter", d: "Get your specific business questions answered." }
                                ].map((item, i) => (
                                  <div key={i} className="flex gap-6 group">
                                    <div className="w-24 md:w-32 flex-shrink-0 text-slate-400 font-bold pt-1 text-sm md:text-base">{item.t}</div>
                                    <div className="flex-1 pb-8 border-l-2 border-slate-100 pl-8 relative group-last:border-transparent">
                                      <div className="absolute top-1 -left-[9px] w-4 h-4 rounded-full border-4 border-white bg-indigo-600 shadow-sm" />
                                      <h4 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                                      <p className="text-sm md:text-base text-slate-500 mt-2">{item.d}</p>
                                    </div>
                                  </div>
                                ))}
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
                                  <p className="mt-4 text-slate-600 text-sm line-clamp-3 italic">{speaker.bio || "Leading expert in scaling businesses and founder of Unshakable Brand."}</p>
                                </div>
                              ))
                            ) : (
                              <div className="group p-6 rounded-3xl bg-slate-50 hover:bg-indigo-50 transition-colors border-2 border-transparent hover:border-indigo-100 flex items-center gap-6">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-200 shadow-lg">
                                  <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=2574&auto=format&fit=crop" alt="Dr Toby Potter" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-2xl text-slate-900 uppercase tracking-tight">Dr. Toby Potter</h4>
                                  <p className="text-indigo-600 font-bold uppercase tracking-widest text-xs mt-1">Founder, Unshakable Brand</p>
                                  <div className="flex gap-3 mt-4">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer">
                                      <Share2 className="w-4 h-4" />
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer">
                                      <Heart className="w-4 h-4" />
                                    </div>
                                  </div>
                                </div>
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
                  <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-200 border-4 border-indigo-50 p-8 flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Tickets starting at</p>
                        <p className="text-4xl font-extrabold text-slate-900">{event.priceInr ? `₹${event.priceInr}` : 'FREE'}</p>
                      </div>
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Ticket className="w-8 h-8" strokeWidth={2.5} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span>Interactive Access Included</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span>Exclusive Masterclass Materials</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span>Replay Access for 48 Hours</span>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <Link href={`/events/${id}/register`}
                        className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-sm hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-[0.98] text-center block"
                      >
                        Reserve Your Spot Now
                      </Link>
                      <button className="w-full py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold text-sm hover:border-indigo-100 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                        <Share2 className="w-4 h-4" /> Share Event
                      </button>
                    </div>

                    <div className="bg-amber-50 rounded-2xl p-4 flex gap-3 items-center border border-amber-100">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <p className="text-xs font-bold text-amber-900 leading-tight">Limited capacity: {event.registrationCount > 0 ? (event.registrationCount + 12) : 48} spots remaining this session.</p>
                    </div>
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
                        <p className="font-bold text-lg">{event.organizerName || 'Dr. Toby Potter'}</p>
                        <p className="text-xs font-medium text-slate-400">{event.organizerEventsCount || 8} Hosted Events</p>
                      </div>
                    </div>
                    <button className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-colors font-bold text-sm">Follow Organizer</button>
                    <button className="w-full text-slate-500 hover:text-white mt-4 text-sm font-bold transition-colors">Contact Support</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Decoration */}
          <section className="py-24 max-w-7xl mx-auto px-4">
            <div className="bg-indigo-600 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
              <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] bg-indigo-400/20 blur-[100px] rounded-full" />
              <div className="relative z-10 space-y-8">
                <h2 className="text-4xl md:text-5xl font-black max-w-3xl mx-auto leading-tight">Ready to install the OS your business deserves?</h2>
                <p className="text-xl text-indigo-100 max-w-2xl mx-auto">Join Dr. Toby Potter and hundreds of other business owners on Jan 28.</p>
                <Link href={`/events/${id}/register`}
                  className="inline-flex items-center gap-3 px-10 py-5 bg-white text-indigo-600 rounded-full font-black uppercase tracking-widest text-sm hover:shadow-2xl hover:scale-105 transition-all active:scale-95"
                >
                  Register for Free <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Mobile Sticky Bar */}
      <AnimatePresence>
        {scrolled && (
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
                Register
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="bg-slate-50 py-20 border-t">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">E</div>
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
