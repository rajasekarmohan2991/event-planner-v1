import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export type TenantPlan = 'free' | 'pro' | 'business' | 'enterprise'
export type TenantContext = {
  orgId: string | null
  userId: string | null
  email: string | null
  role: string | null
  plan: TenantPlan
}

// Non-breaking: returns a permissive context even if not authenticated.
export async function getTenantContext(): Promise<TenantContext> {
  try {
    const session = await getServerSession(authOptions as any)
    const orgId = (session as any)?.orgId ?? null
    const userId = (session as any)?.user?.id ?? null
    const email = (session as any)?.user?.email ?? null
    const role = (session as any)?.role ?? null
    const plan: TenantPlan = (session as any)?.plan ?? 'free'
    return { orgId, userId, email, role, plan }
  } catch {
    return { orgId: null, userId: null, email: null, role: null, plan: 'free' }
  }
}

export function requireOrgId(ctx: TenantContext): string | null {
  // Non-breaking guard: return null instead of throwing.
  return ctx.orgId ?? null
}
