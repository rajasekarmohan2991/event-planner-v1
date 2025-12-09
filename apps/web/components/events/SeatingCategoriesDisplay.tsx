"use client"

import { Users } from 'lucide-react'

interface SeatingCategoriesProps {
  vipSeats: number
  premiumSeats: number
  generalSeats: number
  className?: string
}

export default function SeatingCategoriesDisplay({
  vipSeats,
  premiumSeats,
  generalSeats,
  className = ''
}: SeatingCategoriesProps) {
  return (
    <div className={`bg-white p-6 rounded-lg border ${className}`}>
      <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
        <Users className="w-5 h-5" />
        Seating Categories (VIP/Premium/General)
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* VIP Seats */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-lg border-2 border-yellow-300 hover:shadow-lg transition-shadow">
          <div className="flex flex-col items-center text-center">
            <span className="text-2xl mb-1">⭐</span>
            <h4 className="text-xs font-bold text-yellow-700 mb-2 whitespace-nowrap">VIP Seats</h4>
            <div className="w-full bg-white rounded-md border-2 border-yellow-400 p-2 min-h-[60px] flex items-center justify-center">
              <span className="text-2xl font-bold text-yellow-700">{vipSeats}</span>
            </div>
          </div>
        </div>

        {/* Premium Seats */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border-2 border-blue-300 hover:shadow-lg transition-shadow">
          <div className="flex flex-col items-center text-center">
            <span className="text-2xl mb-1">💎</span>
            <h4 className="text-xs font-bold text-blue-700 mb-2 whitespace-nowrap">Premium Seats</h4>
            <div className="w-full bg-white rounded-md border-2 border-blue-400 p-2 min-h-[60px] flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-700">{premiumSeats}</span>
            </div>
          </div>
        </div>

        {/* General Seats */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border-2 border-gray-300 hover:shadow-lg transition-shadow">
          <div className="flex flex-col items-center text-center">
            <span className="text-2xl mb-1">🪑</span>
            <h4 className="text-xs font-bold text-gray-700 mb-2 whitespace-nowrap">General Seats</h4>
            <div className="w-full bg-white rounded-md border-2 border-gray-400 p-2 min-h-[60px] flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-700">{generalSeats}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
