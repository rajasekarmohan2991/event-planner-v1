import { UserRole, Permission } from './roles-config'

export interface PermissionError {
  title: string
  message: string
  suggestion: string
  contactAdmin: boolean
  allowedRoles: UserRole[]
}

// Permission error messages based on the user's role matrix
export const PERMISSION_ERRORS: Record<string, PermissionError> = {
  // User Management Errors
  'users.create': {
    title: 'User Creation Not Allowed',
    message: 'Your role is not intended to create new users in the system.',
    suggestion: 'Only Super Administrators can create new users.',
    contactAdmin: true,
    allowedRoles: ['SUPER_ADMIN']
  },
  'users.edit': {
    title: 'User Editing Not Allowed',
    message: 'Your role is not intended to edit user information or settings.',
    suggestion: 'Only Super Administrators can modify user details.',
    contactAdmin: true,
    allowedRoles: ['SUPER_ADMIN']
  },
  'users.delete': {
    title: 'User Deletion Not Allowed',
    message: 'Your role is not intended to delete users from the system.',
    suggestion: 'Only Super Administrators can remove users.',
    contactAdmin: true,
    allowedRoles: ['SUPER_ADMIN']
  },

  // Event Management Errors
  'events.create': {
    title: 'Event Creation Not Allowed',
    message: 'Your role is not intended to create new events.',
    suggestion: 'Please contact a Tenant Admin, Administrator, Event Manager, or Super Administrator to create events.',
    contactAdmin: true,
    allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'EVENT_MANAGER']
  },
  'events.edit': {
    title: 'Event Editing Not Allowed',
    message: 'Your role is not intended to edit or update event information.',
    suggestion: 'Please contact a Tenant Admin, Administrator, Event Manager, or Super Administrator to modify events.',
    contactAdmin: true,
    allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'EVENT_MANAGER']
  },
  'events.delete': {
    title: 'Event Deletion Not Allowed',
    message: 'Your role is not intended to delete events from the system.',
    suggestion: 'Only Super Administrators can permanently remove events.',
    contactAdmin: true,
    allowedRoles: ['SUPER_ADMIN']
  },

  // Role Management Errors
  'admin.permissions': {
    title: 'Role Management Not Allowed',
    message: 'Your role is not intended to manage user roles or permissions.',
    suggestion: 'Only Super Administrators can modify roles and permissions.',
    contactAdmin: true,
    allowedRoles: ['SUPER_ADMIN']
  },
  'users.assign_roles': {
    title: 'Role Assignment Not Allowed',
    message: 'Your role is not intended to assign or change user roles.',
    suggestion: 'Only Super Administrators can assign roles to users.',
    contactAdmin: true,
    allowedRoles: ['SUPER_ADMIN']
  },

  // Analytics Errors
  'analytics.view': {
    title: 'Analytics Access Not Allowed',
    message: 'Your role is not intended to view analytics and reports.',
    suggestion: 'Please contact an Administrator, Event Manager, or Super Administrator for analytics access.',
    contactAdmin: true,
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER']
  },

  // System Settings Errors
  'system.settings': {
    title: 'System Settings Access Not Allowed',
    message: 'Your role is not intended to modify system settings or configurations.',
    suggestion: 'Only Super Administrators can change system settings.',
    contactAdmin: true,
    allowedRoles: ['SUPER_ADMIN']
  }
}

// Generate error message for any permission
export function getPermissionError(
  permission: Permission, 
  userRole: UserRole,
  action?: string
): PermissionError {
  const baseError = PERMISSION_ERRORS[permission]
  
  if (baseError) {
    return baseError
  }

  // Generic error for unlisted permissions
  return {
    title: `${action || 'Action'} Not Allowed`,
    message: `Your role (${userRole}) is not intended to perform this action.`,
    suggestion: 'Please contact an administrator for assistance.',
    contactAdmin: true,
    allowedRoles: ['SUPER_ADMIN']
  }
}

// Generate user-friendly error message
export function formatPermissionError(
  permission: Permission,
  userRole: UserRole,
  action?: string
): string {
  const error = getPermissionError(permission, userRole, action)
  
  return `${error.title}\n\n${error.message}\n\n${error.suggestion}${
    error.contactAdmin ? '\n\nPlease contact your system administrator for access.' : ''
  }`
}

// Get allowed roles for a permission
export function getAllowedRoles(permission: Permission): UserRole[] {
  const error = PERMISSION_ERRORS[permission]
  return error?.allowedRoles || ['SUPER_ADMIN']
}

// Check if action should show contact admin message
export function shouldContactAdmin(permission: Permission): boolean {
  const error = PERMISSION_ERRORS[permission]
  return error?.contactAdmin ?? true
}

// Role-specific error messages
export const ROLE_SPECIFIC_MESSAGES: Record<UserRole, string> = {
  USER: 'As a User, you can only view events and register for them. You cannot create, edit, or manage events.',
  ORGANIZER: 'As an Event Organizer, you can create and manage your own events but cannot access user management or system settings.',
  EVENT_MANAGER: 'As an Event Manager, you can manage events and view analytics but cannot manage users, delete events, or access system settings.',
  ADMIN: 'As an Administrator, you can view users and manage events but cannot create/edit/delete users, delete events, manage roles, or access system settings.',
  TENANT_ADMIN: 'As a Tenant Admin (Company Owner), you have full control over your company workspace and events, including creating and editing events and managing team members.',
  STAFF: 'As Staff, you can view events and registrations but cannot create or edit events.',
  VIEWER: 'As a Viewer, you have read-only access to event information and reports.',
  SUPER_ADMIN: 'As a Super Administrator, you have full access to all system features and settings.'
}

// Get role-specific guidance message
export function getRoleGuidance(userRole: UserRole): string {
  return ROLE_SPECIFIC_MESSAGES[userRole] || 'Please contact your administrator for information about your role permissions.'
}
