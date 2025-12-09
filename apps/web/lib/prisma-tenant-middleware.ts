import { Prisma } from '@prisma/client'
import { headers } from 'next/headers'

// Models that have tenantId field (Prisma model names, lowercased)
const TENANT_MODELS = [
  'event',
  'order',
  'ticket',
  'attendee',
  'eventroleassignment',
  'rsvp',
  'rsvpsettings',
  'rsvpguest',
  'floorplan',
  'eventbanner',
  'activity',
  'lookupgroup',
  'lookupoption',
  'exhibitor',
  'booth',
  'boothasset',
  'registration',
  'registrationdraft',
  'offlinequeue',
  'schedulednotification',
  'notificationdelivery',
  'emailcampaign',
  'feedpost'
]

function getTenantIdFromHeaders(): string {
  try {
    const headersList = headers()
    const tenantId = headersList.get('x-tenant-id') || process.env.DEFAULT_TENANT_ID || 'default-tenant'
    
    // Validate tenant ID
    if (!tenantId || tenantId === 'null' || tenantId === 'undefined' || tenantId.trim() === '') {
      throw new Error('❌ Tenant ID missing or invalid')
    }
    
    return tenantId
  } catch (error) {
    // In case of error, use default but log warning
    const defaultTenant = process.env.DEFAULT_TENANT_ID || 'default-tenant'
    console.warn('⚠️ Tenant ID validation failed, using default:', defaultTenant)
    return defaultTenant
  }
}

function shouldApplyTenantFilter(model: string): boolean {
  return TENANT_MODELS.includes(model.toLowerCase())
}

export function createTenantMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    const model = params.model?.toLowerCase()
    
    // Skip if no model or model doesn't have tenant_id
    if (!model || !shouldApplyTenantFilter(model)) {
      return next(params)
    }

    const tenantId = getTenantIdFromHeaders()

    // Handle READ operations (findMany, findFirst, findUnique, count, aggregate, groupBy)
    if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate', 'groupBy'].includes(params.action)) {
      params.args = params.args || {}
      params.args.where = params.args.where || {}
      
      // Add tenant filter to where clause (only if not already present)
      if (typeof params.args.where.tenantId === 'undefined') {
        params.args.where.tenantId = tenantId
      }
    }

    // Handle CREATE operations (create, createMany)
    if (params.action === 'create') {
      params.args = params.args || {}
      params.args.data = params.args.data || {}
      
      // Add tenantId to data if not provided
      if (typeof params.args.data.tenantId === 'undefined') {
        params.args.data.tenantId = tenantId
      }
    }

    if (params.action === 'createMany') {
      params.args = params.args || {}
      if (Array.isArray(params.args.data)) {
        params.args.data = params.args.data.map((item: any) => ({
          ...item,
          tenantId: typeof item.tenantId === 'undefined' ? tenantId : item.tenantId
        }))
      }
    }

    // Handle UPDATE operations (update, updateMany, upsert)
    if (['update', 'updateMany', 'upsert'].includes(params.action)) {
      params.args = params.args || {}
      params.args.where = params.args.where || {}
      
      // Add tenant filter to where clause
      if (typeof params.args.where.tenantId === 'undefined') {
        params.args.where.tenantId = tenantId
      }
      
      // For upsert, also add to create data
      if (params.action === 'upsert' && params.args.create) {
        if (typeof params.args.create.tenantId === 'undefined') {
          params.args.create.tenantId = tenantId
        }
      }
    }

    // Handle DELETE operations (delete, deleteMany)
    if (['delete', 'deleteMany'].includes(params.action)) {
      params.args = params.args || {}
      params.args.where = params.args.where || {}
      
      // Add tenant filter to where clause
      if (typeof params.args.where.tenantId === 'undefined') {
        params.args.where.tenantId = tenantId
      }
    }

    return next(params)
  }
}
