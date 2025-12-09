export interface DashboardStats {
  totalEvents: number
  upcomingEvents: number
  totalUsers: number
  recentRegistrations: number
  totalTickets: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  emailVerified: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  id: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  location: string
  capacity: number
  price: number
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
  organizerId: string
  createdAt: Date
  updatedAt: Date
}

export interface Registration {
  id: string
  userId: string
  eventId: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'ATTENDED'
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED'
  paymentAmount: number
  paymentDate: Date | null
  createdAt: Date
  updatedAt: Date
  user: Pick<User, 'id' | 'name' | 'email'>
  event: Pick<Event, 'id' | 'title' | 'startDate'>
}
