import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Users, Edit, Trash2, Clock, Ticket, Heart } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'

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

  const getStatusConfig = (status?: string) => {
    switch (status) {
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
          color: 'bg-gradient-to-r from-blue-500 to-indigo-500', 
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
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
      <div className={`absolute top-3 right-3 z-10 flex gap-2 transition-all duration-300 ${
        isHovered ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
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
        {onDelete && event.status !== 'LIVE' && (
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
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative">
            {/* Event Planning Timeline Animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Timeline dots representing event stages */}
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  event.status === 'DRAFT' ? 'bg-gray-400 animate-pulse' : 'bg-indigo-400'
                }`} />
                <div className={`w-1 h-8 transition-all duration-700 ${
                  ['LIVE', 'COMPLETED'].includes(event.status || '') ? 'bg-indigo-300' : 'bg-gray-200'
                }`} />
                <div className={`w-4 h-4 rounded-full transition-all duration-900 ${
                  event.status === 'LIVE' ? 'bg-green-500 animate-pulse shadow-lg shadow-green-200' : 
                  event.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
                <div className={`w-1 h-8 transition-all duration-1100 ${
                  event.status === 'COMPLETED' ? 'bg-blue-300' : 'bg-gray-200'
                }`} />
                <div className={`w-3 h-3 rounded-full transition-all duration-1300 ${
                  event.status === 'COMPLETED' ? 'bg-blue-400' : 'bg-gray-300'
                }`} />
              </div>
            </div>
            
            {/* Central Event Icon */}
            <div className={`w-16 h-16 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
              isHovered ? 'scale-110 rotate-3' : 'scale-100'
            }`}>
              <Calendar className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        )}

        {/* Countdown/Time Indicator */}
        {event.startsAt && (
          <div className="absolute bottom-2 right-2">
            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              <Clock className="w-3 h-3 inline mr-1" />
              {new Date(event.startsAt) > new Date() ? 'Upcoming' : 'Started'}
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-4">
        {/* Title */}
        <div>
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors duration-300 line-clamp-2">
            {event.name || 'Untitled Event'}
          </h3>
        </div>

        {/* Event Details with staggered reveal */}
        <div className="space-y-2">
          {/* Date */}
          <div className={`flex items-center gap-2 text-gray-600 transition-all duration-300 ${
            isHovered ? 'translate-x-1' : 'translate-x-0'
          }`}>
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-medium">
              {formatDateRange(event.startsAt, event.endsAt)}
            </span>
          </div>

          {/* Location */}
          <div className={`flex items-center gap-2 text-gray-600 transition-all duration-300 delay-75 ${
            isHovered ? 'translate-x-1' : 'translate-x-0'
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
          <div className={`flex items-center gap-2 text-gray-600 transition-all duration-300 delay-150 ${
            isHovered ? 'translate-x-1' : 'translate-x-0'
          }`}>
            <Users className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">
              {event.registrationCount || 0} registered
            </span>
            {(event.registrationCount || 0) > 0 && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>

          {/* Tickets remaining */}
          <div className={`flex items-center gap-2 text-gray-600 transition-all duration-300 delay-200 ${
            isHovered ? 'translate-x-1' : 'translate-x-0'
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
          <div className={`px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg transition-all duration-300 ${
            isHovered ? 'scale-105 shadow-md' : 'scale-100'
          }`}>
            <span className="text-sm font-bold text-amber-700">
              {formatPrice(event.priceInr)}
            </span>
          </div>

          <div className="flex gap-2">
            {/* I am interested Button */}
            <button
              onClick={handleInterested}
              disabled={isLoading || interested}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 border ${
                interested 
                  ? 'bg-pink-50 text-pink-600 border-pink-200' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-pink-300 hover:text-pink-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${interested ? 'fill-current' : ''}`} />
              {interested ? 'Interested' : 'Interest'}
            </button>

            {/* Register Button for LIVE events */}
            {event.status === 'LIVE' && (
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
            )}
          </div>
        </div>
      </div>

      {/* Status Progress Bar */}
      <div className={`h-1 ${statusConfig.color} transition-all duration-500 ${
        isHovered ? 'opacity-100' : 'opacity-60'
      }`} />
    </div>
  )
}
