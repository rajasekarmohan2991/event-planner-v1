// Comprehensive Sponsor Form - TypeScript Interfaces

export interface ContactData {
    contactName: string
    designation: string
    email: string
    phone: string
    whatsapp?: string
    alternateContact?: string
}

export interface PaymentData {
    paymentMode: 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE' | 'CASH' | 'UPI'
    paymentStatus: 'PENDING' | 'PAID' | 'PARTIAL'
    invoiceRequired: boolean
    amount?: number
    amountPaid?: number
    balanceAmount?: number
    paymentDueDate?: string
    transactionId?: string
}

export interface BrandingOnline {
    websiteLogo: {
        enabled: boolean
        placement?: 'HEADER' | 'FOOTER' | 'SPONSORS_PAGE' | 'ALL'
    }
    socialMedia: {
        enabled: boolean
        postCount?: number
        platforms?: string[] // ['Facebook', 'Instagram', 'LinkedIn', 'Twitter']
    }
    emailCampaign: {
        enabled: boolean
        mentionCount?: number
    }
}

export interface BrandingOffline {
    stageBackdrop: boolean
    standee: {
        enabled: boolean
        size?: string // '6x4 ft', '8x6 ft', etc.
    }
    booth: {
        required: boolean
        size?: string
    }
    entryGateBranding: boolean
    banners: {
        enabled: boolean
        count?: number
        locations?: string
    }
}

export interface EventPresence {
    boothRequired: boolean
    boothSize?: string
    staffCount: number
    stageMentions: boolean
    speakingSlot: 'KEYNOTE' | 'PANEL' | 'NONE'
    productLaunch: boolean
    productDemo: boolean
    setupRequirements?: string
}

export interface GiveawayData {
    type: 'COUPONS' | 'PRODUCTS' | 'MERCHANDISE' | 'NONE'
    quantity?: number
    distributionMethod?: 'WELCOME_KIT' | 'LUCKY_DRAW' | 'BOOTH' | 'OTHER'
    estimatedValue?: number
    deliveryDate?: string
    description?: string
}

export interface LegalData {
    contractSigned: boolean
    logoUsageApproval: boolean
    brandCompliance?: string
    ndaRequired: boolean
    cancellationPolicyAccepted: boolean
    contractUrl?: string
    signedDate?: string
}

export interface TimelineData {
    logoSubmissionDeadline?: string
    paymentDueDate?: string
    creativeApprovalDate?: string
    setupDate?: string
    setupTime?: string
    eventDayAccessTime?: string
}

export interface PostEventData {
    leadsReportRequired: boolean
    photoVideoAccess: boolean
    socialMediaMentionsCount: number
    performanceReportRequired: boolean
    feedbackRequired: boolean
    testimonialRequired: boolean
}

export interface ComprehensiveSponsor {
    id?: string
    name: string
    tier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'PARTNER'
    amount: number
    logoUrl?: string
    website?: string

    // New comprehensive fields
    contactData?: ContactData
    paymentData?: PaymentData
    brandingOnline?: BrandingOnline
    brandingOffline?: BrandingOffline
    eventPresence?: EventPresence
    giveawayData?: GiveawayData
    legalData?: LegalData
    timelineData?: TimelineData
    postEventData?: PostEventData

    createdAt?: string
    updatedAt?: string
}

// Form validation helper
export function validateSponsorForm(data: Partial<ComprehensiveSponsor>): string[] {
    const errors: string[] = []

    if (!data.name?.trim()) errors.push('Company name is required')
    if (!data.tier) errors.push('Sponsor tier is required')

    // Contact validation
    if (data.contactData) {
        if (!data.contactData.contactName?.trim()) errors.push('Contact name is required')
        if (!data.contactData.email?.trim()) errors.push('Contact email is required')
        if (data.contactData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactData.email)) {
            errors.push('Invalid email format')
        }
        if (!data.contactData.phone?.trim()) errors.push('Contact phone is required')
    }

    // Payment validation
    if (data.paymentData) {
        if (!data.paymentData.paymentMode) errors.push('Payment mode is required')
        if (!data.paymentData.paymentStatus) errors.push('Payment status is required')
    }

    return errors
}
