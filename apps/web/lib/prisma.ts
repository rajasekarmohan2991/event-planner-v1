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
    // Disable prepared statements in pooled environments
    if (!u.searchParams.has('pgbouncer')) u.searchParams.set('pgbouncer', 'true')
    if (!u.searchParams.has('connection_limit')) u.searchParams.set('connection_limit', '10')
    // Force SSL in production if not explicitly set
    if (process.env.NODE_ENV === 'production' && !u.searchParams.has('sslmode')) {
      u.searchParams.set('sslmode', 'require')
    }
    return u.toString()
  } catch {
    // If URL parsing fails, fall back to raw
    return raw
  }
}

const databaseUrl = buildSafeDatabaseUrl()

const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
  datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
})

// Apply tenant middleware for automatic tenant isolation
prisma.$use(createTenantMiddleware())

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export default prisma
