"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from "next-auth/react"
import { useEffect } from 'react'

export default function EventManagePage({ params }: { params: { id: string } }) {
  const { status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const base = `/events/${params?.id}`
  const tabs = [
    { href: `${base}/info`, label: 'Event Info' },
    { href: `${base}/speakers`, label: 'Speakers' },

    { href: `${base}/team`, label: 'Team' },
    { href: `${base}/sponsors`, label: 'Sponsors' },
    { href: `${base}/promote`, label: 'Promote' },
    { href: `${base}/engagement`, label: 'Engagement' },
    { href: `${base}/library`, label: 'Event Library' },
    { href: `${base}/forms`, label: 'Custom Forms' },
    { href: `${base}/zones`, label: 'Zones' },
  ]
  // If on the manage root, auto-redirect to Event Info
  useEffect(() => {
    if (pathname === `${base}/manage`) {
      router.replace(`${base}/info`)
    }
  }, [pathname, base, router])
  if (status === 'loading') return <div className="p-6">Loading...</div>
  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <nav className="px-1 md:px-0">
          <div className="flex flex-wrap items-center gap-3 py-3">
            {tabs.map(({ href, label }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative text-sm px-3 py-1.5 rounded-md border motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 ${active
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400/60 dark:bg-indigo-950/20 dark:text-indigo-300'
                      : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  {label}
                  <span className={`pointer-events-none absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full bg-indigo-500 motion-safe:transition-transform motion-safe:duration-200 ${active ? 'scale-x-100' : 'scale-x-0'} hover:scale-x-100 origin-left`} />
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        Pick a module above to manage this event’s details.
      </div>
    </div>
  )
}
