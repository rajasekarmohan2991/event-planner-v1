"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function ManageTabs({ eventId }: { eventId: string }) {
  const pathname = usePathname()
  const base = `/events/${eventId}`

  const tabs = [
    { href: `${base}/info`, label: 'Event Info', short: 'Info' },
    { href: `${base}/team`, label: 'Team', short: 'Team' },
    { href: `${base}/partners`, label: '⚡ Quick Form', short: 'Quick' },
    { href: `${base}/sponsors`, label: 'Sponsors', short: 'Sponsors' },
    { href: `${base}/vendors`, label: 'Vendors', short: 'Vendors' },
    { href: `${base}/exhibitors`, label: 'Exhibitors', short: 'Exhibitors' },
  ]

  const activeIndex = tabs.findIndex(t => pathname === t.href)
  const safeActiveIndex = activeIndex === -1 ? 0 : activeIndex

  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b px-6 -mx-6 mb-8 transition-all shadow-sm">
      {/* Modern Tab Navigation */}
      <nav className="overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-max h-14 gap-1">
          {tabs.map((tab, index) => {
            const isActive = index === safeActiveIndex
            const isCompleted = index < safeActiveIndex

            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap rounded-md ${isActive
                  ? 'text-indigo-600'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                {/* Step Circle */}
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] border-2 transition-colors ${isActive
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : isCompleted
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-200 text-slate-400 group-hover:border-slate-300'
                  }`}>
                  {isCompleted ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>

                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.short}</span>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

