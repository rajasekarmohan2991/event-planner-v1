'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import EventList from '@/components/home/EventList'
import Sidebar from '@/components/home/Sidebar'

export const dynamic = 'force-dynamic'

export default function EventsPage() {
  const router = useRouter()
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      if (typeof window !== 'undefined') {
        const cb = encodeURIComponent(window.location.href)
        router.replace(`/auth/login?callbackUrl=${cb}`)
      }
    },
  })

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <div className="hidden md:block w-64 shrink-0"><Sidebar /></div>
      <main className="flex-1 p-4 md:p-6">
        <div className="mb-4">
          <h1 className="text-xl font-semibold">Your Events</h1>
        </div>
        <EventList />
      </main>
    </div>
  )
}
