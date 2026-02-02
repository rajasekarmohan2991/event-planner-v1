// Provider Portal Types

export type ProviderType = 'VENDOR' | 'SPONSOR' | 'EXHIBITOR'

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED'

export type SubscriptionTier = 'FREE' | 'PRO' | 'ENTERPRISE'

export type PaymentTerms = 'NET_15' | 'NET_30' | 'NET_60' | 'IMMEDIATE'

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED'

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED'

export type ProviderRole = 'OWNER' | 'ADMIN' | 'SALES' | 'OPERATIONS' | 'VIEWER'

export type PricingModel = 'FIXED' | 'PER_PERSON' | 'PER_HOUR' | 'PER_DAY' | 'CUSTOM'

export interface ServiceProvider {
  id: number
  providerType: ProviderType
  companyName: string
  businessRegistrationNumber?: string
  taxId?: string
  email: string
  phone?: string
  website?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  country: string
  postalCode?: string
  description?: string
  yearEstablished?: number
  teamSize?: string
  verificationStatus: VerificationStatus
  verificationDocuments: string[]
  verificationNotes?: string
  verifiedAt?: Date
  verifiedBy?: number
  isActive: boolean
  rating: number
  totalReviews: number
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  totalRevenue: number
  logoUrl?: string
  bannerUrl?: string
  gallery: string[]
  commissionRate: number
  paymentTerms: PaymentTerms
  subscriptionTier: SubscriptionTier
  subscriptionExpiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ProviderCategory {
  id: number
  providerId: number
  category: string
  subcategory?: string
  isPrimary: boolean
  createdAt: Date
}

export interface ProviderService {
  id: number
  providerId: number
  serviceName: string
  description?: string
  basePrice?: number
  pricingModel: PricingModel
  currency: string
  minOrderValue?: number
  maxCapacity?: number
  features: string[]
  isActive: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export interface ProviderPortfolio {
  id: number
  providerId: number
  title: string
  description?: string
  eventName?: string
  eventDate?: Date
  eventType?: string
  clientName?: string
  clientTestimonial?: string
  images: string[]
  isFeatured: boolean
  displayOrder: number
  createdAt: Date
}

export interface VendorBooking {
  id: number
  bookingNumber: string
  eventId: number
  tenantId: string
  providerId: number
  serviceId?: number
  bookingDate: Date
  serviceDateFrom: Date
  serviceDateTo: Date
  attendeeCount?: number
  quotedAmount: number
  negotiatedAmount?: number
  finalAmount: number
  currency: string
  commissionRate: number
  commissionAmount: number
  providerPayout: number
  status: BookingStatus
  paymentStatus: PaymentStatus
  termsAndConditions?: string
  specialRequirements?: string
  contractUrl?: string
  signedAt?: Date
  createdBy?: number
  approvedBy?: number
  createdAt: Date
  updatedAt: Date
  // Relations
  event?: any
  provider?: ServiceProvider
  service?: ProviderService
}

export interface SponsorDeal {
  id: number
  dealNumber: string
  eventId: number
  tenantId: string
  sponsorId: number
  sponsorshipTier?: string
  sponsorshipPackage?: string
  benefits: string[]
  deliverables: string[]
  sponsorshipAmount: number
  currency: string
  commissionRate: number
  commissionAmount: number
  sponsorPayout: number
  status: 'PROPOSED' | 'NEGOTIATING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REJECTED'
  paymentStatus: PaymentStatus
  contractUrl?: string
  signedAt?: Date
  visibilityMetrics: Record<string, any>
  createdAt: Date
  updatedAt: Date
  // Relations
  event?: any
  sponsor?: ServiceProvider
}

export interface ExhibitorBooking {
  id: number
  bookingNumber: string
  eventId: number
  tenantId: string
  exhibitorId: number
  boothNumber?: string
  boothSize?: string
  boothType?: string
  boothLocation?: string
  floorPlanPosition?: Record<string, any>
  boothRentalFee: number
  additionalServices: Array<{ name: string; price: number }>
  totalAmount: number
  currency: string
  commissionRate: number
  commissionAmount: number
  exhibitorPayout: number
  status: BookingStatus
  paymentStatus: PaymentStatus
  setupDate?: Date
  teardownDate?: Date
  specialRequirements?: string
  createdAt: Date
  updatedAt: Date
  // Relations
  event?: any
  exhibitor?: ServiceProvider
}

export interface ProviderReview {
  id: number
  providerId: number
  bookingId?: number
  bookingType?: 'VENDOR' | 'SPONSOR' | 'EXHIBITOR'
  tenantId: string
  reviewerId?: number
  overallRating: number
  qualityRating?: number
  communicationRating?: number
  valueRating?: number
  professionalismRating?: number
  reviewTitle?: string
  reviewText?: string
  pros?: string
  cons?: string
  images: string[]
  isVerified: boolean
  isFeatured: boolean
  isPublic: boolean
  providerResponse?: string
  providerResponseDate?: Date
  createdAt: Date
  updatedAt: Date
  // Relations
  provider?: ServiceProvider
  reviewer?: any
}

export interface CommissionTransaction {
  id: number
  transactionNumber: string
  providerId: number
  bookingId?: number
  bookingType?: 'VENDOR' | 'SPONSOR' | 'EXHIBITOR'
  eventId?: number
  tenantId: string
  bookingAmount: number
  commissionRate: number
  commissionAmount: number
  providerPayout: number
  currency: string
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED'
  paymentMethod?: string
  paymentReference?: string
  paymentGatewayFee: number
  paidAt?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
  // Relations
  provider?: ServiceProvider
}

export interface ProviderUser {
  id: number
  providerId: number
  userId: number
  role: ProviderRole
  permissions: string[]
  isActive: boolean
  invitedBy?: number
  invitedAt: Date
  joinedAt?: Date
}

export interface SavedProvider {
  id: number
  tenantId: string
  providerId: number
  savedBy?: number
  notes?: string
  tags: string[]
  createdAt: Date
  // Relations
  provider?: ServiceProvider
}

// API Request/Response Types

export interface CreateProviderRequest {
  providerType: ProviderType
  companyName: string
  email: string
  phone?: string
  website?: string
  city?: string
  state?: string
  country?: string
  description?: string
  yearEstablished?: number
  categories: Array<{ category: string; subcategory?: string; isPrimary?: boolean }>
}

export interface UpdateProviderRequest {
  companyName?: string
  phone?: string
  website?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  description?: string
  yearEstablished?: number
  teamSize?: string
  logoUrl?: string
  bannerUrl?: string
  gallery?: string[]
}

export interface CreateServiceRequest {
  serviceName: string
  description?: string
  basePrice?: number
  pricingModel: PricingModel
  currency?: string
  minOrderValue?: number
  maxCapacity?: number
  features?: string[]
}

export interface CreateBookingRequest {
  eventId: number
  providerId: number
  serviceId?: number
  serviceDateFrom: string
  serviceDateTo: string
  attendeeCount?: number
  quotedAmount: number
  specialRequirements?: string
}

export interface ProviderDashboardStats {
  totalBookings: number
  activeBookings: number
  completedBookings: number
  totalRevenue: number
  pendingPayments: number
  averageRating: number
  totalReviews: number
  responseRate: number
  completionRate: number
  monthlyRevenue: Array<{ month: string; revenue: number }>
  bookingsByStatus: Record<BookingStatus, number>
  topServices: Array<{ serviceName: string; bookings: number; revenue: number }>
}

export interface ProviderMarketplaceFilters {
  providerType?: ProviderType
  category?: string
  city?: string
  minRating?: number
  maxPrice?: number
  minPrice?: number
  availability?: string
  search?: string
  page?: number
  limit?: number
  sortBy?: 'rating' | 'price' | 'reviews' | 'bookings'
  sortOrder?: 'asc' | 'desc'
}

export interface ProviderListResponse {
  providers: ServiceProvider[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Commission Calculation Helper
export interface CommissionCalculation {
  bookingAmount: number
  commissionRate: number
  commissionAmount: number
  paymentGatewayFee: number
  providerPayout: number
  platformRevenue: number
}

export function calculateCommission(
  bookingAmount: number,
  commissionRate: number,
  gatewayFeePercentage: number = 2.5
): CommissionCalculation {
  const commissionAmount = (bookingAmount * commissionRate) / 100
  const paymentGatewayFee = (bookingAmount * gatewayFeePercentage) / 100
  const providerPayout = bookingAmount - commissionAmount - paymentGatewayFee
  const platformRevenue = commissionAmount

  return {
    bookingAmount,
    commissionRate,
    commissionAmount,
    paymentGatewayFee,
    providerPayout,
    platformRevenue
  }
}

// Provider Categories Constants
export const VENDOR_CATEGORIES = {
  CATERING: 'Catering',
  AV_EQUIPMENT: 'AV Equipment',
  DECORATION: 'Decoration',
  PHOTOGRAPHY: 'Photography & Videography',
  SECURITY: 'Security Services',
  TRANSPORTATION: 'Transportation',
  ENTERTAINMENT: 'Entertainment',
  PRINTING: 'Printing & Signage',
  FURNITURE: 'Furniture Rental',
  CLEANING: 'Cleaning Services',
  OTHER: 'Other Services'
} as const

export const SPONSORSHIP_TIERS = {
  TITLE: 'Title Sponsor',
  PLATINUM: 'Platinum',
  GOLD: 'Gold',
  SILVER: 'Silver',
  BRONZE: 'Bronze',
  CUSTOM: 'Custom'
} as const

export const BOOTH_TYPES = {
  STANDARD: 'Standard Booth',
  PREMIUM: 'Premium Booth',
  CORNER: 'Corner Booth',
  ISLAND: 'Island Booth',
  CUSTOM: 'Custom Booth'
} as const

// Default Commission Rates
export const DEFAULT_COMMISSION_RATES = {
  VENDOR: {
    CATERING: 12,
    AV_EQUIPMENT: 15,
    DECORATION: 15,
    PHOTOGRAPHY: 10,
    SECURITY: 8,
    TRANSPORTATION: 10,
    DEFAULT: 15
  },
  SPONSOR: {
    TITLE: 5,
    PLATINUM: 8,
    GOLD: 10,
    SILVER: 12,
    BRONZE: 15,
    DEFAULT: 10
  },
  EXHIBITOR: {
    PREMIUM: 15,
    STANDARD: 20,
    DEFAULT: 18
  }
} as const
