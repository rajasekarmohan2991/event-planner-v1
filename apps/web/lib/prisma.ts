import { PrismaClient } from '@prisma/client'
import { createTenantMiddleware } from './prisma-tenant-middleware'

// Re-export types for convenience
export * from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Build a DSN that is safe behind PgBouncer/transaction pooling by disabling prepared statements
function buildSafeDatabaseUrl() {
  const raw = process.env.DATABASE_URL || ''
  if (!raw) return raw
  try {
    const u = new URL(raw)
    // Disable prepared statements in pooled environments (Supabase uses PgBouncer)
    if (!u.searchParams.has('pgbouncer')) u.searchParams.set('pgbouncer', 'true')
    // Reduce connection limit for serverless to prevent pool exhaustion
    if (!u.searchParams.has('connection_limit')) u.searchParams.set('connection_limit', '3')
    // Add connection timeout
    if (!u.searchParams.has('connect_timeout')) u.searchParams.set('connect_timeout', '10')
    // Force SSL in production if not explicitly set, but skip for localhost/IPs
    if (process.env.NODE_ENV === 'production' && !u.searchParams.has('sslmode')) {
      if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1' && !u.hostname.startsWith('192.168.')) {
        u.searchParams.set('sslmode', 'require')
      }
    }
    return u.toString()
  } catch {
    // If URL parsing fails, fall back to raw
    return raw
  }
}

const databaseUrl = buildSafeDatabaseUrl()

const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
  datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
})

// Don't eagerly connect in serverless - let connections happen lazily on first query
// This prevents connection pool exhaustion during cold starts

// Add BigInt serialization support for JSON.stringify
if (!(BigInt.prototype as any).toJSON) {
  ; (BigInt.prototype as any).toJSON = function () {
    return this.toString()
  }
}

/**
 * Safely serialize data for JSON responses, handling BigInts and Prisma Decimals.
 */
export function safeJson(data: any) {
  return JSON.parse(JSON.stringify(data))
}

// Apply tenant middleware for automatic tenant isolation
prisma.$use(createTenantMiddleware())

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

// Helper to ensure connection before critical operations
export async function ensureConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}

export default prisma
