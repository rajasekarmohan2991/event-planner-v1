import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Users, Edit, Trash2, Clock, Ticket, Heart } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'
import { getEventIcon } from '@/lib/event-icons'
import EventDetailsModal from './EventDetailsModal'

interface EventCardProps {
  event: {
    id: string | number
    name?: string
    status?: "DRAFT" | "LIVE" | "COMPLETED" | "CANCELLED" | "TRASHED" | string
    startsAt?: string
    endsAt?: string
    city?: string
    eventMode?: "IN_PERSON" | "VIRTUAL" | "HYBRID" | string
    priceInr?: number
    bannerUrl?: string
    category?: string
    registrationCount?: number
    capacity?: number
  }
  onEdit?: (id: string | number) => void
  onDelete?: (event: any) => void
}

export default function ModernEventCard({ event, onEdit, onDelete }: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [interested, setInterested] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()

  const handleInterested = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!session) {
      router.push(`/auth/login?callbackUrl=/events`)
      return
    }

    try {
      setIsLoading(true)
      const res = await fetch(`/api/events/${event.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'INTERESTED' })
      })

      if (!res.ok) throw new Error('Failed to update status')

      setInterested(true)
      toast({
        title: "Success",
        description: "Marked as interested! We'll keep you updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateRange = (start?: string, end?: string) => {
    try {
      if (!start || !end) return 'Date TBD'
      const s = new Date(start)
      const e = new Date(end)
      const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
      const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      const fmtNoYear = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      return sameMonth ? `${fmtNoYear(s)} - ${fmt(e)}` : `${fmt(s)} - ${fmt(e)}`
    } catch {
      return 'Date TBD'
    }
  }

  const formatPrice = (amount?: number) => {
    if (amount === undefined || amount === null || isNaN(amount) || amount <= 0) return 'Free'
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
    } catch {
      return `₹${Math.round(amount).toLocaleString('en-IN')}`
    }
  }

  // Determine if event is expired
  const isExpired = event.endsAt && new Date(event.endsAt) < new Date()

  const getStatusConfig = (status?: string) => {
    // Override status if expired, unless explicitly CANCELLED or TRASHED
    if (isExpired && status !== 'CANCELLED' && status !== 'TRASHED') {
      return {
        color: 'bg-gradient-to-r from-slate-400 to-slate-500',
        textColor: 'text-slate-700',
        bgColor: 'bg-slate-100',
        label: 'Ended',
        pulse: false
      }
    }

    switch (status) {
      case 'UPCOMING':
      case 'PUBLISHED':
        return {
          color: 'bg-gradient-to-r from-rose-400 to-pink-500',
          textColor: 'text-rose-700',
          bgColor: 'bg-rose-50',
          label: 'Upcoming',
          pulse: true
        }
      case 'LIVE':
        return {
          color: 'bg-gradient-to-r from-emerald-400 to-green-500',
          textColor: 'text-emerald-700',
          bgColor: 'bg-emerald-50',
          label: 'Live',
          pulse: true
        }
      case 'DRAFT':
        return {
          color: 'bg-gradient-to-r from-slate-400 to-slate-500',
          textColor: 'text-slate-700',
          bgColor: 'bg-slate-50',
          label: 'Draft',
          pulse: false
        }
      case 'COMPLETED':
        return {
          color: 'bg-gradient-to-r from-purple-400 to-indigo-500',
          textColor: 'text-purple-700',
          bgColor: 'bg-purple-50',
          label: 'Completed',
          pulse: false
        }
      case 'CANCELLED':
        return {
          color: 'bg-gradient-to-r from-rose-400 to-red-500',
          textColor: 'text-rose-700',
          bgColor: 'bg-rose-50',
          label: 'Cancelled',
          pulse: false
        }
      default:
        // Handle case where status is active but might be expired
        if (isExpired) {
          return {
            color: 'bg-gradient-to-r from-slate-400 to-slate-500',
            textColor: 'text-slate-700',
            bgColor: 'bg-slate-100',
            label: 'Ended',
            pulse: false
          }
        }
        return {
          color: 'bg-gradient-to-r from-rose-400 to-pink-500',
          textColor: 'text-rose-700',
          bgColor: 'bg-rose-50',
          label: 'Active',
          pulse: false
        }
    }
  }

  const statusConfig = getStatusConfig(event.status)

  return (
    <div
      className="group relative bg-white rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-rose-100/40 transition-all duration-500 overflow-hidden border border-slate-100 hover:border-rose-100 hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status Badge with Event Planning Context */}
      <div className="absolute top-4 left-4 z-10">
        <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusConfig.bgColor} ${statusConfig.textColor} shadow-sm backdrop-blur-md bg-opacity-90`}>
          <div className="flex items-center gap-2">
            {statusConfig.pulse && (
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            )}
            {statusConfig.label}
          </div>
        </div>
      </div>

      {/* Action Buttons - Slide in from right */}
      <div className={`absolute top-4 right-4 z-10 flex gap-2 transition-all duration-300 ${isHovered ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
        }`}>
        {onEdit && (
          <button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              onEdit(event.id)
            }}
            className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-rose-600 hover:bg-rose-50 transition-all shadow-lg hover:scale-110"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              onDelete(event)
            }}
            className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-lg hover:scale-110"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Event Timeline Visualization */}
      <div
        className="relative h-56 bg-gradient-to-br from-rose-50 to-purple-50 overflow-hidden"
      >
        {event.bannerUrl ? (
          <img
            src={event.bannerUrl}
            alt={event.name}
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isExpired ? 'grayscale' : ''}`}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center relative ${isExpired ? 'grayscale' : ''}`}>
            {/* AI-Generated Icon based on Event Category */}
            {(() => {
              const iconConfig = getEventIcon(event.category);
              const IconComponent = iconConfig.icon;

              return (
                <>
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${iconConfig.gradient} opacity-20`} />

                  {/* Central Event Icon */}
                  <div className={`relative w-24 h-24 bg-white/40 backdrop-blur-md rounded-[2rem] flex items-center justify-center shadow-xl transition-all duration-500 ${isHovered ? 'scale-110 -rotate-3' : 'scale-100'}`}>
                    <IconComponent className={`w-12 h-12 ${iconConfig.iconColor}`} />
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Countdown/Time Indicator */}
        {event.startsAt && (
          <div className="absolute bottom-4 right-4">
            <div className={`text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg ${isExpired ? 'bg-slate-800/90' : 'bg-slate-900/80'}`}>
              <Clock className="w-3 h-3 inline mr-1.5 -mt-0.5" />
              {isExpired ? 'Event Ended' : (new Date(event.startsAt) > new Date() ? 'Upcoming' : 'Started')}
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-5">
        {/* Title */}
        <div>
          <h3 className={`font-bold text-xl text-slate-900 transition-colors duration-300 line-clamp-2 leading-tight ${isExpired ? 'text-slate-500' : 'group-hover:text-rose-600'}`}>
            {event.name || 'Untitled Event'}
          </h3>
        </div>

        {/* Event Details with staggered reveal */}
        <div className="space-y-3">
          {/* Date */}
          <div className={`flex items-center gap-3 text-slate-500 transition-all duration-300 ${isHovered ? 'translate-x-1' : 'translate-x-0'
            }`}>
            <Calendar className="w-4 h-4 text-rose-400" />
            <span className="text-sm font-medium">
              {formatDateRange(event.startsAt, event.endsAt)}
            </span>
          </div>

          {/* Location */}
          <div className={`flex items-center gap-3 text-slate-500 transition-all duration-300 delay-75 ${isHovered ? 'translate-x-1' : 'translate-x-0'
            }`}>
            <MapPin className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium truncate max-w-[140px]">
              {event.city || 'Location TBD'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
              {event.eventMode === 'VIRTUAL' ? 'Online' :
                event.eventMode === 'HYBRID' ? 'Hybrid' : 'In-Person'}
            </span>
          </div>

          {/* Registrations with growth animation */}
          <div className={`flex items-center gap-3 text-slate-500 transition-all duration-300 delay-150 ${isHovered ? 'translate-x-1' : 'translate-x-0'
            }`}>
            <Users className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium">
              {event.registrationCount || 0} registered
            </span>
            {(event.registrationCount || 0) > 0 && !isExpired && (
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            )}
          </div>

          {/* Tickets remaining */}
          <div className={`flex items-center gap-3 text-slate-500 transition-all duration-300 delay-200 ${isHovered ? 'translate-x-1' : 'translate-x-0'
            }`}>
            <Ticket className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium">
              {Math.max(0, (event.capacity || 0) - (event.registrationCount || 0))} spots left
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-50">
          {/* Price Tag */}
          <div className={`px-4 py-2 bg-amber-50/50 border border-amber-100 rounded-xl transition-all duration-300 ${isHovered ? 'scale-105 shadow-sm' : 'scale-100'
            }`}>
            <span className="text-sm font-black text-amber-700">
              {formatPrice(event.priceInr)}
            </span>
          </div>

          <div className="flex gap-2">
            {/* I am interested Button */}
            <button
              onClick={handleInterested}
              disabled={isLoading || interested || isExpired}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${isExpired ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' :
                interested
                  ? 'bg-rose-50 text-rose-500 border-rose-200'
                  : 'bg-white text-slate-400 border-slate-200 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50'
                }`}
              title={interested ? 'Interested' : 'Mark as Interested'}
            >
              <Heart className={`w-5 h-5 ${interested ? 'fill-current' : ''}`} />
            </button>

            {/* Register Button for LIVE events */}
            {['LIVE', 'UPCOMING', 'PUBLISHED'].includes(event.status || '') && (
              isExpired ? (
                <button
                  disabled
                  className="px-4 py-2 bg-slate-100 text-slate-400 text-sm font-bold rounded-xl cursor-not-allowed flex items-center gap-2"
                >
                  Ended
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDetailsModal(true)
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-rose-200 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  Register
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Status Progress Bar */}
      <div className={`h-1.5 ${statusConfig.color} transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'
        }`} />

      {/* Event Details Modal */}
      <EventDetailsModal
        eventId={event.id}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </div>
  )
}
