'use client'

import { useEffect, useState } from 'react'
import { Tag, Percent, IndianRupee } from 'lucide-react'

type PromoCode = {
  id: string
  code: string
  discountType: 'PERCENT' | 'FIXED'
  discountValue: number
  usageCount: number
  maxUses: number | null
}

type PromoCodeBadgeProps = {
  eventId: string
  className?: string
}

export default function PromoCodeBadge({ eventId, className = '' }: PromoCodeBadgeProps) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPromoCodes()
  }, [eventId])

  const loadPromoCodes = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/promo-codes/active`, {
        cache: 'no-store'
      })
      
      if (res.ok) {
        const data = await res.json()
        setPromoCodes(data.promoCodes || [])
      }
    } catch (error) {
      console.error('Error loading promo codes:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-full h-6 w-20 ${className}`} />
    )
  }

  if (promoCodes.length === 0) {
    return null
  }

  // Show the best promo code (highest discount)
  const bestPromo = promoCodes[0]

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {promoCodes.length > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-sm">
          <Tag className="w-3 h-3" />
          <span>{bestPromo.code}</span>
          <span className="flex items-center">
            {bestPromo.discountType === 'PERCENT' ? (
              <>
                <Percent className="w-2.5 h-2.5" />
                {bestPromo.discountValue}
              </>
            ) : (
              <>
                <IndianRupee className="w-2.5 h-2.5" />
                {bestPromo.discountValue}
              </>
            )}
          </span>
          {promoCodes.length > 1 && (
            <span className="text-green-100">+{promoCodes.length - 1}</span>
          )}
        </div>
      )}
    </div>
  )
}

// Component to show all promo codes for an event
export function PromoCodesList({ eventId }: { eventId: string }) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPromoCodes()
  }, [eventId])

  const loadPromoCodes = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/promo-codes/active`, {
        cache: 'no-store'
      })
      
      if (res.ok) {
        const data = await res.json()
        setPromoCodes(data.promoCodes || [])
      }
    } catch (error) {
      console.error('Error loading promo codes:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-12 w-full" />
        ))}
      </div>
    )
  }

  if (promoCodes.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        No active promo codes available
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
        <Tag className="w-4 h-4 text-green-600" />
        Available Discounts
      </h4>
      <div className="space-y-2">
        {promoCodes.map((promo) => (
          <div key={promo.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
                {promo.code}
              </div>
              <div className="text-sm">
                <span className="font-semibold text-green-700">
                  {promo.discountType === 'PERCENT' ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} OFF`}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              {promo.maxUses && (
                <span>{promo.maxUses - promo.usageCount} left</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
