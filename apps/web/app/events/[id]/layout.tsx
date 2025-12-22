import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import EventWorkspaceClient from './EventWorkspaceClient'
import { authOptions } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'

export default async function EventWorkspaceLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  // Optional: Add Server-Side Auth Check
  // if (!session) redirect('/auth/login')

  const eventId = params.id
  let eventExists = false
  let eventTitle = ''

  try {
    // Optimization: Direct DB Access (Raw SQL)
    // Ensures compatibility with BigInt IDs
    const eventIdBigInt = BigInt(eventId)
    const events = await prisma.$queryRaw`
      SELECT name FROM events WHERE id = ${eventIdBigInt} LIMIT 1
    ` as any[]

    if (events && events.length > 0) {
      eventExists = true
      eventTitle = events[0].name || ''
    }
  } catch (e) {
    console.error('Layout Fetch Error (Raw):', e)
    eventExists = false
  }

  return (
    <EventWorkspaceClient
      eventId={eventId}
      eventExists={eventExists}
      eventTitle={eventTitle}
    >
      {children}
    </EventWorkspaceClient>
  )
}
