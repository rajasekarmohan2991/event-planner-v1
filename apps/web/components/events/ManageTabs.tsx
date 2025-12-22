"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Check, ChevronRight } from 'lucide-react'

export default function ManageTabs({ eventId }: { eventId: string }) {
  const pathname = usePathname()
  const base = `/events/${eventId}`

  const tabs = [
    { href: `${base}/info`, label: 'Event Info' },
    { href: `${base}/speakers`, label: 'Speakers' },
    { href: `${base}/team`, label: 'Team' },
    { href: `${base}/sponsors`, label: 'Sponsors' },
    { href: `${base}/vendors`, label: 'Vendors' },
    { href: `${base}/exhibitor-registration`, label: 'Exhibitor Registration' },
    { href: `${base}/promote`, label: 'Promote' },
    { href: `${base}/engagement`, label: 'Engagement' },
  ]

  const activeIndex = tabs.findIndex(t => pathname === t.href)
  const safeActiveIndex = activeIndex === -1 ? 0 : activeIndex

  return (
    <div className="sticky top-16 z-20 bg-white/90 backdrop-blur-md border-b shadow-sm">
      <nav className="w-full overflow-x-auto no-scrollbar py-4 px-4 md:px-6">
        <div className="flex items-center min-w-max">
          {tabs.map((tab, index) => {
            const isActive = index === safeActiveIndex
            const isCompleted = index < safeActiveIndex
            const isLast = index === tabs.length - 1

            return (
              <div key={tab.href} className="flex items-center">
                <Link
                  href={tab.href}
                  className={`group flex items-center gap-2 pr-4 ${isLast ? 'pr-0' : ''}`}
                >
                  {/* Step Indicator */}
                  <div
                    className={`
                      relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300
                      ${isActive
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-md scale-110'
                        : isCompleted
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                          : 'border-slate-300 bg-white text-slate-500 group-hover:border-slate-400'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={`
                      whitespace-nowrap text-sm font-medium transition-colors duration-300
                      ${isActive
                        ? 'text-indigo-700'
                        : isCompleted
                          ? 'text-gray-900'
                          : 'text-gray-500 group-hover:text-gray-700'
                      }
                    `}
                  >
                    {tab.label}
                  </span>
                </Link>

                {/* Connector Line */}
                {!isLast && (
                  <div className="hidden sm:block w-8 h-[2px] mx-2 bg-gray-200">
                    <div
                      className={`h-full bg-indigo-600 transition-all duration-500 ease-in-out`}
                      style={{ width: isCompleted ? '100%' : '0%' }}
                    />
                  </div>
                )}

                {/* Mobile Connector (Arrow) */}
                {!isLast && (
                  <ChevronRight className="sm:hidden w-4 h-4 text-gray-300 mx-2" />
                )}
              </div>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

