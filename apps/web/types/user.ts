export enum UserRole {
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
  USER = 'USER'
}

export type UserRoleWithGuest = UserRole | 'GUEST';

export interface User {
  id: string
  name: string | null
  email: string | null
  role: UserRole
  image: string | null
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  avatar?: string
  profile?: UserProfile
  _count?: {
    events: number
    registrations: number
  }
}

export interface UserProfile {
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  jobTitle?: string
  bio?: string
  timezone?: string
  preferences?: UserPreferences
}

export interface UserPreferences {
  emailNotifications: boolean
  smsNotifications: boolean
  marketingEmails: boolean
  theme: 'light' | 'dark' | 'system'
  language: string
}

export interface CreateUserData {
  email: string
  name: string
  password: string
  role?: UserRole
}

export interface UpdateUserData {
  name?: string
  avatar?: string
  role?: UserRole
  profile?: Partial<UserProfile>
}

export interface UserStats {
  totalUsers: number
  activeUsers: number
  newUsersThisMonth: number
  usersByRole: Record<UserRole, number>
}
