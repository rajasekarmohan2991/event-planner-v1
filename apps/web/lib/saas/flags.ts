import type { TenantPlan } from './tenant'

export type FeatureKey =
  | 'qr_checkin'
  | 'custom_fields'
  | 'email_templates'
  | 'analytics'
  | 'bulk_import'
  | 'api_access'

export const FEATURE_MATRIX: Record<TenantPlan, FeatureKey[]> = {
  free: ['analytics'],
  pro: ['qr_checkin','custom_fields','email_templates','analytics'],
  business: ['qr_checkin','custom_fields','email_templates','analytics','bulk_import','api_access'],
  enterprise: ['qr_checkin','custom_fields','email_templates','analytics','bulk_import','api_access'],
}

// Non-breaking: defaults to enabling everything if plan is unknown.
export function isFeatureEnabled(plan: TenantPlan | undefined, key: FeatureKey): boolean {
  if (!plan) return true
  const allowed = FEATURE_MATRIX[plan]
  if (!allowed) return true
  return allowed.includes(key)
}
