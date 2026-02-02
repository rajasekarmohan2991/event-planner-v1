import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

const SYSTEM_LOOKUPS = [
    {
        name: 'system_role',
        label: 'System Role',
        description: 'Roles defining global system access levels',
        options: ['SUPER_ADMIN', 'USER', 'ADMIN']
    },
    {
        name: 'tenant_role',
        label: 'Tenant Role',
        description: 'Roles within an organization context',
        options: ['TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN', 'SUPPORT_STAFF', 'EXHIBITOR_MANAGER', 'ATTENDEE', 'VIEWER', 'STAFF']
    },
    {
        name: 'tenant_status',
        label: 'Tenant Status',
        description: 'Status of an organization account',
        options: ['ACTIVE', 'SUSPENDED', 'CANCELLED', 'TRIAL']
    },
    {
        name: 'subscription_plan',
        label: 'Subscription Plan',
        description: 'Pricing tiers for tenants',
        options: ['FREE', 'STARTER', 'PRO', 'ENTERPRISE']
    },
    {
        name: 'promo_type',
        label: 'Promo Type',
        description: 'Types of promotional discounts',
        options: ['PERCENT', 'FIXED']
    },
    {
        name: 'verification_status',
        label: 'Verification Status',
        description: 'Status for KYC and Organizer Profile approvals',
        options: ['PENDING', 'APPROVED', 'REJECTED']
    },
    {
        name: 'registration_status',
        label: 'Registration Status',
        description: 'Status of event registrations',
        options: ['PENDING', 'APPROVED', 'DENIED', 'CANCELLED']
    },
    {
        name: 'order_status',
        label: 'Order Status',
        description: 'Payment and processing status of orders',
        options: ['CREATED', 'PAID', 'REFUNDED', 'CANCELLED']
    },
    {
        name: 'ticket_status',
        label: 'Ticket Status',
        description: 'Availability status of tickets',
        options: ['ACTIVE', 'INACTIVE', 'HIDDEN']
    },
    {
        name: 'attendee_status',
        label: 'Attendee Status',
        description: 'Lifecycle status of an attendee',
        options: ['REGISTERED', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED']
    },
    {
        name: 'field_type',
        label: 'Field Type',
        description: 'Data types for custom form fields',
        options: ['TEXT', 'TEXTAREA', 'NUMBER', 'SELECT', 'MULTISELECT', 'DATE', 'EMAIL', 'PHONE', 'CHECKBOX']
    },
    {
        name: 'event_role',
        label: 'Event Role',
        description: 'Roles specific to event management',
        options: ['OWNER', 'ORGANIZER', 'STAFF', 'VIEWER']
    },
    {
        name: 'rsvp_status',
        label: 'RSVP Status',
        description: 'Responses for RSVP events',
        options: ['GOING', 'INTERESTED', 'NOT_GOING', 'YET_TO_RESPOND']
    },
    {
        name: 'booth_type',
        label: 'Booth Type',
        description: 'Categories of exhibitor booths',
        options: ['STANDARD', 'PREMIUM', 'ISLAND', 'CUSTOM']
    },
    {
        name: 'booth_status',
        label: 'Booth Status',
        description: 'Reservation status of floor plan booths',
        options: ['AVAILABLE', 'RESERVED', 'ASSIGNED']
    },
    {
        name: 'asset_kind',
        label: 'Asset Kind',
        description: 'Types of digital assets uploaded',
        options: ['IMAGE', 'DOC', 'URL']
    },
    {
        name: 'site_status',
        label: 'Site Status',
        description: 'Publication status of event websites',
        options: ['DRAFT', 'PUBLISHED']
    },
    {
        name: 'notification_type',
        label: 'Notification Type',
        description: 'Channels for system notifications',
        options: ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH']
    },
    {
        name: 'notification_status',
        label: 'Notification Status',
        description: 'Delivery status of scheduled messages',
        options: ['PENDING', 'SCHEDULED', 'SENT', 'FAILED', 'CANCELLED']
    },
    {
        name: 'notification_trigger',
        label: 'Notification Trigger',
        description: 'Events that trigger automated messages',
        options: ['MANUAL', 'EVENT_REMINDER_1WEEK', 'EVENT_REMINDER_1DAY', 'EVENT_REMINDER_1HOUR', 'POST_EVENT_THANKYOU', 'REGISTRATION_CONFIRMATION', 'PAYMENT_CONFIRMATION', 'CUSTOM']
    },
    {
        name: 'lookup_category',
        label: 'Lookup Category',
        description: 'Meta-category for lookup classifications',
        options: ['EVENT_TYPE', 'EVENT_CATEGORY', 'EVENT_MODE', 'TIMEZONE', 'USER_ROLE']
    },
    {
        name: 'template_for',
        label: 'Template For',
        description: 'Entity types for document templates',
        options: ['VENDOR', 'SPONSOR', 'EXHIBITOR', 'SPEAKER', 'ATTENDEE', 'STAFF']
    },
    {
        name: 'document_type',
        label: 'Document Type',
        description: 'Types of legal documents',
        options: ['TERMS', 'DISCLAIMER', 'CONTRACT', 'AGREEMENT', 'NDA', 'WAIVER']
    },
    {
        name: 'event_type',
        label: 'Event Type',
        description: 'Categories of events',
        options: ['CONFERENCE', 'SEMINAR', 'WORKSHOP', 'WEBINAR', 'MEETUP', 'EXHIBITION', 'TRADE_SHOW', 'CONCERT', 'FESTIVAL', 'SPORTS', 'NETWORKING', 'TRAINING', 'HACKATHON', 'COMPETITION', 'GALA', 'FUNDRAISER', 'OTHER']
    },
    {
        name: 'event_category',
        label: 'Event Category',
        description: 'Industry categories for events',
        options: ['TECHNOLOGY', 'BUSINESS', 'EDUCATION', 'HEALTHCARE', 'FINANCE', 'MARKETING', 'ENTERTAINMENT', 'SPORTS', 'ARTS', 'SCIENCE', 'SOCIAL', 'CHARITY', 'GOVERNMENT', 'OTHER']
    },
    {
        name: 'event_mode',
        label: 'Event Mode',
        description: 'Delivery format of events',
        options: ['IN_PERSON', 'VIRTUAL', 'HYBRID']
    },
    {
        name: 'ticket_type',
        label: 'Ticket Type',
        description: 'Categories of event tickets',
        options: ['GENERAL', 'VIP', 'EARLY_BIRD', 'STUDENT', 'GROUP', 'CORPORATE', 'COMPLIMENTARY', 'PRESS', 'SPEAKER', 'SPONSOR']
    },
    {
        name: 'payment_method',
        label: 'Payment Method',
        description: 'Supported payment options',
        options: ['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'WALLET', 'BANK_TRANSFER', 'CASH', 'CHEQUE']
    },
    {
        name: 'payment_status',
        label: 'Payment Status',
        description: 'Status of payment transactions',
        options: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED']
    },
    {
        name: 'currency',
        label: 'Currency',
        description: 'Supported currencies',
        options: ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED']
    },
    {
        name: 'country',
        label: 'Country',
        description: 'Countries for events and organizations',
        options: ['IN', 'US', 'GB', 'CA', 'AU', 'SG', 'AE', 'DE', 'FR', 'JP', 'CN', 'BR', 'MX', 'ES', 'IT', 'NL', 'SE', 'NO', 'DK', 'FI']
    },
    {
        name: 'timezone',
        label: 'Timezone',
        description: 'Timezones for event scheduling',
        options: ['Asia/Kolkata', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Singapore', 'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland']
    },
    {
        name: 'sponsor_tier',
        label: 'Sponsor Tier',
        description: 'Sponsorship levels',
        options: ['PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'ASSOCIATE', 'PARTNER', 'MEDIA_PARTNER', 'COMMUNITY_PARTNER']
    },
    {
        name: 'speaker_type',
        label: 'Speaker Type',
        description: 'Types of event speakers',
        options: ['KEYNOTE', 'PANELIST', 'MODERATOR', 'WORKSHOP_LEADER', 'PRESENTER', 'MC', 'GUEST']
    },
    {
        name: 'session_type',
        label: 'Session Type',
        description: 'Types of event sessions',
        options: ['KEYNOTE', 'PANEL', 'WORKSHOP', 'BREAKOUT', 'NETWORKING', 'DEMO', 'Q&A', 'LIGHTNING_TALK', 'FIRESIDE_CHAT']
    },
    {
        name: 'venue_type',
        label: 'Venue Type',
        description: 'Categories of event venues',
        options: ['CONFERENCE_CENTER', 'HOTEL', 'AUDITORIUM', 'OUTDOOR', 'STADIUM', 'EXHIBITION_HALL', 'BANQUET_HALL', 'RESTAURANT', 'OFFICE', 'VIRTUAL', 'OTHER']
    },
    {
        name: 'tax_type',
        label: 'Tax Type',
        description: 'Types of taxes applicable',
        options: ['GST', 'VAT', 'SALES_TAX', 'SERVICE_TAX', 'NONE']
    },
    {
        name: 'discount_type',
        label: 'Discount Type',
        description: 'Types of discounts',
        options: ['PERCENTAGE', 'FIXED', 'BUY_X_GET_Y']
    },
    {
        name: 'refund_policy',
        label: 'Refund Policy',
        description: 'Refund policy options',
        options: ['FULL_REFUND', 'PARTIAL_REFUND', 'NO_REFUND', 'CREDIT_NOTE']
    },
    {
        name: 'visibility',
        label: 'Visibility',
        description: 'Event visibility settings',
        options: ['PUBLIC', 'PRIVATE', 'UNLISTED']
    },
    {
        name: 'approval_status',
        label: 'Approval Status',
        description: 'General approval workflow status',
        options: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
    }
]

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any)
        if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        let createdCount = 0

        for (const group of SYSTEM_LOOKUPS) {
            // Upsert Group
            const dbGroup = await prisma.lookupGroup.upsert({
                where: { name: group.name },
                update: { label: group.label, description: group.description },
                create: {
                    name: group.name,
                    label: group.label,
                    description: group.description,
                    isActive: true
                }
            })

            // Upsert Options
            let order = 0
            for (const optionValue of group.options) {
                await prisma.lookupOption.upsert({
                    where: {
                        groupId_value: {
                            groupId: dbGroup.id,
                            value: optionValue
                        }
                    },
                    update: {
                        label: optionValue.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), // Auto-format label
                        isSystem: true, // Mark as system to prevent accidental deletion
                        sortOrder: order
                    },
                    create: {
                        groupId: dbGroup.id,
                        value: optionValue,
                        label: optionValue.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                        sortOrder: order,
                        isSystem: true
                    }
                })
                order++
            }
            createdCount++
        }

        return NextResponse.json({ message: `Successfully seeded ${createdCount} lookup groups.` })

    } catch (error: any) {
        console.error('Seeding lookup failed:', error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
