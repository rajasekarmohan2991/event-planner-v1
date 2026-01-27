"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { VirtualRegistrationForm } from "./forms"
import {
  Armchair,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  MapPin,
  ArrowLeft,
  ChevronRight,
  User,
  Ticket,
  Mail,
  Zap,
  Calendar
} from "lucide-react"
import { useLocationDetection } from "@/hooks/useLocationDetection"
import { motion, AnimatePresence } from "framer-motion"

type RegistrationType = "general" | "vip" | "virtual"

interface InviteData {
  valid: boolean
  email?: string
  inviteCode?: string
  inviteeName?: string
  category?: string
  organization?: string
  discountCode?: string
  error?: string
}

export default function RegisterPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { location, updateLocation } = useLocationDetection()
  const [type, setType] = useState<RegistrationType>("general")
  const [step, setStep] = useState<1 | 2>(1)
  const [hasSeats, setHasSeats] = useState(false)
  const [checkingSeats, setCheckingSeats] = useState(true)
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [eventData, setEventData] = useState<any>(null)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Fetch event data for summary
  useEffect(() => {
    setLoadingEvent(true)
    fetch(`/api/events/${params.id}/public`)
      .then(r => r.json())
      .then(data => setEventData(data))
      .catch(console.error)
      .finally(() => setLoadingEvent(false))
  }, [params.id])

  // Check if event has seats
  useEffect(() => {
    const checkSeats = async () => {
      try {
        const res = await fetch(`/api/events/${params.id}/seats/availability`)
        if (res.ok) {
          const data = await res.json()
          setHasSeats(data.totalSeats > 0 || !!data.floorPlan)
        }
      } catch (error) {
        setHasSeats(false)
      } finally {
        setCheckingSeats(false)
      }
    }
    checkSeats()
  }, [params.id])

  // Verification logic (omitted for brevity, assume similar to original)
  useEffect(() => {
    const inviteCode = searchParams?.get('invite')
    if (inviteCode) {
      setInviteLoading(true)
      fetch(`/api/events/${params.id}/invites/verify?code=${inviteCode}`)
        .then(r => r.json())
        .then(data => {
          if (data.valid) setInviteData(data)
          else setInviteError(data.error || 'Invalid invite code')
        })
        .finally(() => setInviteLoading(false))
    }
  }, [searchParams, params.id])

  // UI Components matching the provided image
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4 md:px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Checkout</h1>
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-medium bg-slate-50 px-4 py-2 rounded-full border">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Time left {formatTime(timeLeft)}</span>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:px-6">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Steps Navigation */}
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setStep(1)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${step === 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border text-slate-400'}`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>1</div>
                Tickets
              </button>
              <div className="w-8 h-px bg-slate-200" />
              <button
                onClick={() => setStep(2)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${step === 2 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border text-slate-400'}`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>2</div>
                Attendee Info
              </button>
            </div>

            {/* Error/Notice Messages */}
            {inviteError && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 items-center">
                <XCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm font-bold text-red-900">{inviteError}</p>
              </div>
            )}

            {inviteData?.valid && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex gap-3 items-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-sm font-bold text-green-900">Invite Code Verified! Welcome {inviteData.inviteeName}</p>
              </div>
            )}

            {/* Forms Container */}
            <div className="bg-white rounded-[2rem] border shadow-sm p-6 md:p-10">
              {step === 1 ? (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900">Select your ticket type</h2>
                    <p className="text-slate-500">Choose the best option for your attendance style.</p>
                  </div>

                  <div className="grid gap-4">
                    {[
                      { id: 'general', label: 'General Admission', desc: 'Standard event access', icon: Ticket, price: eventData?.priceInr || 0 },
                      { id: 'vip', label: 'VIP Pass', desc: 'Premium perks & seating', icon: Zap, price: (eventData?.priceInr || 0) * 3 },
                      { id: 'virtual', label: 'Virtual Attendee', desc: 'Remote access link', icon: MapPin, price: 0 }
                    ].map((item) => (
                      <label
                        key={item.id}
                        className={`group relative flex items-center gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer ${type === item.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-indigo-200'}`}
                        onClick={() => setType(item.id as RegistrationType)}
                      >
                        <div className={`p-4 rounded-xl transition-colors ${type === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100'}`}>
                          <item.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900">{item.label}</h3>
                          <p className="text-sm text-slate-500">{item.desc}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-black text-lg ${type === item.id ? 'text-indigo-600' : 'text-slate-900'}`}>{item.price > 0 ? `₹${item.price}` : 'Free'}</p>
                          <input type="radio" checked={type === item.id} readOnly className="sr-only" />
                        </div>
                        {type === item.id && (
                          <div className="absolute top-[-8px] right-[-8px] bg-indigo-600 text-white p-1 rounded-full border shadow-sm">
                            <CheckCircle className="w-3 h-3" />
                          </div>
                        )}
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    Continue to Info <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900">Attendee Information</h2>
                    <p className="text-slate-500">Tell us a bit about who is attending.</p>
                  </div>

                  {type === "general" && <GeneralRegistrationForm eventId={params.id} hasSeats={hasSeats} inviteData={inviteData} eventData={eventData} />}
                  {type === "vip" && <VipRegistrationForm eventId={params.id} hasSeats={hasSeats} inviteData={inviteData} eventData={eventData} />}
                  {type === "virtual" && <VirtualRegistrationForm eventId={params.id} inviteData={inviteData} />}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Summary (Right) */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-6">
            <div className="bg-white rounded-[2rem] border overflow-hidden shadow-sm">
              <div className="h-40 w-full relative">
                <img
                  src={eventData?.bannerUrl || 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=2070&auto=format&fit=crop'}
                  alt={eventData?.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white text-xs font-bold uppercase tracking-widest mb-1">{eventData?.category || 'Event'}</p>
                  <p className="text-white font-bold leading-tight line-clamp-2">{eventData?.name || 'Loading...'}</p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span>{eventData?.startsAt ? new Date(eventData.startsAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBA'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>5:30 am - 6:30 am</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <span>{eventData?.eventMode === 'VIRTUAL' ? 'Online' : (eventData?.venue || 'TBA')}</span>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Order Summary</h4>
                  <div className="flex justify-between items-center font-bold text-slate-700">
                    <span>1 x {type.toUpperCase()} Registration</span>
                    <span>{type === 'virtual' ? 'Free' : `₹${type === 'vip' ? (eventData?.priceInr || 0) * 3 : (eventData?.priceInr || 0)}`}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-400 font-medium">
                    <span>Processing Fee</span>
                    <span>₹0.00</span>
                  </div>
                </div>

                <div className="border-t pt-6 flex justify-between items-center">
                  <span className="text-xl font-bold text-slate-900">Total</span>
                  <span className="text-3xl font-black text-indigo-600">{type === 'virtual' ? '₹0.00' : `₹${type === 'vip' ? (eventData?.priceInr || 0) * 3 : (eventData?.priceInr || 0)}.00`}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 italic font-medium text-slate-600 text-sm leading-relaxed">
              "Your ticket will be delivered instantly via email once registration is confirmed. See you there!"
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Minimalist Form Components matching the design
function GeneralRegistrationForm({ eventId, hasSeats, inviteData, eventData }: any) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: inviteData?.email || "",
    phone: "",
    gender: "Male"
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)

    // Store data and redirect to seats if needed
    if (hasSeats) {
      localStorage.setItem(`registration:${eventId}:formData`, JSON.stringify({ ...formData, type: 'GENERAL', ticketPrice: eventData?.priceInr || 0 }))
      router.push(`/events/${eventId}/register-with-seats`)
      return
    }

    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'GENERAL', data: formData })
      })
      if (res.ok) {
        const data = await res.json()
        if ((eventData?.priceInr || 0) > 0) {
          router.push(`/events/${eventId}/register/payment?registrationId=${data.id}`)
        } else {
          router.push(`/events/${eventId}/register/success?id=${data.id}`)
        }
      }
    } catch (e) {
      alert("Submission failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="First Name" required value={formData.firstName} onChange={(v: string) => setFormData({ ...formData, firstName: v })} />
        <Input label="Last Name" required value={formData.lastName} onChange={(v: string) => setFormData({ ...formData, lastName: v })} />
      </div>
      <Input label="Email Address" type="email" required value={formData.email} onChange={(v: string) => setFormData({ ...formData, email: v })} />
      <Input label="Phone Number" type="tel" value={formData.phone} onChange={(v: string) => setFormData({ ...formData, phone: v })} />

      <div className="space-y-4 pt-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" required className="w-5 h-5 rounded border-slate-300 text-indigo-600 transition-all focus:ring-indigo-600" />
          <span className="text-sm text-slate-500 group-hover:text-slate-900 transition-colors">I agree to the <span className="text-indigo-600 underline">Terms of Service</span> and <span className="text-indigo-600 underline">Privacy Policy</span>.</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-slate-300 text-indigo-600 transition-all focus:ring-indigo-600" />
          <span className="text-sm text-slate-500 group-hover:text-slate-900 transition-colors">Keep me updated on more events and news from this organizer.</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
      >
        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Complete Registration'}
      </button>
    </form>
  )
}

function VipRegistrationForm({ eventId, hasSeats, inviteData, eventData }: any) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: inviteData?.email || "",
    phone: "",
    company: "",
    jobTitle: ""
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)

    const price = (eventData?.priceInr || 0) * 3

    if (hasSeats) {
      localStorage.setItem(`registration:${eventId}:formData`, JSON.stringify({ ...formData, type: 'VIP', ticketPrice: price }))
      router.push(`/events/${eventId}/register-with-seats?type=VIP`)
      return
    }

    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'VIP', data: formData })
      })
      if (res.ok) {
        const data = await res.json()
        if (price > 0) {
          router.push(`/events/${eventId}/register/payment?registrationId=${data.id}&type=VIP`)
        } else {
          router.push(`/events/${eventId}/register/success?id=${data.id}`)
        }
      }
    } catch (e) {
      alert("Submission failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="First Name" required value={formData.firstName} onChange={(v: string) => setFormData({ ...formData, firstName: v })} />
        <Input label="Last Name" required value={formData.lastName} onChange={(v: string) => setFormData({ ...formData, lastName: v })} />
      </div>
      <Input label="VIP Email Address" type="email" required value={formData.email} onChange={(v: string) => setFormData({ ...formData, email: v })} />
      <Input label="Mobile Phone" type="tel" value={formData.phone} onChange={(v: string) => setFormData({ ...formData, phone: v })} />
      <div className="grid md:grid-cols-2 gap-4">
        <Input label="Company Name" value={formData.company} onChange={(v: string) => setFormData({ ...formData, company: v })} />
        <Input label="Job Title" value={formData.jobTitle} onChange={(v: string) => setFormData({ ...formData, jobTitle: v })} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-5 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
      >
        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm VIP Spot'}
      </button>
    </form>
  )
}

function Input({ label, type = "text", required, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label} {required && '*'}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 focus:border-indigo-600 focus:ring-0 transition-all text-slate-900 font-bold placeholder:text-slate-300"
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </div>
  )
}
