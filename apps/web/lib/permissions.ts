/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines permissions for all 9 tenant roles
 */

export type Permission = 
  // Dashboard
  | 'dashboard.view'
  | 'dashboard.view_all_tenants'
  
  // Events
  | 'events.view'
  | 'events.create'
  | 'events.edit'
  | 'events.delete'
  | 'events.publish'
  
  // Registrations
  | 'registrations.view'
  | 'registrations.create'
  | 'registrations.edit'
  | 'registrations.delete'
  | 'registrations.approve'
  | 'registrations.export'
  
  // Exhibitors
  | 'exhibitors.view'
  | 'exhibitors.create'
  | 'exhibitors.edit'
  | 'exhibitors.delete'
  | 'exhibitors.assign_booths'
  
  // Design
  | 'design.view'
  | 'design.edit_theme'
  | 'design.edit_floor_plan'
  | 'design.edit_banner'
  
  // Communicate
  | 'communicate.view'
  | 'communicate.send_email'
  | 'communicate.send_sms'
  | 'communicate.send_whatsapp'
  
  // Reports
  | 'reports.view'
  | 'reports.view_financial'
  | 'reports.export'
  
  // Event Day
  | 'eventday.view'
  | 'eventday.checkin'
  | 'eventday.manage_queue'
  
  // Venues
  | 'venues.view'
  | 'venues.create'
  | 'venues.edit'
  | 'venues.delete'
  
  // Settings
  | 'settings.view'
  | 'settings.edit_tenant'
  | 'settings.manage_users'
  | 'settings.manage_billing'
  | 'settings.manage_integrations'
  
  // Financial
  | 'financial.view_payments'
  | 'financial.process_refunds'
  | 'financial.view_invoices'
  | 'financial.export_financial'

export type TenantRole = 
  | 'TENANT_ADMIN'
  | 'EVENT_MANAGER'
  | 'VENUE_MANAGER'
  | 'FINANCE_ADMIN'
  | 'MARKETING_ADMIN'
  | 'SUPPORT_STAFF'
  | 'EXHIBITOR_MANAGER'
  | 'ATTENDEE'
  | 'VIEWER'

export type SystemRole = 
  | 'SUPER_ADMIN'
  | 'USER'

/**
 * Role Permissions Matrix
 * Defines what each role can do
 */
export const ROLE_PERMISSIONS: Record<TenantRole, Permission[]> = {
  // 1. TENANT_ADMIN - Full control of their organization
  TENANT_ADMIN: [
    'dashboard.view',
    'events.view', 'events.create', 'events.edit', 'events.delete', 'events.publish',
    'registrations.view', 'registrations.create', 'registrations.edit', 'registrations.delete', 'registrations.approve', 'registrations.export',
    'exhibitors.view', 'exhibitors.create', 'exhibitors.edit', 'exhibitors.delete', 'exhibitors.assign_booths',
    'design.view', 'design.edit_theme', 'design.edit_floor_plan', 'design.edit_banner',
    'communicate.view', 'communicate.send_email', 'communicate.send_sms', 'communicate.send_whatsapp',
    'reports.view', 'reports.view_financial', 'reports.export',
    'eventday.view', 'eventday.checkin', 'eventday.manage_queue',
    'venues.view', 'venues.create', 'venues.edit', 'venues.delete',
    'settings.view', 'settings.edit_tenant', 'settings.manage_users', 'settings.manage_billing', 'settings.manage_integrations',
    'financial.view_payments', 'financial.process_refunds', 'financial.view_invoices', 'financial.export_financial',
  ],
  
  // 2. EVENT_MANAGER - Creates and manages events
  EVENT_MANAGER: [
    'dashboard.view',
    'events.view', 'events.create', 'events.edit', 'events.publish',
    'registrations.view', 'registrations.create', 'registrations.edit', 'registrations.approve', 'registrations.export',
    'exhibitors.view', 'exhibitors.create', 'exhibitors.edit', 'exhibitors.assign_booths',
    'design.view', 'design.edit_theme', 'design.edit_floor_plan', 'design.edit_banner',
    'communicate.view', 'communicate.send_email', 'communicate.send_sms',
    'reports.view', 'reports.export',
    'eventday.view', 'eventday.checkin', 'eventday.manage_queue',
    'venues.view',
    'settings.view',
  ],
  
  // 3. VENUE_MANAGER - Manages venue operations
  VENUE_MANAGER: [
    'dashboard.view',
    'events.view',
    'venues.view', 'venues.create', 'venues.edit', 'venues.delete',
    'design.view', 'design.edit_floor_plan',
    'eventday.view', 'eventday.manage_queue',
    'reports.view',
    'settings.view',
  ],
  
  // 4. FINANCE_ADMIN - Handles payments and financial reports
  FINANCE_ADMIN: [
    'dashboard.view',
    'events.view',
    'registrations.view', 'registrations.export',
    'reports.view', 'reports.view_financial', 'reports.export',
    'financial.view_payments', 'financial.process_refunds', 'financial.view_invoices', 'financial.export_financial',
    'settings.view', 'settings.manage_billing',
  ],
  
  // 5. MARKETING_ADMIN - Controls branding and communications
  MARKETING_ADMIN: [
    'dashboard.view',
    'events.view',
    'registrations.view', 'registrations.export',
    'design.view', 'design.edit_theme', 'design.edit_banner',
    'communicate.view', 'communicate.send_email', 'communicate.send_sms', 'communicate.send_whatsapp',
    'reports.view', 'reports.export',
    'settings.view',
  ],
  
  // 6. SUPPORT_STAFF - On-ground event support
  SUPPORT_STAFF: [
    'dashboard.view',
    'events.view',
    'registrations.view', 'registrations.create',
    'eventday.view', 'eventday.checkin',
    'exhibitors.view',
  ],
  
  // 7. EXHIBITOR_MANAGER - Manages exhibitor relationships
  EXHIBITOR_MANAGER: [
    'dashboard.view',
    'events.view',
    'exhibitors.view', 'exhibitors.create', 'exhibitors.edit', 'exhibitors.assign_booths',
    'design.view', 'design.edit_floor_plan',
    'communicate.view', 'communicate.send_email',
    'reports.view',
  ],
  
  // 8. ATTENDEE - Public event registration (read-only)
  ATTENDEE: [
    'events.view',
    'registrations.view', 'registrations.create',
  ],
  
  // 9. VIEWER - Read-only access to reports
  VIEWER: [
    'dashboard.view',
    'events.view',
    'registrations.view',
    'exhibitors.view',
    'reports.view',
  ],
}

/**
 * Super Admin Permissions
 * Platform-level access
 */
export const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  'dashboard.view',
  'dashboard.view_all_tenants',
  ...ROLE_PERMISSIONS.TENANT_ADMIN, // All tenant permissions
]

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: TenantRole | SystemRole, permission: Permission): boolean {
  if (role === 'SUPER_ADMIN') {
    return SUPER_ADMIN_PERMISSIONS.includes(permission)
  }
  
  if (role === 'USER') {
    return false // Regular users have no tenant permissions
  }
  
  return ROLE_PERMISSIONS[role as TenantRole]?.includes(permission) || false
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: TenantRole | SystemRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission))
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: TenantRole | SystemRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission))
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: TenantRole | SystemRole): Permission[] {
  if (role === 'SUPER_ADMIN') {
    return SUPER_ADMIN_PERMISSIONS
  }
  
  if (role === 'USER') {
    return []
  }
  
  return ROLE_PERMISSIONS[role as TenantRole] || []
}

/**
 * Role Descriptions
 */
export const ROLE_DESCRIPTIONS: Record<TenantRole | SystemRole, string> = {
  SUPER_ADMIN: 'Platform administrator with access to all tenants and system settings',
  USER: 'Regular platform user without tenant access',
  TENANT_ADMIN: 'Full control of the organization including billing, users, and all features',
  EVENT_MANAGER: 'Creates and manages events, registrations, and event-day operations',
  VENUE_MANAGER: 'Manages venues, floor plans, and venue-related operations',
  FINANCE_ADMIN: 'Handles all financial operations, payments, refunds, and billing',
  MARKETING_ADMIN: 'Controls branding, communications, and marketing campaigns',
  SUPPORT_STAFF: 'On-ground support for check-ins and attendee assistance',
  EXHIBITOR_MANAGER: 'Manages exhibitor relationships, booth assignments, and communications',
  ATTENDEE: 'Can register for events and view event information',
  VIEWER: 'Read-only access to dashboards and reports',
}

/**
 * Module Access Matrix
 * Defines which roles can access which modules
 */
export const MODULE_ACCESS: Record<string, TenantRole[]> = {
  dashboard: ['TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN', 'SUPPORT_STAFF', 'EXHIBITOR_MANAGER', 'VIEWER'],
  events: ['TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN', 'SUPPORT_STAFF', 'EXHIBITOR_MANAGER', 'ATTENDEE', 'VIEWER'],
  registrations: ['TENANT_ADMIN', 'EVENT_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN', 'SUPPORT_STAFF', 'ATTENDEE', 'VIEWER'],
  exhibitors: ['TENANT_ADMIN', 'EVENT_MANAGER', 'EXHIBITOR_MANAGER', 'SUPPORT_STAFF', 'VIEWER'],
  design: ['TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'MARKETING_ADMIN', 'EXHIBITOR_MANAGER'],
  communicate: ['TENANT_ADMIN', 'EVENT_MANAGER', 'MARKETING_ADMIN', 'EXHIBITOR_MANAGER'],
  reports: ['TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN', 'EXHIBITOR_MANAGER', 'VIEWER'],
  eventday: ['TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'SUPPORT_STAFF'],
  venues: ['TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER'],
  settings: ['TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN'],
}

/**
 * Check if a role can access a module
 */
export function canAccessModule(role: TenantRole | SystemRole, module: string): boolean {
  if (role === 'SUPER_ADMIN') {
    return true // Super admin can access everything
  }
  
  if (role === 'USER') {
    return false // Regular users can't access tenant modules
  }
  
  return MODULE_ACCESS[module]?.includes(role as TenantRole) || false
}
