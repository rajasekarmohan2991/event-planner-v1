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
    // Optimization: Fetch only necessary fields directly from DB
    // This removes the HTTP fetch trip and runs on server
    const event = await prisma.event.findUnique({
      where: { id: BigInt(eventId) },
      select: { name: true }
    })

    if (event) {
      eventExists = true
      eventTitle = event.name || ''
    }
  } catch (e) {
    console.error('Layout Fetch Error:', e)
    // If ID is invalid (e.g. malformed BigInt), treat as not found
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
