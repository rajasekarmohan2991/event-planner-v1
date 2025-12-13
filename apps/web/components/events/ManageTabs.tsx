"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ManageTabs({ eventId }: { eventId: string }) {
  const pathname = usePathname()
  const base = `/events/${eventId}`
  const vendorsHref = `/company/vendors?eventId=${encodeURIComponent(eventId)}`
  const tabs = [
    { href: `${base}/info`, label: 'Event Info' },
    { href: `${base}/speakers`, label: 'Speakers' },
    { href: `${base}/sessions`, label: 'Sessions' },
    { href: `${base}/team`, label: 'Team' },
    { href: `${base}/sponsors`, label: 'Sponsors' },
    { href: vendorsHref, label: 'Vendors' },
    { href: `${base}/exhibitor-registration`, label: 'Exhibitor Registration' },
    { href: `${base}/promote`, label: 'Promote' },
    { href: `${base}/engagement`, label: 'Engagement' },
  ]
  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <nav className="px-1 md:px-0">
        <div className="flex flex-wrap items-center gap-3 py-3">
          {tabs.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`relative text-sm px-3 py-1.5 rounded-md border transition-all duration-200 ${
                  active
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400/60 dark:bg-indigo-950/20 dark:text-indigo-300'
                    : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {label}
                <span className={`pointer-events-none absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full bg-indigo-500 transition-transform duration-200 ${active ? 'scale-x-100' : 'scale-x-0'} origin-left`} />
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
