// Comprehensive Role-Based Access Control Configuration
// Aligned with database enums: SystemRole and TenantRole

// System-level roles (from SystemRole enum in database)
export type SystemRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER'

// Tenant-level roles (from TenantRole enum in database)
export type TenantRole =
  | 'TENANT_ADMIN'
  | 'EVENT_MANAGER'
  | 'VENUE_MANAGER'
  | 'FINANCE_ADMIN'
  | 'MARKETING_ADMIN'
  | 'SUPPORT_STAFF'
  | 'STAFF'
  | 'EXHIBITOR_MANAGER'
  | 'ATTENDEE'
  | 'VIEWER'

// Combined type for convenience (used in session and role checks)
export type UserRole = SystemRole | TenantRole | 'ORGANIZER' // ORGANIZER kept for backward compatibility

export type Permission =
  // User Management
  | 'users.view' | 'users.create' | 'users.edit' | 'users.delete' | 'users.assign_roles'
  // Event Management  
  | 'events.view' | 'events.create' | 'events.edit' | 'events.delete' | 'events.publish'
  | 'events.manage_registrations' | 'events.view_analytics'
  // Registration Management
  | 'registrations.view' | 'registrations.approve' | 'registrations.cancel' | 'registrations.export'
  // Admin Functions
  | 'admin.dashboard' | 'admin.settings' | 'admin.verifications' | 'admin.permissions'
  // System Functions
  | 'system.settings' | 'system.backup' | 'system.maintenance'
  // Analytics & Reports
  | 'analytics.view' | 'analytics.export' | 'analytics.payments'
  // Communication
  | 'communication.send_email' | 'communication.send_sms' | 'communication.bulk_operations'
  // Payments
  | 'payments.view' | 'payments.process' | 'payments.refund'
  // Design & Branding
  | 'design.templates' | 'design.branding' | 'design.themes'
  // Promo Codes
  | 'promo_codes.view' | 'promo_codes.create' | 'promo_codes.edit' | 'promo_codes.delete'

export interface RoleDefinition {
  name: UserRole
  displayName: string
  description: string
  permissions: Permission[]
  dashboardRoute: string
  allowedRoutes: string[]
  navigationItems: string[]
  color: string
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  SUPER_ADMIN: {
    name: 'SUPER_ADMIN',
    displayName: 'Super Administrator',
    description: 'Full system access with all permissions',
    permissions: [
      // Users: All operations ✅
      'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign_roles',
      // Events: All operations ✅
      'events.view', 'events.create', 'events.edit', 'events.delete', 'events.publish',
      'events.manage_registrations', 'events.view_analytics',
      // Roles: Manage roles ✅
      'admin.permissions', 'users.assign_roles',
      // Analytics: View analytics ✅
      'analytics.view', 'analytics.export', 'analytics.payments',
      // System: System settings ✅
      'system.settings', 'system.backup', 'system.maintenance',
      // Additional permissions
      'registrations.view', 'registrations.approve', 'registrations.cancel', 'registrations.export',
      'admin.dashboard', 'admin.settings', 'admin.verifications',
      'communication.send_email', 'communication.send_sms', 'communication.bulk_operations',
      'payments.view', 'payments.process', 'payments.refund',
      'design.templates', 'design.branding', 'design.themes',
      'promo_codes.view', 'promo_codes.create', 'promo_codes.edit', 'promo_codes.delete'
    ],
    dashboardRoute: '/super-admin/companies',
    allowedRoutes: [
      '/admin/*', '/super-admin/*', '/events/*', '/dashboard/*', '/users/*', '/analytics/*',
      '/settings/*', '/verifications/*', '/permissions/*'
    ],
    navigationItems: [
      'admin-dashboard', 'user-management', 'event-management', 'verifications',
      'permissions', 'analytics', 'system-settings'
    ],
    color: 'red'
  },

  TENANT_ADMIN: {
    name: 'TENANT_ADMIN',
    displayName: 'Company Admin',
    description: 'Full control over company workspace and events',
    permissions: [
      // Users & Team Management
      'users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign_roles',
      // Events: Full CRUD
      'events.view', 'events.create', 'events.edit', 'events.delete', 'events.publish',
      'events.manage_registrations', 'events.view_analytics',
      // Admin & Settings
      'admin.dashboard', 'admin.settings', 'admin.verifications', 'admin.permissions',
      // Analytics & Reports
      'analytics.view', 'analytics.export', 'analytics.payments',
      // System functions (scoped to tenant settings screens)
      'system.settings',
      // Communication
      'communication.send_email', 'communication.send_sms', 'communication.bulk_operations',
      // Payments
      'payments.view', 'payments.process', 'payments.refund',
      // Design & Branding
      'design.templates', 'design.branding', 'design.themes',
      // Promo Codes
      'promo_codes.view', 'promo_codes.create', 'promo_codes.edit', 'promo_codes.delete'
    ],
    dashboardRoute: '/admin',
    allowedRoutes: [
      '/admin/*', '/events/*', '/dashboard/*', '/analytics/*', '/settings/*'
    ],
    navigationItems: [
      'admin-dashboard', 'user-management', 'event-management', 'verifications', 'permissions', 'analytics', 'system-settings'
    ],
    color: 'indigo'
  },

  ADMIN: {
    name: 'ADMIN',
    displayName: 'Administrator',
    description: 'View users and manage events with analytics access',
    permissions: [
      // Users: View only ✅ (NO create, edit, delete)
      'users.view',
      // Events: View, create, edit ✅ (NO delete)
      'events.view', 'events.create', 'events.edit', 'events.publish',
      'events.manage_registrations', 'events.view_analytics',
      // Analytics: View analytics ✅
      'analytics.view', 'analytics.export',
      // Additional permissions for admin functionality
      'registrations.view', 'registrations.approve', 'registrations.cancel', 'registrations.export',
      'admin.dashboard', 'admin.settings', 'admin.verifications',
      'communication.send_email', 'communication.send_sms',
      'payments.view', 'payments.process',
      'promo_codes.view', 'promo_codes.create', 'promo_codes.edit', 'promo_codes.delete'
    ],
    dashboardRoute: '/admin',
    allowedRoutes: [
      '/admin/dashboard', '/admin/users', '/admin/settings', '/admin/verifications',
      '/events/*', '/analytics/*'
    ],
    navigationItems: [
      'admin-dashboard', 'user-management', 'event-management', 'verifications', 'analytics'
    ],
    color: 'blue'
  },

  USER: {
    name: 'USER',
    displayName: 'User',
    description: 'Basic user with limited access',
    permissions: [
      'events.view'
    ],
    dashboardRoute: '/dashboard/user',
    allowedRoutes: ['/dashboard/user', '/events/*/public', '/my-tickets', '/profile'],
    navigationItems: ['my-events', 'my-tickets', 'profile'],
    color: 'gray'
  },


  EVENT_MANAGER: {
    name: 'EVENT_MANAGER',
    displayName: 'Event Manager',
    description: 'Full event management with analytics access',
    permissions: [
      // Users: NO permissions ❌
      // Events: View, create, edit ✅ (NO delete)
      'events.view', 'events.create', 'events.edit', 'events.publish',
      'events.manage_registrations', 'events.view_analytics',
      // Analytics: View analytics ✅
      'analytics.view',
      // Additional event-related permissions
      'registrations.view', 'registrations.approve', 'registrations.cancel', 'registrations.export',
      'communication.send_email', 'communication.send_sms',
      'design.templates', 'design.branding',
      // Promo codes: Full CRUD ✅
      'promo_codes.view', 'promo_codes.create', 'promo_codes.edit', 'promo_codes.delete'
    ],
    dashboardRoute: '/dashboard/event-manager',
    allowedRoutes: [
      '/dashboard/event-manager', '/events/*', '/analytics/events'
    ],
    navigationItems: [
      'event-dashboard', 'my-events', 'registrations', 'analytics', 'communication'
    ],
    color: 'green'
  },

  ORGANIZER: {
    name: 'ORGANIZER',
    displayName: 'Event Organizer',
    description: 'View events and registrations - event management done by Event Managers',
    permissions: [
      // Events: View only ✅ (NO create, edit, delete - managed by EVENT_MANAGER)
      'events.view',
      // Registrations: View and basic communication only
      'registrations.view',
      'communication.send_email'
    ],
    dashboardRoute: '/dashboard/organizer',
    allowedRoutes: [
      '/dashboard/organizer', '/events/[id]/registrations'
    ],
    navigationItems: [
      'organizer-dashboard', 'view-events', 'registrations'
    ],
    color: 'purple'
  },

  VENUE_MANAGER: {
    name: 'VENUE_MANAGER',
    displayName: 'Venue Manager',
    description: 'Manages venue operations and logistics',
    permissions: [
      'events.view', 'events.edit',
      'registrations.view',
      'design.templates'
    ],
    dashboardRoute: '/dashboard/venue-manager',
    allowedRoutes: ['/dashboard/venue-manager', '/events/*', '/venues/*'],
    navigationItems: ['events', 'venues', 'logistics'],
    color: 'amber'
  },

  FINANCE_ADMIN: {
    name: 'FINANCE_ADMIN',
    displayName: 'Finance Admin',
    description: 'Handles payments and financial reports',
    permissions: [
      'events.view',
      'registrations.view', 'registrations.export',
      'payments.view', 'payments.process', 'payments.refund',
      'analytics.view', 'analytics.export', 'analytics.payments',
      'promo_codes.view', 'promo_codes.create', 'promo_codes.edit'
    ],
    dashboardRoute: '/dashboard/finance',
    allowedRoutes: ['/dashboard/finance', '/events/*', '/payments/*', '/analytics/*'],
    navigationItems: ['payments', 'analytics', 'reports'],
    color: 'emerald'
  },

  MARKETING_ADMIN: {
    name: 'MARKETING_ADMIN',
    displayName: 'Marketing Admin',
    description: 'Controls branding and communications',
    permissions: [
      'events.view', 'events.edit',
      'communication.send_email', 'communication.send_sms', 'communication.bulk_operations',
      'design.templates', 'design.branding', 'design.themes',
      'promo_codes.view', 'promo_codes.create', 'promo_codes.edit',
      'analytics.view'
    ],
    dashboardRoute: '/dashboard/marketing',
    allowedRoutes: ['/dashboard/marketing', '/events/*', '/communicate/*', '/design/*'],
    navigationItems: ['campaigns', 'branding', 'communications'],
    color: 'pink'
  },

  SUPPORT_STAFF: {
    name: 'SUPPORT_STAFF',
    displayName: 'Support Staff',
    description: 'On-ground event support',
    permissions: [
      'events.view',
      'registrations.view', 'registrations.approve'
    ],
    dashboardRoute: '/dashboard/support',
    allowedRoutes: ['/dashboard/support', '/events/*', '/checkin/*'],
    navigationItems: ['events', 'registrations', 'check-in'],
    color: 'teal'
  },

  ATTENDEE: {
    name: 'ATTENDEE',
    displayName: 'Attendee',
    description: 'Public event registration (read-only)',
    permissions: [
      'events.view'
    ],
    dashboardRoute: '/dashboard/user',
    allowedRoutes: ['/dashboard/user', '/events/*/public', '/my-tickets'],
    navigationItems: ['my-events', 'my-tickets'],
    color: 'slate'
  },


  VIEWER: {
    name: 'VIEWER',
    displayName: 'Viewer',
    description: 'Read-only access to public event information',
    permissions: [
      'events.view'
    ],
    dashboardRoute: '/dashboard/viewer',
    allowedRoutes: [
      '/dashboard/viewer', '/events/*'
    ],
    navigationItems: [
      'view-events'
    ],
    color: 'gray'
  },


  EXHIBITOR_MANAGER: {
    name: 'EXHIBITOR_MANAGER',
    displayName: 'Exhibitor Manager',
    description: 'Manage exhibitors and vendors for events',
    permissions: [
      'events.view', 'events.edit',
      'communication.send_email',
      'design.branding'
    ],
    dashboardRoute: '/company/vendors',
    allowedRoutes: [
      '/company/vendors', '/events/*', '/dashboard/*'
    ],
    navigationItems: [
      'event-dashboard', 'vendors', 'registrations'
    ],
    color: 'orange'
  },

  STAFF: {
    name: 'STAFF',
    displayName: 'Staff',
    description: 'General operational staff',
    permissions: [
      'events.view',
      'registrations.view'
    ],
    dashboardRoute: '/dashboard/staff',
    allowedRoutes: ['/dashboard/staff', '/events/*', '/checkin/*'],
    navigationItems: ['events', 'check-in'],
    color: 'teal'
  }
}

// Helper functions
export function getRoleDefinition(role: UserRole): RoleDefinition {
  return ROLE_DEFINITIONS[role]
}

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const roleDefinition = getRoleDefinition(userRole)
  return roleDefinition.permissions.includes(permission)
}

export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

export function canAccessRoute(userRole: UserRole, route: string): boolean {
  const roleDefinition = getRoleDefinition(userRole)
  return roleDefinition.allowedRoutes.some(allowedRoute => {
    if (allowedRoute.endsWith('/*')) {
      const basePath = allowedRoute.slice(0, -2)
      return route.startsWith(basePath)
    }
    return route === allowedRoute || route.startsWith(allowedRoute + '/')
  })
}

export function getNavigationItems(userRole: UserRole): string[] {
  const roleDefinition = getRoleDefinition(userRole)
  return roleDefinition.navigationItems
}

export function getDashboardRoute(userRole: UserRole): string {
  const roleDefinition = getRoleDefinition(userRole)
  return roleDefinition.dashboardRoute
}
