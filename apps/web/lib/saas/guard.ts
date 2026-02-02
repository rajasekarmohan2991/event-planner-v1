import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getTenantContext } from './tenant'
import { isFeatureEnabled } from './flags'

// Optional guard utilities. Not wired globally; use inside route handlers when needed.
export async function requireFeature(req: NextRequest, feature: Parameters<typeof isFeatureEnabled>[1]) {
  const ctx = await getTenantContext()
  if (!isFeatureEnabled(ctx.plan, feature)) {
    return NextResponse.json({ message: 'Feature not available on current plan' }, { status: 402 })
  }
  return null
}

export async function requireAuthenticatedOrg(req: NextRequest) {
  const ctx = await getTenantContext()
  if (!ctx.orgId) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
  }
  return null
}
