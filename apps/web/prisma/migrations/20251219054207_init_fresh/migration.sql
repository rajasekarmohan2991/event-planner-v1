-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "TenantRole" AS ENUM ('TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN', 'SUPPORT_STAFF', 'STAFF', 'EXHIBITOR_MANAGER', 'ATTENDEE', 'VIEWER');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CANCELLED', 'TRIAL');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "PromoType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'PAID', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "AttendeeStatus" AS ENUM ('REGISTERED', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'SELECT', 'MULTISELECT', 'DATE', 'EMAIL', 'PHONE', 'CHECKBOX');

-- CreateEnum
CREATE TYPE "EventRole" AS ENUM ('OWNER', 'ORGANIZER', 'STAFF', 'VIEWER');

-- CreateEnum
CREATE TYPE "RSVPStatus" AS ENUM ('GOING', 'INTERESTED', 'NOT_GOING', 'YET_TO_RESPOND');

-- CreateEnum
CREATE TYPE "BoothType" AS ENUM ('STANDARD', 'PREMIUM', 'ISLAND', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BoothStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'ASSIGNED');

-- CreateEnum
CREATE TYPE "AssetKind" AS ENUM ('IMAGE', 'DOC', 'URL');

-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SCHEDULED', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationTrigger" AS ENUM ('MANUAL', 'EVENT_REMINDER_1WEEK', 'EVENT_REMINDER_1DAY', 'EVENT_REMINDER_1HOUR', 'POST_EVENT_THANKYOU', 'REGISTRATION_CONFIRMATION', 'PAYMENT_CONFIRMATION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "LookupCategory" AS ENUM ('EVENT_TYPE', 'EVENT_CATEGORY', 'EVENT_MODE', 'TIMEZONE', 'USER_ROLE');

-- CreateEnum
CREATE TYPE "PricingTier" AS ENUM ('VIP', 'PREMIUM', 'GENERAL');

-- CreateEnum
CREATE TYPE "FloorPlanObjectType" AS ENUM ('GRID', 'ROUND_TABLE', 'STANDING', 'STAGE', 'ENTRY', 'EXIT', 'RESTROOM', 'BAR', 'VIP_LOUNGE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FloorPlanStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MEN', 'WOMEN', 'MIXED');

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" BIGINT,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "password_hash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "image" TEXT,
    "selected_city" TEXT,
    "current_tenant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "domain" TEXT,
    "logo" TEXT,
    "primaryColor" TEXT DEFAULT '#3B82F6',
    "secondaryColor" TEXT DEFAULT '#10B981',
    "faviconUrl" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "dateFormat" TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'TRIAL',
    "billingEmail" TEXT,
    "maxEvents" INTEGER NOT NULL DEFAULT 10,
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "maxStorage" INTEGER NOT NULL DEFAULT 1024,
    "trialEndsAt" TIMESTAMP(3),
    "subscriptionStartedAt" TIMESTAMP(3),
    "subscriptionEndsAt" TIMESTAMP(3),
    "emailFromName" TEXT,
    "emailFromAddress" TEXT,
    "emailReplyTo" TEXT,
    "features" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_members" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "permissions" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "invitedBy" BIGINT,
    "invitedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    "lastAccessAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" BIGSERIAL NOT NULL,
    "event_id" BIGINT NOT NULL,
    "code" TEXT NOT NULL,
    "discount_type" TEXT NOT NULL DEFAULT 'PERCENT',
    "discount_amount" INTEGER NOT NULL,
    "max_uses" INTEGER NOT NULL DEFAULT -1,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "max_uses_per_user" INTEGER NOT NULL DEFAULT 1,
    "min_order_amount" INTEGER NOT NULL DEFAULT 0,
    "applicable_ticket_ids" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyValue" (
    "id" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeyValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizerProfile" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "companyName" TEXT NOT NULL,
    "croNumber" TEXT NOT NULL,
    "croData" JSONB,
    "riskFlags" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndividualVerification" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "idType" TEXT NOT NULL,
    "docUrl" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndividualVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "event_id" BIGINT NOT NULL,
    "user_id" BIGINT,
    "email" TEXT,
    "ticket_id" TEXT,
    "price_inr" INTEGER,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approval_mode" TEXT,
    "approval_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" TEXT,
    "data_json" JSONB,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "check_in_status" TEXT,
    "check_in_time" TIMESTAMP(3),

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" BIGINT,
    "email" TEXT,
    "buyerEmail" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "totalInr" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceInr" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "status" "TicketStatus" NOT NULL DEFAULT 'ACTIVE',
    "min_quantity" INTEGER,
    "max_quantity" INTEGER,
    "sales_start_at" TIMESTAMP(3),
    "sales_end_at" TIMESTAMP(3),
    "allowed_user_types" TEXT,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancellationPolicy" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "freeWindowHours" INTEGER NOT NULL DEFAULT 0,
    "feeType" TEXT NOT NULL DEFAULT 'PERCENT',
    "feeValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cutoffHours" INTEGER NOT NULL DEFAULT 0,
    "policyText" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT,

    CONSTRAINT "CancellationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissedRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "email" TEXT,
    "step" TEXT,
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT,

    CONSTRAINT "MissedRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendee" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" BIGINT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "ticketId" TEXT,
    "status" "AttendeeStatus" NOT NULL DEFAULT 'REGISTERED',
    "answersJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,

    CONSTRAINT "Attendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomField" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "FieldType" NOT NULL DEFAULT 'TEXT',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "helpText" TEXT,
    "options" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRoleAssignment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "role" "EventRole" NOT NULL,
    "siteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT,

    CONSTRAINT "EventRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RSVP" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" BIGINT,
    "email" TEXT,
    "status" "RSVPStatus" NOT NULL DEFAULT 'INTERESTED',
    "waitlisted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT,

    CONSTRAINT "RSVP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RSVPSettings" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "maxAttendees" INTEGER NOT NULL DEFAULT 0,
    "openAt" TIMESTAMP(3),
    "closeAt" TIMESTAMP(3),
    "questions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,

    CONSTRAINT "RSVPSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RsvpGuest" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "status" "RSVPStatus" NOT NULL DEFAULT 'YET_TO_RESPOND',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "tenantId" TEXT,

    CONSTRAINT "RsvpGuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationSettings" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "timeLimitMinutes" INTEGER NOT NULL DEFAULT 15,
    "noTimeLimit" BOOLEAN NOT NULL DEFAULT false,
    "allowTransfer" BOOLEAN NOT NULL DEFAULT false,
    "allowAppleWallet" BOOLEAN NOT NULL DEFAULT true,
    "showTicketAvailability" BOOLEAN NOT NULL DEFAULT false,
    "restrictDuplicates" TEXT NOT NULL DEFAULT 'event',
    "registrationApproval" BOOLEAN NOT NULL DEFAULT false,
    "cancellationApproval" BOOLEAN NOT NULL DEFAULT false,
    "allowCheckinUnpaidOffline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exhibitors" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "prefix" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "preferred_pronouns" TEXT,
    "work_phone" TEXT,
    "cell_phone" TEXT,
    "job_title" TEXT,
    "company" TEXT,
    "business_address" TEXT,
    "company_description" TEXT,
    "products_services" TEXT,
    "booth_type" TEXT,
    "staff_list" TEXT,
    "competitors" TEXT,
    "booth_option" TEXT,
    "booth_number" TEXT,
    "booth_area" TEXT,
    "electrical_access" BOOLEAN NOT NULL DEFAULT false,
    "display_tables" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    "email_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmation_token" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "admin_approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_amount" DECIMAL(10,2),
    "payment_method" TEXT,
    "payment_reference" TEXT,
    "paid_at" TIMESTAMP(3),
    "booth_allocated" BOOLEAN NOT NULL DEFAULT false,
    "allocated_by" TEXT,
    "allocated_at" TIMESTAMP(3),
    "qr_code" TEXT,
    "qr_code_data" TEXT,
    "check_in_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" TEXT,

    CONSTRAINT "exhibitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booths" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "exhibitor_id" TEXT,
    "booth_number" TEXT NOT NULL,
    "size_sqm" INTEGER NOT NULL DEFAULT 9,
    "type" "BoothType" NOT NULL DEFAULT 'STANDARD',
    "status" "BoothStatus" NOT NULL DEFAULT 'AVAILABLE',
    "price_inr" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" TEXT,

    CONSTRAINT "booths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booth_assets" (
    "id" TEXT NOT NULL,
    "booth_id" TEXT NOT NULL,
    "kind" "AssetKind" NOT NULL DEFAULT 'URL',
    "url" TEXT NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" TEXT,

    CONSTRAINT "booth_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_budgets" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "budgeted" DECIMAL(10,2) NOT NULL,
    "spent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "remaining" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" TEXT,

    CONSTRAINT "event_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_vendors" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "contract_amount" DECIMAL(10,2) NOT NULL,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "contract_url" TEXT,
    "invoice_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" TEXT,

    CONSTRAINT "event_vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSite" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "SiteStatus" NOT NULL DEFAULT 'DRAFT',
    "themeId" TEXT NOT NULL DEFAULT 'glow',
    "draftJson" JSONB,
    "publishedJson" JSONB,
    "seoJson" JSONB,
    "integrationsJson" JSONB,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,

    CONSTRAINT "EventSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" BIGSERIAL NOT NULL,
    "event_id" BIGINT NOT NULL,
    "tenant_id" VARCHAR(255),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMPTZ(6) NOT NULL,
    "end_time" TIMESTAMPTZ(6) NOT NULL,
    "room" VARCHAR(255),
    "track" VARCHAR(255),
    "capacity" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledNotification" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "trigger" "NotificationTrigger" NOT NULL DEFAULT 'MANUAL',
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "htmlContent" TEXT,
    "recipientFilter" JSONB,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "campaignId" TEXT,
    "createdById" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,

    CONSTRAINT "ScheduledNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "scheduledNotificationId" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "recipientUserId" BIGINT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalDelivered" INTEGER NOT NULL DEFAULT 0,
    "totalOpened" INTEGER NOT NULL DEFAULT 0,
    "totalClicked" INTEGER NOT NULL DEFAULT 0,
    "totalBounced" INTEGER NOT NULL DEFAULT 0,
    "totalUnsubscribed" INTEGER NOT NULL DEFAULT 0,
    "createdById" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lookup" (
    "id" TEXT NOT NULL,
    "category" "LookupCategory" NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "colorCode" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,

    CONSTRAINT "Lookup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBanner" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "imageData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,

    CONSTRAINT "EventBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "userId" BIGINT,
    "userName" TEXT,
    "userEmail" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityName" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" TEXT,

    CONSTRAINT "lookup_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lookup_options" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" TEXT,

    CONSTRAINT "lookup_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "sidebarCollapsed" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "preferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_queue" (
    "id" TEXT NOT NULL,
    "eventId" BIGINT NOT NULL,
    "userId" BIGINT,
    "action" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offline_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_drafts" (
    "id" TEXT NOT NULL,
    "eventId" BIGINT NOT NULL,
    "userId" BIGINT,
    "sessionId" TEXT,
    "type" TEXT NOT NULL,
    "formData" JSONB NOT NULL,
    "ticketPrice" DOUBLE PRECISION,
    "promoCode" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geocoding_cache" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geocoding_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notifications" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_invites" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invitedBy" BIGINT NOT NULL,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "team_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_posts" (
    "id" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feed_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_likes" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feed_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rsvp_responses" (
    "id" TEXT NOT NULL,
    "rsvpId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rsvp_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "venue" TEXT,
    "address" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "price_inr" INTEGER,
    "banner_url" TEXT,
    "category" TEXT,
    "event_mode" TEXT NOT NULL,
    "budget_inr" INTEGER,
    "expected_attendees" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" TEXT,
    "terms_and_conditions" TEXT,
    "disclaimer" TEXT,
    "event_manager_name" TEXT,
    "event_manager_contact" TEXT,
    "event_manager_email" TEXT,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speakers" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "photo_url" TEXT,
    "email" TEXT,
    "linkedin" TEXT,
    "twitter" TEXT,
    "website" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" TEXT,
    "event_id" BIGINT NOT NULL,

    CONSTRAINT "speakers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_speakers" (
    "id" BIGSERIAL NOT NULL,
    "session_id" BIGINT NOT NULL,
    "speaker_id" BIGINT NOT NULL,

    CONSTRAINT "session_speakers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" BIGSERIAL NOT NULL,
    "event_id" BIGINT NOT NULL,
    "session_id" BIGINT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor_plan_configs" (
    "id" BIGSERIAL NOT NULL,
    "event_id" BIGINT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "layout_data" JSONB NOT NULL,
    "total_seats" INTEGER NOT NULL DEFAULT 0,
    "sections" JSONB NOT NULL DEFAULT '[]',
    "tenant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "floor_plan_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat_inventory" (
    "id" BIGSERIAL NOT NULL,
    "event_id" BIGINT NOT NULL,
    "section" TEXT NOT NULL,
    "row_number" TEXT NOT NULL,
    "seat_number" TEXT NOT NULL,
    "seat_type" TEXT NOT NULL DEFAULT 'STANDARD',
    "base_price" INTEGER NOT NULL DEFAULT 0,
    "x_coordinate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "y_coordinate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_reserved" BOOLEAN NOT NULL DEFAULT false,
    "reserved_by" BIGINT,
    "reserved_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "tenant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seat_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat_pricing_rules" (
    "id" BIGSERIAL NOT NULL,
    "event_id" BIGINT NOT NULL,
    "section" TEXT,
    "row_pattern" TEXT,
    "seat_type" TEXT,
    "base_price" INTEGER NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seat_pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seat_reservations" (
    "id" TEXT NOT NULL,
    "event_id" BIGINT NOT NULL,
    "seat_id" BIGINT NOT NULL,
    "user_id" BIGINT,
    "user_email" TEXT,
    "registration_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" TEXT,

    CONSTRAINT "seat_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_access_matrix" (
    "id" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT false,
    "can_create" BOOLEAN NOT NULL DEFAULT false,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_access_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor_plans" (
    "id" TEXT NOT NULL,
    "eventId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "canvasWidth" INTEGER NOT NULL DEFAULT 1200,
    "canvasHeight" INTEGER NOT NULL DEFAULT 800,
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "gridSize" INTEGER NOT NULL DEFAULT 20,
    "vipPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "premiumPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "generalPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalCapacity" INTEGER NOT NULL DEFAULT 0,
    "vipCapacity" INTEGER NOT NULL DEFAULT 0,
    "premiumCapacity" INTEGER NOT NULL DEFAULT 0,
    "generalCapacity" INTEGER NOT NULL DEFAULT 0,
    "menCapacity" INTEGER NOT NULL DEFAULT 0,
    "womenCapacity" INTEGER NOT NULL DEFAULT 0,
    "layoutData" JSONB,
    "status" "FloorPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tenant_id" TEXT,

    CONSTRAINT "floor_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor_plan_objects" (
    "id" TEXT NOT NULL,
    "floor_plan_id" TEXT NOT NULL,
    "type" "FloorPlanObjectType" NOT NULL,
    "sub_type" TEXT,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rows" INTEGER,
    "cols" INTEGER,
    "seats_per_row" INTEGER,
    "total_seats" INTEGER NOT NULL DEFAULT 0,
    "pricing_tier" "PricingTier",
    "price_per_seat" DECIMAL(10,2),
    "gender" "Gender",
    "fill_color" TEXT NOT NULL DEFAULT '#3b82f6',
    "stroke_color" TEXT NOT NULL DEFAULT '#1e40af',
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "label" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "floor_plan_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "from_currency" TEXT NOT NULL,
    "to_currency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_subdomain_key" ON "tenants"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE INDEX "tenants_plan_idx" ON "tenants"("plan");

-- CreateIndex
CREATE INDEX "tenant_members_userId_idx" ON "tenant_members"("userId");

-- CreateIndex
CREATE INDEX "tenant_members_tenantId_role_idx" ON "tenant_members"("tenantId", "role");

-- CreateIndex
CREATE INDEX "tenant_members_tenantId_status_idx" ON "tenant_members"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_members_tenantId_userId_key" ON "tenant_members"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateIndex
CREATE INDEX "idx_promo_codes_event" ON "promo_codes"("event_id");

-- CreateIndex
CREATE INDEX "idx_promo_codes_code" ON "promo_codes"("code");

-- CreateIndex
CREATE INDEX "idx_promo_codes_active" ON "promo_codes"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "KeyValue_namespace_key_key" ON "KeyValue"("namespace", "key");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerProfile_userId_key" ON "OrganizerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "IndividualVerification_userId_key" ON "IndividualVerification"("userId");

-- CreateIndex
CREATE INDEX "registrations_event_id_status_created_at_idx" ON "registrations"("event_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "Order_eventId_status_createdAt_idx" ON "Order"("eventId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_eventId_paymentStatus_idx" ON "Order"("eventId", "paymentStatus");

-- CreateIndex
CREATE INDEX "Order_tenantId_idx" ON "Order"("tenantId");

-- CreateIndex
CREATE INDEX "Ticket_eventId_status_idx" ON "Ticket"("eventId", "status");

-- CreateIndex
CREATE INDEX "Ticket_tenantId_idx" ON "Ticket"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CancellationPolicy_eventId_key" ON "CancellationPolicy"("eventId");

-- CreateIndex
CREATE INDEX "MissedRegistration_eventId_createdAt_idx" ON "MissedRegistration"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "Prospect_eventId_email_idx" ON "Prospect"("eventId", "email");

-- CreateIndex
CREATE INDEX "Attendee_eventId_status_idx" ON "Attendee"("eventId", "status");

-- CreateIndex
CREATE INDEX "Attendee_eventId_email_idx" ON "Attendee"("eventId", "email");

-- CreateIndex
CREATE INDEX "Attendee_tenantId_idx" ON "Attendee"("tenantId");

-- CreateIndex
CREATE INDEX "CustomField_eventId_order_idx" ON "CustomField"("eventId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "CustomField_eventId_key_key" ON "CustomField"("eventId", "key");

-- CreateIndex
CREATE INDEX "EventRoleAssignment_eventId_role_idx" ON "EventRoleAssignment"("eventId", "role");

-- CreateIndex
CREATE INDEX "EventRoleAssignment_siteId_idx" ON "EventRoleAssignment"("siteId");

-- CreateIndex
CREATE INDEX "EventRoleAssignment_tenantId_idx" ON "EventRoleAssignment"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRoleAssignment_eventId_userId_key" ON "EventRoleAssignment"("eventId", "userId");

-- CreateIndex
CREATE INDEX "RSVP_eventId_status_idx" ON "RSVP"("eventId", "status");

-- CreateIndex
CREATE INDEX "RSVP_tenantId_idx" ON "RSVP"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "RSVP_eventId_userId_key" ON "RSVP"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RSVPSettings_eventId_key" ON "RSVPSettings"("eventId");

-- CreateIndex
CREATE INDEX "RsvpGuest_eventId_status_createdAt_idx" ON "RsvpGuest"("eventId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "RsvpGuest_eventId_email_idx" ON "RsvpGuest"("eventId", "email");

-- CreateIndex
CREATE INDEX "RsvpGuest_tenantId_idx" ON "RsvpGuest"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationSettings_eventId_key" ON "RegistrationSettings"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "exhibitors_confirmation_token_key" ON "exhibitors"("confirmation_token");

-- CreateIndex
CREATE UNIQUE INDEX "exhibitors_check_in_code_key" ON "exhibitors"("check_in_code");

-- CreateIndex
CREATE INDEX "exhibitors_event_id_name_idx" ON "exhibitors"("event_id", "name");

-- CreateIndex
CREATE INDEX "booths_event_id_booth_number_idx" ON "booths"("event_id", "booth_number");

-- CreateIndex
CREATE INDEX "booths_exhibitor_id_idx" ON "booths"("exhibitor_id");

-- CreateIndex
CREATE INDEX "booth_assets_booth_id_idx" ON "booth_assets"("booth_id");

-- CreateIndex
CREATE INDEX "event_budgets_event_id_category_idx" ON "event_budgets"("event_id", "category");

-- CreateIndex
CREATE INDEX "event_vendors_event_id_category_idx" ON "event_vendors"("event_id", "category");

-- CreateIndex
CREATE INDEX "event_vendors_payment_status_idx" ON "event_vendors"("payment_status");

-- CreateIndex
CREATE UNIQUE INDEX "EventSite_eventId_key" ON "EventSite"("eventId");

-- CreateIndex
CREATE INDEX "ScheduledNotification_eventId_status_scheduledFor_idx" ON "ScheduledNotification"("eventId", "status", "scheduledFor");

-- CreateIndex
CREATE INDEX "ScheduledNotification_campaignId_idx" ON "ScheduledNotification"("campaignId");

-- CreateIndex
CREATE INDEX "ScheduledNotification_tenantId_idx" ON "ScheduledNotification"("tenantId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_scheduledNotificationId_status_idx" ON "NotificationDelivery"("scheduledNotificationId", "status");

-- CreateIndex
CREATE INDEX "NotificationDelivery_recipientEmail_idx" ON "NotificationDelivery"("recipientEmail");

-- CreateIndex
CREATE INDEX "NotificationDelivery_recipientUserId_idx" ON "NotificationDelivery"("recipientUserId");

-- CreateIndex
CREATE INDEX "EmailCampaign_eventId_createdAt_idx" ON "EmailCampaign"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailCampaign_tenantId_idx" ON "EmailCampaign"("tenantId");

-- CreateIndex
CREATE INDEX "Lookup_category_isActive_sortOrder_idx" ON "Lookup"("category", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Lookup_tenantId_idx" ON "Lookup"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Lookup_category_code_key" ON "Lookup"("category", "code");

-- CreateIndex
CREATE INDEX "EventBanner_eventId_idx" ON "EventBanner"("eventId");

-- CreateIndex
CREATE INDEX "EventBanner_tenantId_idx" ON "EventBanner"("tenantId");

-- CreateIndex
CREATE INDEX "activities_userId_idx" ON "activities"("userId");

-- CreateIndex
CREATE INDEX "activities_entityType_idx" ON "activities"("entityType");

-- CreateIndex
CREATE INDEX "activities_createdAt_idx" ON "activities"("createdAt");

-- CreateIndex
CREATE INDEX "activities_tenantId_idx" ON "activities"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_groups_name_key" ON "lookup_groups"("name");

-- CreateIndex
CREATE INDEX "lookup_groups_tenant_id_idx" ON "lookup_groups"("tenant_id");

-- CreateIndex
CREATE INDEX "lookup_options_group_id_idx" ON "lookup_options"("group_id");

-- CreateIndex
CREATE INDEX "lookup_options_tenant_id_idx" ON "lookup_options"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "lookup_options_group_id_value_key" ON "lookup_options"("group_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_preferences_userId_idx" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "offline_queue_idempotencyKey_key" ON "offline_queue"("idempotencyKey");

-- CreateIndex
CREATE INDEX "offline_queue_eventId_idx" ON "offline_queue"("eventId");

-- CreateIndex
CREATE INDEX "offline_queue_userId_idx" ON "offline_queue"("userId");

-- CreateIndex
CREATE INDEX "offline_queue_status_idx" ON "offline_queue"("status");

-- CreateIndex
CREATE INDEX "offline_queue_idempotencyKey_idx" ON "offline_queue"("idempotencyKey");

-- CreateIndex
CREATE INDEX "registration_drafts_eventId_idx" ON "registration_drafts"("eventId");

-- CreateIndex
CREATE INDEX "registration_drafts_userId_idx" ON "registration_drafts"("userId");

-- CreateIndex
CREATE INDEX "registration_drafts_sessionId_idx" ON "registration_drafts"("sessionId");

-- CreateIndex
CREATE INDEX "registration_drafts_expiresAt_idx" ON "registration_drafts"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "geocoding_cache_city_key" ON "geocoding_cache"("city");

-- CreateIndex
CREATE INDEX "geocoding_cache_city_idx" ON "geocoding_cache"("city");

-- CreateIndex
CREATE INDEX "user_notifications_userId_idx" ON "user_notifications"("userId");

-- CreateIndex
CREATE INDEX "user_notifications_isRead_idx" ON "user_notifications"("isRead");

-- CreateIndex
CREATE INDEX "user_notifications_createdAt_idx" ON "user_notifications"("createdAt");

-- CreateIndex
CREATE INDEX "team_invites_tenantId_idx" ON "team_invites"("tenantId");

-- CreateIndex
CREATE INDEX "team_invites_email_idx" ON "team_invites"("email");

-- CreateIndex
CREATE INDEX "team_invites_status_idx" ON "team_invites"("status");

-- CreateIndex
CREATE INDEX "feed_posts_userId_idx" ON "feed_posts"("userId");

-- CreateIndex
CREATE INDEX "feed_posts_tenantId_idx" ON "feed_posts"("tenantId");

-- CreateIndex
CREATE INDEX "feed_posts_createdAt_idx" ON "feed_posts"("createdAt");

-- CreateIndex
CREATE INDEX "feed_likes_postId_idx" ON "feed_likes"("postId");

-- CreateIndex
CREATE INDEX "feed_likes_userId_idx" ON "feed_likes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "feed_likes_postId_userId_key" ON "feed_likes"("postId", "userId");

-- CreateIndex
CREATE INDEX "feed_comments_postId_idx" ON "feed_comments"("postId");

-- CreateIndex
CREATE INDEX "feed_comments_userId_idx" ON "feed_comments"("userId");

-- CreateIndex
CREATE INDEX "rsvp_responses_rsvpId_idx" ON "rsvp_responses"("rsvpId");

-- CreateIndex
CREATE INDEX "events_tenant_id_starts_at_idx" ON "events"("tenant_id", "starts_at");

-- CreateIndex
CREATE INDEX "events_tenant_id_status_idx" ON "events"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "events_starts_at_idx" ON "events"("starts_at");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "speakers_tenant_id_idx" ON "speakers"("tenant_id");

-- CreateIndex
CREATE INDEX "speakers_event_id_idx" ON "speakers"("event_id");

-- CreateIndex
CREATE INDEX "session_speakers_speaker_id_idx" ON "session_speakers"("speaker_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_speakers_session_id_speaker_id_key" ON "session_speakers"("session_id", "speaker_id");

-- CreateIndex
CREATE INDEX "calendar_events_event_id_idx" ON "calendar_events"("event_id");

-- CreateIndex
CREATE INDEX "floor_plan_configs_event_id_idx" ON "floor_plan_configs"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "floor_plan_configs_event_id_plan_name_key" ON "floor_plan_configs"("event_id", "plan_name");

-- CreateIndex
CREATE INDEX "seat_inventory_event_id_status_idx" ON "seat_inventory"("event_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "seat_inventory_event_id_section_row_number_seat_number_key" ON "seat_inventory"("event_id", "section", "row_number", "seat_number");

-- CreateIndex
CREATE INDEX "seat_pricing_rules_event_id_idx" ON "seat_pricing_rules"("event_id");

-- CreateIndex
CREATE INDEX "seat_reservations_event_id_status_idx" ON "seat_reservations"("event_id", "status");

-- CreateIndex
CREATE INDEX "seat_reservations_seat_id_idx" ON "seat_reservations"("seat_id");

-- CreateIndex
CREATE INDEX "seat_reservations_expires_at_idx" ON "seat_reservations"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "module_access_matrix_module_name_role_key" ON "module_access_matrix"("module_name", "role");

-- CreateIndex
CREATE INDEX "floor_plans_eventId_idx" ON "floor_plans"("eventId");

-- CreateIndex
CREATE INDEX "floor_plans_tenant_id_idx" ON "floor_plans"("tenant_id");

-- CreateIndex
CREATE INDEX "floor_plan_objects_floor_plan_id_idx" ON "floor_plan_objects"("floor_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_from_currency_to_currency_key" ON "exchange_rates"("from_currency", "to_currency");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerProfile" ADD CONSTRAINT "OrganizerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndividualVerification" ADD CONSTRAINT "IndividualVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRoleAssignment" ADD CONSTRAINT "EventRoleAssignment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "EventSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booths" ADD CONSTRAINT "booths_exhibitor_id_fkey" FOREIGN KEY ("exhibitor_id") REFERENCES "exhibitors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booth_assets" ADD CONSTRAINT "booth_assets_booth_id_fkey" FOREIGN KEY ("booth_id") REFERENCES "booths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_scheduledNotificationId_fkey" FOREIGN KEY ("scheduledNotificationId") REFERENCES "ScheduledNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lookup_options" ADD CONSTRAINT "lookup_options_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "lookup_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_likes" ADD CONSTRAINT "feed_likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "feed_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_likes" ADD CONSTRAINT "feed_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_comments" ADD CONSTRAINT "feed_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "feed_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_comments" ADD CONSTRAINT "feed_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvp_responses" ADD CONSTRAINT "rsvp_responses_rsvpId_fkey" FOREIGN KEY ("rsvpId") REFERENCES "RSVP"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speakers" ADD CONSTRAINT "speakers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_speakers" ADD CONSTRAINT "session_speakers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_speakers" ADD CONSTRAINT "session_speakers_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "speakers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floor_plan_objects" ADD CONSTRAINT "floor_plan_objects_floor_plan_id_fkey" FOREIGN KEY ("floor_plan_id") REFERENCES "floor_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
