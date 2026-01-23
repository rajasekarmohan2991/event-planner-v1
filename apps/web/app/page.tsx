'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import dynamicImport from 'next/dynamic'
import {
  Calendar,
  MapPin,
  Users,
  Filter,
  List,
  Search,
  MoreHorizontal,
  Sparkles,
  Home,
  Settings,
  UserCircle,
  Plus
} from 'lucide-react'
import EventList from '@/components/home/EventList'
import Sidebar from '@/components/home/Sidebar'
const LottieAnimation = dynamicImport(() => import('@/components/ui/LottieAnimation'), { ssr: false })

export default function HomePage() {
  // Always show landing page - authenticated users should go to /dashboard
  return (
    <main className="relative overflow-hidden min-h-[calc(100vh-4rem)] bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-300/30 to-fuchsia-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-gradient-to-br from-sky-300/30 to-purple-300/30 blur-3xl" />

      <section className="relative mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-slate-700 bg-white shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Plan events smarter
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600 bg-clip-text text-transparent">
                All-in-one event planning
              </span>
              <br />
              <span className="text-slate-800">Ticketing and <span className="whitespace-nowrap">check-in.</span></span>
            </h1>
            <p className="text-slate-600 text-base md:text-lg">
              Create beautiful events, sell tickets, track RSVPs, and manage check-ins in one modern dashboard.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-3 text-white text-sm font-medium shadow-sm hover:shadow transition-shadow">
                <Plus className="h-4 w-4" />
                Create an account
              </Link>
              <Link href="/auth/login" className="inline-flex items-center gap-2 rounded-md border px-5 py-3 bg-white text-sm font-medium hover:bg-slate-50">
                Sign in
              </Link>
            </div>
            <div className="flex items-center gap-6 pt-4 text-sm text-slate-600">
              <div className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-slate-500" /> Guest registration</div>
              <div className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-500" /> Ticketing & RSVP</div>
              <div className="inline-flex items-center gap-2"><Home className="h-4 w-4 text-slate-500" /> Event microsites</div>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl p-4 shadow-xl ring-1 ring-slate-200/50 bg-white/20 backdrop-blur-md">
              <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br from-fuchsia-300/30 to-indigo-300/30 blur-2xl" />
              <div className="absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-gradient-to-br from-sky-300/30 to-purple-300/30 blur-2xl" />
              <LottieAnimation
                src="https://assets9.lottiefiles.com/packages/lf20_j1adxtyb.json"
                className="relative h-80 w-full"
                fallback={
                  <div className="h-80 w-full grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-4 animate-pulse bg-gradient-to-b from-white/80 to-slate-50/80">
                      <div className="text-xs text-slate-600">Plan Event</div>
                      <div className="mt-2 h-6 w-24 bg-slate-200 rounded" />
                    </div>
                    <div className="rounded-lg border p-4 animate-pulse bg-gradient-to-b from-white/80 to-slate-50/80">
                      <div className="text-xs text-slate-600">Create Tickets</div>
                      <div className="mt-2 h-6 w-28 bg-slate-200 rounded" />
                    </div>
                    <div className="col-span-2 rounded-lg border p-4 animate-pulse bg-gradient-to-b from-white/80 to-slate-50/80">
                      <div className="text-xs text-slate-600">Go Live</div>
                      <div className="mt-2 h-6 w-20 bg-slate-200 rounded" />
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-16 md:pb-24">
        <div className="grid md:grid-cols-3 gap-5">
          <div className="rounded-lg border bg-white p-5 hover:shadow-sm transition-shadow">
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-indigo-50 text-indigo-700 mb-3"><Users className="h-4 w-4" /></div>
            <div className="font-medium mb-1">Registrations & RSVPs</div>
            <div className="text-sm text-slate-600">Custom forms, capacity, waitlist, and QR-code check-in.</div>
          </div>
          <div className="rounded-lg border bg-white p-5 hover:shadow-sm transition-shadow">
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-indigo-50 text-indigo-700 mb-3"><Calendar className="h-4 w-4" /></div>
            <div className="font-medium mb-1">Ticketing & Payments</div>
            <div className="text-sm text-slate-600">Free/paid tickets, promo codes, refunds, and sales analytics.</div>
          </div>
          <div className="rounded-lg border bg-white p-5 hover:shadow-sm transition-shadow">
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-indigo-50 text-indigo-700 mb-3"><Sparkles className="h-4 w-4" /></div>
            <div className="font-medium mb-1">Beautiful Microsites</div>
            <div className="text-sm text-slate-600">Share event pages with theme options and mobile-friendly design.</div>
          </div>
        </div>
      </section>
    </main>
  )
}
