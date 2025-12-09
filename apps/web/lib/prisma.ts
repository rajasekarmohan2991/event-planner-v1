import { PrismaClient } from '@prisma/client'
import { createTenantMiddleware } from './prisma-tenant-middleware'

// Re-export types for convenience
export * from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn']
})

// Apply tenant middleware for automatic tenant isolation
prisma.$use(createTenantMiddleware())

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export default prisma
