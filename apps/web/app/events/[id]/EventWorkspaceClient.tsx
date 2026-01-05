'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutGrid, ClipboardList, Users, Building2, PencilRuler,
    MessageSquare, FileBarChart, CalendarCheck2, Settings as SettingsIcon,
    ChevronDown, Rocket, Calendar, Radio
} from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function EventWorkspaceClient({
    children,
    eventId,
    eventExists,
    eventTitle
}: {
    children: React.ReactNode;
    eventId: string;
    eventExists: boolean;
    eventTitle: string;
}) {
    const pathname = usePathname()
    const router = useRouter()
    const { data: sessionData } = useSession()
    const base = `/events/${eventId}`

    const [eventMode, setEventMode] = useState<string>('IN_PERSON')

    useEffect(() => {
        if (eventId) {
            fetch(`/api/events/${eventId}`)
                .then(res => res.json())
                .then(data => {
                    if (data?.eventMode) setEventMode(data.eventMode)
                })
                .catch(e => console.error(e))
        }
    }, [eventId])

    const isVirtual = eventMode === 'VIRTUAL'

    const items = [
        { href: `${base}`, label: 'Dashboard', icon: LayoutGrid },
        { href: `${base}/info`, label: 'Manage', icon: ClipboardList },
        { href: `${base}/registrations`, label: 'Registrations', icon: Users },
        // Only show Design for non-virtual events
        ...(!isVirtual ? [{ href: `${base}/design`, label: 'Design', icon: PencilRuler }] : []),
        { href: `${base}/sessions`, label: 'Sessions', icon: Calendar },
        { href: `${base}/communicate`, label: 'Communicate', icon: MessageSquare },
        { href: `${base}/reports`, label: 'Reports', icon: FileBarChart },
        { href: `${base}/event-day`, label: 'Event Day', icon: CalendarCheck2 },
        { href: `${base}/settings`, label: 'Settings', icon: SettingsIcon },
    ]

    const regBase = `${base}/registrations`
    const regSetup: { label: string; href: string }[] = [
        { label: 'Ticket Class', href: `${regBase}/ticket-class` },
        { label: 'Payments', href: `${regBase}/payments` },
        { label: 'Promo Codes', href: `${regBase}/promo-codes` },
    ]
    const regOverview: { label: string; href: string }[] = [
        { label: 'Sales Summary', href: `${regBase}/sales-summary` },
        { label: 'Registration Approval', href: `${regBase}/approvals` },
        { label: 'Registration', href: `${regBase}/list` },
    ]
    const isOnRegistrations = pathname?.startsWith(regBase)
    const [regOpen, setRegOpen] = useState<boolean>(!!isOnRegistrations)

    // Reports submenu
    const reportsBase = `${base}/reports`
    const reportsItems: { label: string; href: string }[] = [
        { label: 'RSVP', href: `${reportsBase}/rsvp` },
    ]
    const isOnReports = pathname?.startsWith(reportsBase)
    const [reportsOpen, setReportsOpen] = useState<boolean>(!!isOnReports)

    // Event Day submenu
    const eventDayBase = `${base}/event-day`
    const eventDayItems: { label: string; href: string }[] = [
        { label: 'Check In', href: `${eventDayBase}/check-in` },
    ]
    const isOnEventDay = pathname?.startsWith(eventDayBase)
    const [eventOpen, setEventOpen] = useState<boolean>(!!isOnEventDay)

    // Sessions submenu
    const sessionsBase = `${base}/sessions`
    const isOnSessions = pathname?.startsWith(sessionsBase)
    const [sessionsOpen, setSessionsOpen] = useState<boolean>(!!isOnSessions)

    if (!eventExists) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
                <div className="max-w-md text-center space-y-3">
                    <div className="text-2xl font-semibold">Event not found</div>
                    <p className="text-sm text-muted-foreground">This event was permanently deleted or does not exist. You can return to your events list.</p>
                    <a href="/" className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600/90">Go to Events</a>
                </div>
            </div>
        )
    }

    // Check if user is on registration pages - hide sidebar for regular users
    const isOnRegisterPage = pathname?.includes('/register') || pathname?.includes('/exhibitor-registration/register')
    const userRole = (sessionData as any)?.user?.role
    const isRegularUser = !userRole || userRole === 'USER'
    const shouldHideSidebar = isOnRegisterPage && isRegularUser

    // If regular user on registration page, show only content without sidebar
    if (shouldHideSidebar) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)]">
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        )
    }

    return (
        <div className="flex min-h-[calc(100vh-4rem)]">
            {/* Left sidebar */}
            <aside className="w-52 border-r bg-slate-50/70 dark:bg-slate-950/30 flex flex-col sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
                {/* Event Title in Sidebar */}
                <div className="p-3 border-b">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">EVENT</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{eventTitle || 'Event'}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">ID: {eventId}</div>
                </div>

                {/* Publish Button */}
                <div className="p-3 border-b">
                    <Link
                        href={`${base}/publish`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
                    >
                        <Rocket className="h-4 w-4" />
                        Publish Event
                    </Link>
                </div>

                <nav className="p-3 space-y-1">
                    {items.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href
                        if (href === regBase) {
                            return (
                                <div key={href} className="space-y-1">
                                    <div
                                        className={`w-full group flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${isOnRegistrations || regOpen
                                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300'
                                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => router.push(regBase)}
                                            className="inline-flex items-center gap-2 flex-1 text-left"
                                            title="Open Registrations"
                                        >
                                            <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                                            <span className="truncate">{label}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setRegOpen(v => !v) }}
                                            className="shrink-0 rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            aria-label="Toggle registrations menu"
                                            title="Toggle submenu"
                                        >
                                            <ChevronDown className={`h-4 w-4 transition-transform ${regOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                    {regOpen && (
                                        <div className="ml-6 space-y-3">
                                            <div>
                                                <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Setup</div>
                                                <div className="space-y-1">
                                                    {regSetup.map(i => (
                                                        <Link
                                                            key={i.href}
                                                            href={i.href}
                                                            className={`block rounded-md px-3 py-1.5 text-[13px] ${pathname === i.href ? 'bg-slate-100 text-indigo-700 dark:bg-slate-800 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                                        >
                                                            {i.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Overview</div>
                                                <div className="space-y-1">
                                                    {regOverview.map(i => (
                                                        <Link
                                                            key={i.href}
                                                            href={i.href}
                                                            className={`block rounded-md px-3 py-1.5 text-[13px] ${pathname === i.href ? 'bg-slate-100 text-indigo-700 dark:bg-slate-800 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                                        >
                                                            {i.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        }
                        if (href === reportsBase) {
                            return (
                                <div key={href} className="space-y-1">
                                    <div
                                        className={`w-full group flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${isOnReports || reportsOpen
                                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300'
                                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => router.push(reportsBase)}
                                            className="inline-flex items-center gap-2 flex-1 text-left"
                                            title="Open Reports"
                                        >
                                            <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                                            <span className="truncate">Reports</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setReportsOpen(v => !v) }}
                                            className="shrink-0 rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            aria-label="Toggle reports menu"
                                            title="Toggle submenu"
                                        >
                                            <ChevronDown className={`h-4 w-4 transition-transform ${reportsOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                    {reportsOpen && (
                                        <div className="ml-6 space-y-1">
                                            {reportsItems.map(i => (
                                                <Link
                                                    key={i.href}
                                                    href={i.href}
                                                    className={`block rounded-md px-3 py-1.5 text-[13px] ${pathname === i.href ? 'bg-slate-100 text-indigo-700 dark:bg-slate-800 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                                >
                                                    {i.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        }
                        if (href === sessionsBase) {
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${isOnSessions
                                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300'
                                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                                    <span className="truncate transition-colors">{label}</span>
                                </Link>
                            )
                        }
                        if (href === eventDayBase) {
                            return (
                                <div key={href} className="space-y-1">
                                    <div
                                        className={`w-full group flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${isOnEventDay || eventOpen
                                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300'
                                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => router.push(eventDayBase)}
                                            className="inline-flex items-center gap-2 flex-1 text-left"
                                            title="Open Event Day"
                                        >
                                            <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                                            <span className="truncate">Event Day</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setEventOpen(v => !v) }}
                                            className="shrink-0 rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                                            aria-label="Toggle event day menu"
                                            title="Toggle submenu"
                                        >
                                            <ChevronDown className={`h-4 w-4 transition-transform ${eventOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                    {eventOpen && (
                                        <div className="ml-6 space-y-1">
                                            {eventDayItems.map(i => (
                                                <Link
                                                    key={i.href}
                                                    href={i.href}
                                                    className={`block rounded-md px-3 py-1.5 text-[13px] ${pathname === i.href ? 'bg-slate-100 text-indigo-700 dark:bg-slate-800 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                                >
                                                    {i.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        }
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${active
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300'
                                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                                <span className="truncate transition-colors">{label}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Sidebar profile + sign out */}
                <div className="mt-auto p-3">
                    <div className="border rounded-lg p-3 bg-white/70 dark:bg-slate-900/40">
                        <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-2">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" /> Profile
                        </div>
                        {sessionData?.user ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={sessionData.user.image || ''} alt={sessionData.user.name || sessionData.user.email || ''} />
                                        <AvatarFallback>
                                            {(sessionData.user.name || sessionData.user.email || 'U')
                                                .split(' ')
                                                .map(n => n[0])
                                                .join('')
                                                .toUpperCase()
                                                .slice(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                            {sessionData.user.name || sessionData.user.email}
                                        </div>
                                        <div className="text-xs text-slate-500 truncate">{sessionData.user.email}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/auth/login' })}
                                    className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors border border-rose-200/60"
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-600 dark:text-slate-300">Not signed in</div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main content - Added top padding to prevent sticky overlap */}
            <section className="flex-1 px-6 pb-6 pt-4 overflow-x-hidden">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </section>
        </div>
    )
}
