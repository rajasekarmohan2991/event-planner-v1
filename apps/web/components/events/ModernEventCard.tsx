import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Users, Edit, Trash2, Clock, Ticket, Heart } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'
import { getEventIcon } from '@/lib/event-icons'

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
        color: 'bg-gradient-to-r from-gray-400 to-gray-500',
        textColor: 'text-gray-700',
        bgColor: 'bg-gray-100',
        label: 'Ended',
        pulse: false
      }
    }

    switch (status) {
      case 'UPCOMING':
      case 'PUBLISHED':
        return {
          color: 'bg-gradient-to-r from-blue-400 to-cyan-400',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          label: 'Upcoming',
          pulse: true
        }
      case 'LIVE':
        return {
          color: 'bg-gradient-to-r from-green-500 to-emerald-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          label: 'Live',
          pulse: true
        }
      case 'DRAFT':
        return {
          color: 'bg-gradient-to-r from-gray-400 to-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          label: 'Draft',
          pulse: false
        }
      case 'COMPLETED':
        return {
          color: 'bg-gradient-to-r from-indigo-500 to-purple-500',
          textColor: 'text-indigo-700',
          bgColor: 'bg-indigo-50',
          label: 'Completed',
          pulse: false
        }
      case 'CANCELLED':
        return {
          color: 'bg-gradient-to-r from-red-500 to-rose-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          label: 'Cancelled',
          pulse: false
        }
      default:
        // Handle case where status is active but might be expired
        if (isExpired) {
          return {
            color: 'bg-gradient-to-r from-gray-400 to-gray-500',
            textColor: 'text-gray-700',
            bgColor: 'bg-gray-100',
            label: 'Ended',
            pulse: false
          }
        }
        return {
          color: 'bg-gradient-to-r from-indigo-500 to-purple-500',
          textColor: 'text-indigo-700',
          bgColor: 'bg-indigo-50',
          label: 'Active',
          pulse: false
        }
    }
  }

  const statusConfig = getStatusConfig(event.status)

  return (
    <div
      className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-indigo-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status Badge with Event Planning Context */}
      <div className="absolute top-3 left-3 z-10">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.textColor} shadow-sm`}>
          <div className="flex items-center gap-1.5">
            {statusConfig.pulse && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
            {statusConfig.label}
          </div>
        </div>
      </div>

      {/* Action Buttons - Slide in from right */}
      <div className={`absolute top-3 right-3 z-10 flex gap-2 transition-all duration-300 ${isHovered ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
        }`}>
        {onEdit && (
          <button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              onEdit(event.id)
            }}
            className="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-all shadow-md hover:scale-110"
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
            className="w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-red-600 hover:bg-red-50 transition-all shadow-md hover:scale-110"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Event Timeline Visualization */}
      <div
        className="relative h-40 bg-gradient-to-br from-slate-50 to-indigo-50 overflow-hidden"
      >
        {event.bannerUrl ? (
          <img
            src={event.bannerUrl}
            alt={event.name}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${isExpired ? 'grayscale' : ''}`}
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
                  <div className={`absolute inset-0 bg-gradient-to-br ${iconConfig.gradient} opacity-10`} />

                  {/* Central Event Icon */}
                  <div className={`relative w-20 h-20 ${iconConfig.bgColor} backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${isHovered ? 'scale-110 rotate-3' : 'scale-100'}`}>
                    <IconComponent className={`w-10 h-10 ${iconConfig.iconColor}`} />
                  </div>

                  {/* Decorative elements */}
                  {!isExpired && (
                    <>
                      <div className="absolute top-4 left-4 w-2 h-2 bg-white/40 rounded-full animate-pulse" />
                      <div className="absolute bottom-6 right-6 w-3 h-3 bg-white/30 rounded-full animate-pulse delay-150" />
                      <div className="absolute top-1/2 right-8 w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse delay-300" />
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Countdown/Time Indicator */}
        {event.startsAt && (
          <div className="absolute bottom-2 right-2">
            <div className={`text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm ${isExpired ? 'bg-gray-800/80' : 'bg-black/70'}`}>
              <Clock className="w-3 h-3 inline mr-1" />
              {isExpired ? 'Event Ended' : (new Date(event.startsAt) > new Date() ? 'Upcoming' : 'Started')}
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <div>
          <h3 className={`font-semibold text-lg text-gray-900 transition-colors duration-300 line-clamp-2 ${isExpired ? 'text-gray-500' : 'group-hover:text-indigo-600'}`}>
            {event.name || 'Untitled Event'}
          </h3>
        </div>

        {/* Event Details with staggered reveal */}
        <div className="space-y-2">
          {/* Date */}
          <div className={`flex items-center gap-2 text-gray-600 transition-all duration-300 ${isHovered ? 'translate-x-1' : 'translate-x-0'
            }`}>
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium">
              {formatDateRange(event.startsAt, event.endsAt)}
            </span>
          </div>

          {/* Location */}
          <div className={`flex items-center gap-2 text-gray-600 transition-all duration-300 delay-75 ${isHovered ? 'translate-x-1' : 'translate-x-0'
            }`}>
            <MapPin className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium">
              {event.city || 'Location TBD'}
            </span>
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
              {event.eventMode === 'VIRTUAL' ? '🌐 Virtual' :
                event.eventMode === 'HYBRID' ? '🔄 Hybrid' : '📍 In-Person'}
            </span>
          </div>

          {/* Registrations with growth animation */}
          <div className={`flex items-center gap-2 text-gray-600 transition-all duration-300 delay-150 ${isHovered ? 'translate-x-1' : 'translate-x-0'
            }`}>
            <Users className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">
              {event.registrationCount || 0} registered
            </span>
            {(event.registrationCount || 0) > 0 && !isExpired && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>

          {/* Tickets remaining */}
          <div className={`flex items-center gap-2 text-gray-600 transition-all duration-300 delay-200 ${isHovered ? 'translate-x-1' : 'translate-x-0'
            }`}>
            <Ticket className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium">
              {Math.max(0, (event.capacity || 0) - (event.registrationCount || 0))} tickets remaining
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {/* Price Tag */}
          <div className={`px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg transition-all duration-300 ${isHovered ? 'scale-105 shadow-md' : 'scale-100'
            }`}>
            <span className="text-sm font-bold text-amber-700">
              {formatPrice(event.priceInr)}
            </span>
          </div>

          <div className="flex gap-2">
            {/* I am interested Button */}
            <button
              onClick={handleInterested}
              disabled={isLoading || interested || isExpired}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 border ${isExpired ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' :
                interested
                  ? 'bg-pink-50 text-pink-600 border-pink-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-pink-300 hover:text-pink-600'
                }`}
            >
              <Heart className={`w-4 h-4 ${interested ? 'fill-current' : ''}`} />
              {interested ? 'Interested' : 'Interest'}
            </button>

            {/* Register Button for LIVE events */}
            {['LIVE', 'UPCOMING', 'PUBLISHED'].includes(event.status || '') && (
              isExpired ? (
                <button
                  disabled
                  className="px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-lg border border-red-200 cursor-not-allowed flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Ended
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/events/${event.id}/register`)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Register
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Status Progress Bar */}
      <div className={`h-1 ${statusConfig.color} transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-60'
        }`} />
    </div>
  )
}
