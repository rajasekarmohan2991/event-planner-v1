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


  // Public routes (public page, registration) should not be blocked by auth
  // Auth checks for dashboard are now handled in EventWorkspaceClient or specific page logic


  const eventId = params.id
  let eventExists = false
  let eventTitle = ''
  let canManage = false
  let isReadOnly = false

  try {
    const eventIdBigInt = BigInt(eventId)
    const userRole = (session?.user as any)?.role
    const userTenantId = (session?.user as any)?.tenantId || (session?.user as any)?.currentTenantId

    // Fetch event with tenant info
    const events = await prisma.$queryRaw`
      SELECT 
        e.id::text,
        e.name,
        e.tenant_id::text as "tenantId"
      FROM events e
      WHERE e.id = ${eventIdBigInt}
      LIMIT 1
    ` as any[]

    if (events && events.length > 0) {
      eventExists = true
      eventTitle = events[0].name || ''
      const eventTenantId = events[0].tenantId

      // Permission logic:
      // 1. SUPER_ADMIN can VIEW all events but can only MANAGE events from their own tenant
      // 2. ADMIN/EVENT_MANAGER can only manage events from their tenant
      // 3. STAFF can only view events from their tenant

      if (userRole === 'SUPER_ADMIN') {
        // Super admin can view all events
        if (eventTenantId === userTenantId) {
          // Can manage events from their own tenant
          canManage = true
          isReadOnly = false
        } else {
          // Can only view events from other tenants
          canManage = false
          isReadOnly = true
        }
      } else if (userRole === 'ADMIN' || userRole === 'EVENT_MANAGER') {
        // Regular admins can only manage events from their tenant
        if (eventTenantId === userTenantId) {
          canManage = true
          isReadOnly = false
        } else {
          // No access to other tenants' events
          return notFound()
        }
      } else {
        // Staff and other roles - read only for their tenant
        if (eventTenantId === userTenantId) {
          canManage = false
          isReadOnly = true
        } else {
          return notFound()
        }
      }
    }
  } catch (e) {
    console.error('Layout Fetch Error:', e)
    eventExists = false
  }

  return (
    <EventWorkspaceClient
      eventId={eventId}
      eventExists={eventExists}
      eventTitle={eventTitle}
      canManage={canManage}
      isReadOnly={isReadOnly}
    >
      {children}
    </EventWorkspaceClient>
  )
}
