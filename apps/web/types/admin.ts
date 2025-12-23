export interface DashboardStats {
  totalEvents: number
  upcomingEvents: number
  totalUsers: number
  recentRegistrations: number
  totalTickets: number
  rsvpStats?: { total: number; going: number; interested: number; notGoing: number }
}

export interface UserListResponse {
  data: Array<{
    id: string
    name: string | null
    email: string | null
    role: 'ADMIN' | 'ORGANIZER' | 'USER'
    image: string | null
    emailVerified: boolean
    createdAt: Date
    eventsCount: number
    registrationsCount: number
  }>
  total: number
  page: number
  totalPages: number
}

export interface UserResponse {
  id: string
  name: string | null
  email: string | null
  role: 'ADMIN' | 'ORGANIZER' | 'USER'
  image: string | null
  emailVerified: boolean
  createdAt: Date
  eventsCount: number
  registrationsCount: number
}

export interface EventListResponse {
  data: Array<{
    id: string
    title: string
    description: string | null
    location: string | null
    startDate: string
    endDate: string
    status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
    capacity: number | null
    price: number | null
    image: string | null
    categoryId: string | null
    organizer: {
      id: string
      name: string | null
      email: string | null
    }
    _count: {
      attendees: number
    }
    attendees: number
    createdAt: string
    updatedAt: string
  }>
  total: number
  page: number
  totalPages: number
}

export interface RegistrationStats {
  total: number
  checkedIn: number
  pending: number
  cancelled: number
  byDate: Array<{
    date: string
    count: number
  }>
}

export interface RevenueStats {
  totalRevenue: number
  paidAmount: number
  pendingAmount: number
  refundedAmount: number
  byEvent: Array<{
    eventId: string
    eventTitle: string
    amount: number
  }>
}

export interface DashboardOverview {
  stats: DashboardStats
  recentRegistrations: Array<{
    id: string
    eventTitle: string
    userName: string
    status: string
    createdAt: Date
  }>
  upcomingEvents: Array<{
    id: string
    title: string
    startDate: Date
    location: string | null
    registrationsCount: number
    capacity: number | null
  }>
}
