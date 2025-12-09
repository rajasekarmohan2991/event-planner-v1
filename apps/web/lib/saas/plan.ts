import type { TenantPlan } from './tenant'

export type PlanLimits = {
  eventsPerOrg?: number
  attendeesPerEvent?: number
  emailsPerMonth?: number
  customFields?: number
}

export const PLAN_LIMITS: Record<TenantPlan, PlanLimits> = {
  free: { eventsPerOrg: 3, attendeesPerEvent: 200, emailsPerMonth: 500, customFields: 3 },
  pro: { eventsPerOrg: 50, attendeesPerEvent: 2000, emailsPerMonth: 10000, customFields: 10 },
  business: { eventsPerOrg: 200, attendeesPerEvent: 10000, emailsPerMonth: 100000, customFields: 25 },
  enterprise: { },
}

export function getPlanLimits(plan: TenantPlan | undefined): PlanLimits {
  return PLAN_LIMITS[(plan || 'free') as TenantPlan] || {}
}
