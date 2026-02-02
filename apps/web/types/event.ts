// Event status type
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'

// Base event interface
export interface BaseEvent {
  id: string
  title: string
  description: string
  startDate: Date | string
  endDate: Date | string
  location: string
  capacity: number
  price: number
  status: EventStatus
  organizerId: string
  categoryId?: string | null
  imageUrl?: string | null
  slug: string
  createdAt: Date | string
  updatedAt: Date | string
  termsAndConditions?: string | null
  disclaimer?: string | null
  eventManagerName?: string | null
  eventManagerContact?: string | null
  eventManagerEmail?: string | null
  bannerUrl?: string | null
}

// Event with relations
export interface Event extends BaseEvent {
  organizer: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
  category?: {
    id: string
    name: string
    slug: string
  } | null
  _count?: {
    registrations: number
    attendees: number
  }
}

// Event form values
export interface EventFormValues
  extends Omit<BaseEvent, 'id' | 'createdAt' | 'updatedAt' | 'organizerId' | 'status' | 'slug'> {
  id?: string
  status?: EventStatus
  image?: File | string | null
}

// API response types
export interface EventsResponse {
  items: Event[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Event filter params
export interface EventFilterParams {
  page?: number
  limit?: number
  search?: string
  status?: EventStatus | ''
  category?: string
  organizerId?: string
  sortBy?: 'startDate' | 'createdAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}

// Event stats
export interface EventStats {
  totalEvents: number
  publishedEvents: number
  draftEvents: number
  cancelledEvents: number
  completedEvents: number
  upcomingEvents: number
  totalRegistrations: number
  totalRevenue: number
}

// Event registration
export interface EventRegistration {
  id: string
  eventId: string
  userId: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'ATTENDED'
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED'
  paymentAmount: number
  paymentDate: Date | null
  createdAt: Date | string
  updatedAt: Date | string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  event: Pick<BaseEvent, 'id' | 'title' | 'startDate' | 'endDate'>
}

// Event category
export interface EventCategory {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

// Event search result
export interface EventSearchResult {
  id: string
  title: string
  description: string
  startDate: Date | string
  endDate: Date | string
  location: string
  status: EventStatus
  slug: string
  imageUrl: string | null
  organizer: {
    id: string
    name: string | null
  }
  _count: {
    registrations: number
  }
}

// Event location
export interface EventLocation {
  type: 'online' | 'venue'
  url?: string
  venueName?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

// Event schedule
export interface EventSchedule {
  startDate: string
  endDate: string
  timezone: string
  isAllDay: boolean
  scheduleItems?: {
    id: string
    title: string
    description?: string
    startTime: string
    endTime: string
    location?: string
    speakers?: {
      id: string
      name: string
      avatar?: string
    }[]
  }[]
}

// Event ticket
export interface EventTicket {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  quantity: number
  sold: number
  salesStartDate?: string
  salesEndDate?: string
  minPerOrder?: number
  maxPerOrder?: number
  isActive: boolean
}

// Event speaker
export interface EventSpeaker {
  id: string
  name: string
  title?: string
  bio?: string
  avatar?: string
  company?: string
  socialLinks?: {
    twitter?: string
    linkedin?: string
    github?: string
    website?: string
  }
}

// Event sponsor
export interface EventSponsor {
  id: string
  name: string
  logo: string
  website: string
  tier: 'platinum' | 'gold' | 'silver' | 'bronze'
}

// Event analytics
export interface EventAnalytics {
  totalRegistrations: number
  totalAttendees: number
  checkInRate: number
  ticketSales: {
    ticketId: string
    ticketName: string
    sold: number
    revenue: number
  }[]
  registrationTrend: {
    date: string
    count: number
  }[]
  attendeeDemographics: {
    location: Record<string, number>
    company: Record<string, number>
    jobTitle: Record<string, number>
  }
}

// Custom field
export interface CustomField {
  id: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox'
  required: boolean
  options?: string[]
}

// Attendee
export interface Attendee {
  id: string
  eventId: string
  userId: string
  status: 'confirmed' | 'pending' | 'declined' | 'waitlisted' | 'checked_in' | 'cancelled'
  guestCount: number
  customResponses?: Record<string, any>
  checkInTime?: Date
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}
