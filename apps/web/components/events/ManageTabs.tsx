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
    { href: `${base}/speakers`, label: 'Speakers', short: 'Speakers' },
    { href: `${base}/team`, label: 'Team', short: 'Team' },
    { href: `${base}/sponsors`, label: 'Sponsors', short: 'Sponsors' },
    { href: `${base}/vendors`, label: 'Vendors', short: 'Vendors' },
    { href: `${base}/exhibitor-registration`, label: 'Exhibitor Registration', short: 'Exhibitors' },
    { href: `${base}/promote`, label: 'Promote', short: 'Promote' },
    { href: `${base}/engagement`, label: 'Engagement', short: 'Engage' },
  ]

  const activeIndex = tabs.findIndex(t => pathname === t.href)
  const safeActiveIndex = activeIndex === -1 ? 0 : activeIndex

  return (
    <div className="sticky top-16 z-20 bg-white border-b -mx-6 px-6 -mt-6 mb-6">
      {/* Compact Header with Event ID */}
      <div className="flex items-center justify-between py-2 border-b">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500">Event</span>
          <Badge variant="outline" className="font-mono text-xs">
            ID: {eventId}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Step {safeActiveIndex + 1} of {tabs.length}</span>
        </div>
      </div>

      {/* Modern Tab Navigation */}
      <nav className="overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-max py-3 gap-1">
          {tabs.map((tab, index) => {
            const isActive = index === safeActiveIndex
            const isCompleted = index < safeActiveIndex
            const isUpcoming = index > safeActiveIndex

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  group relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : isCompleted
                      ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {/* Step Number or Check */}
                <div
                  className={`
                    flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all
                    ${isActive
                      ? 'bg-white text-indigo-600'
                      : isCompleted
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Label - Show short on mobile, full on desktop */}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.short}</span>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

