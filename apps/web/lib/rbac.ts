import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function getSessionUser() {
  const session = (await getServerSession(authOptions as any)) as any
  return session?.user ?? null
}

export async function isAdmin() {
  const user = await getSessionUser()
  return !!user && user.role === 'ADMIN'
}

export async function getEventRole(eventId: string) {
  const user = await getSessionUser()
  if (!user) return null
  if (user.role === 'ADMIN') return 'OWNER'
  const assignment = await (prisma as any).eventRoleAssignment.findUnique({
    where: { eventId_userId: { eventId, userId: user.id as any } },
    select: { role: true },
  })
  if (assignment?.role) return assignment.role
  // Fallback: treat event creator as OWNER. Try common fields without strict schema coupling.
  try {
    const evt = await (prisma as any).event.findUnique({
      where: { id: eventId as any },
      select: { organizerId: true, createdBy: true, ownerId: true },
    })
    const uid = user.id as any
    if (evt && (evt.organizerId === uid || evt.createdBy === uid || evt.ownerId === uid)) {
      return 'OWNER'
    }
  } catch {}
  // Bootstrap: if the event has no role assignments yet, allow current user as OWNER to avoid 403s on fresh events
  try {
    const count = await (prisma as any).eventRoleAssignment.count({ where: { eventId } })
    if (count === 0) return 'OWNER'
  } catch {}
  return null
}

export async function requireEventRole(eventId: string, allowed: Array<'OWNER'|'ORGANIZER'|'STAFF'>) {
  if (await isAdmin()) return true
  const role = await getEventRole(eventId)
  if (!role) return false
  // Owner > Organizer > Staff > Viewer
  const score: Record<string, number> = { OWNER: 3, ORGANIZER: 2, STAFF: 1, VIEWER: 0 }
  const min = Math.min(...allowed.map(a => score[a]))
  return (score[role] ?? -1) >= min
}

export async function canManageEvent(eventId: string) {
  return requireEventRole(eventId, ['STAFF','ORGANIZER','OWNER'])
}
