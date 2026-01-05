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
  
  // Convert eventId to BigInt for database queries
  let eventIdBigInt: bigint
  try {
    eventIdBigInt = BigInt(eventId)
  } catch {
    console.error('Invalid eventId for role check:', eventId)
    return null
  }

  // Use raw SQL for reliability with BigInt
  try {
    const assignments = await prisma.$queryRaw`
      SELECT role FROM "EventRoleAssignment" 
      WHERE "eventId" = ${eventIdBigInt} AND "userId" = ${BigInt(user.id)}
      LIMIT 1
    ` as any[]
    if (assignments.length > 0) return assignments[0].role
  } catch (e) {
    console.warn('EventRoleAssignment query failed:', e)
  }

  // Fallback: treat event creator as OWNER
  try {
    const events = await prisma.$queryRaw`
      SELECT "organizerId", "createdBy", "ownerId" FROM events 
      WHERE id = ${eventIdBigInt}
      LIMIT 1
    ` as any[]
    if (events.length > 0) {
      const evt = events[0]
      const uid = BigInt(user.id)
      if (evt.organizerId === uid || evt.createdBy === uid || evt.ownerId === uid) {
        return 'OWNER'
      }
    }
  } catch {}

  // Bootstrap: if the event has no role assignments yet, allow current user as OWNER
  try {
    const counts = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "EventRoleAssignment" WHERE "eventId" = ${eventIdBigInt}
    ` as any[]
    if (counts.length > 0 && Number(counts[0].count) === 0) return 'OWNER'
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
