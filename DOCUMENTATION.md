# Event Planner V1 - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Features & Modules](#features--modules)
6. [API Endpoints](#api-endpoints)
7. [User Roles & Permissions](#user-roles--permissions)
8. [Installation & Setup](#installation--setup)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)
11. [Development Guide](#development-guide)

---

## Overview

**Event Planner V1** is a comprehensive event management platform that enables organizers to create, manage, and execute events with features including:

- Event creation and management
- Ticket sales and registration
- Floor plan design with seat selection
- QR code-based check-in system
- Exhibitor management
- Payment processing (Razorpay & Stripe)
- SMS and WhatsApp notifications
- Multi-tenant architecture
- Role-based access control

### Key Capabilities

- **For Organizers**: Create events, manage registrations, design floor plans, track attendance
- **For Attendees**: Browse events, register, select seats, receive QR codes, get notifications
- **For Exhibitors**: Register for booth space, make payments, manage booth details
- **For Admins**: Manage users, tenants, system settings, analytics

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pages   │  │Components│  │  Hooks   │  │  Utils   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                   API Layer (Next.js API Routes)             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Events  │  │  Users   │  │ Payments │  │ Exhibitors│  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ Prisma ORM
┌─────────────────────────────────────────────────────────────┐
│              Database (PostgreSQL - Supabase)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Events  │  │  Users   │  │  Orders  │  │Floor Plans│  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy Architecture

The application uses a **shared database, shared schema** multi-tenancy model:

- Each tenant has a unique `tenant_id`
- Prisma middleware automatically filters queries by `tenant_id`
- Tenant isolation is enforced at the database level
- Default tenant: `default-tenant`

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **State Management**: React Hooks
- **Forms**: React Hook Form
- **Notifications**: Sonner (Toast)

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Next.js API Routes
- **ORM**: Prisma 5.22.0
- **Database**: PostgreSQL (Supabase)
- **Authentication**: NextAuth.js
- **File Upload**: Uploadthing

### External Services
- **Database Hosting**: Supabase
- **Deployment**: Vercel
- **Payment Gateways**: 
  - Razorpay (India)
  - Stripe (International)
- **SMS**: Twilio / MSG91
- **WhatsApp**: Twilio WhatsApp API
- **Email**: Nodemailer / SendGrid
- **QR Code**: qrcode library
- **QR Scanner**: @zxing/library

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Git Hooks**: Husky
- **Version Control**: Git

---

## Database Schema

### Core Tables

#### 1. **users**
Stores user account information.

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  city TEXT,
  system_role TEXT, -- SUPER_ADMIN, ADMIN, USER
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. **tenants**
Multi-tenant organization data.

```sql
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  domain TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. **events**
Event information.

```sql
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  venue TEXT,
  city TEXT,
  max_capacity INTEGER,
  status TEXT, -- DRAFT, PUBLISHED, CANCELLED
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. **registrations**
Event registrations/attendees.

```sql
CREATE TABLE registrations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event_id BIGINT NOT NULL,
  user_id TEXT,
  email TEXT NOT NULL,
  type TEXT, -- GENERAL, VIP, EXHIBITOR
  status TEXT, -- PENDING, APPROVED, REJECTED
  check_in_status TEXT, -- NOT_CHECKED_IN, CHECKED_IN
  check_in_time TIMESTAMP,
  data_json JSONB, -- Stores form data
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. **floor_plans**
Seating layout designs.

```sql
CREATE TABLE floor_plans (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  layout_data JSONB, -- Canvas objects
  canvas_width INTEGER,
  canvas_height INTEGER,
  total_capacity INTEGER,
  vip_capacity INTEGER,
  premium_capacity INTEGER,
  general_capacity INTEGER,
  vip_price DECIMAL,
  premium_price DECIMAL,
  general_price DECIMAL,
  status TEXT, -- DRAFT, ACTIVE
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. **exhibitors**
Exhibitor/vendor registrations.

```sql
CREATE TABLE exhibitors (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event_id BIGINT NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  booth_number TEXT,
  booth_type TEXT,
  booth_size TEXT,
  status TEXT, -- PENDING_APPROVAL, APPROVED, ALLOCATED
  payment_status TEXT, -- PENDING, COMPLETED
  payment_amount DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. **tickets**
Ticket types for events.

```sql
CREATE TABLE tickets (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_in_minor INTEGER, -- Price in smallest currency unit
  quantity_total INTEGER,
  quantity_sold INTEGER DEFAULT 0,
  sale_start TIMESTAMP,
  sale_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 8. **orders**
Payment orders.

```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  event_id BIGINT,
  amount_in_minor INTEGER,
  currency TEXT DEFAULT 'INR',
  status TEXT, -- PENDING, COMPLETED, FAILED
  payment_gateway TEXT, -- RAZORPAY, STRIPE
  gateway_order_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Relationships

```
users (1) ──── (N) registrations
events (1) ──── (N) registrations
events (1) ──── (N) floor_plans
events (1) ──── (N) exhibitors
events (1) ──── (N) tickets
users (1) ──── (N) orders
tenants (1) ──── (N) events
```

---

## Features & Modules

### 1. Event Management

#### Create Event
- **Route**: `/events/new`
- **Features**:
  - Basic info (name, description, dates)
  - Venue details
  - Capacity limits
  - Event type selection
  - Image upload
  - Publish/Draft status

#### Edit Event
- **Route**: `/events/[id]/edit`
- **Features**:
  - Update all event details
  - Change status
  - Delete event

#### Event Dashboard
- **Route**: `/events/[id]/manage`
- **Tabs**:
  - Overview (stats, quick actions)
  - Registrations
  - Floor Plans
  - Exhibitors
  - Tickets
  - Analytics

### 2. Registration System

#### Public Registration
- **Route**: `/events/[id]/register`
- **Flow**:
  1. Fill registration form
  2. Select seat (if floor plan enabled)
  3. Apply promo code (optional)
  4. Proceed to payment
  5. Receive confirmation email/SMS/WhatsApp

#### Registration Management
- **Route**: `/events/[id]/registrations`
- **Features**:
  - View all registrations
  - Filter by status
  - Search by name/email
  - Export to CSV
  - Approve/Reject
  - Send bulk emails

#### Data Collected
- First Name, Last Name
- Email, Phone
- Company (optional)
- Custom fields (configurable)
- Dietary preferences
- Special requirements

### 3. Floor Plan Designer

#### Create Floor Plan
- **Route**: `/events/[id]/design/floor-plan`
- **Features**:
  - Drag-and-drop canvas
  - Add tables (round, rectangle)
  - Add chairs
  - Set capacity per table
  - Define pricing tiers (VIP, Premium, General)
  - Save multiple versions

#### Seat Selection
- **Route**: `/events/[id]/register-with-seats`
- **Features**:
  - Interactive floor plan
  - Real-time availability
  - Color-coded pricing
  - Seat reservation (5 min timeout)
  - Multi-seat selection

### 4. Check-In System

#### QR Code Generation
- Generated automatically on registration
- Encoded data:
  ```json
  {
    "type": "EVENT_REGISTRATION",
    "registrationId": "xxx",
    "eventId": 22,
    "checkInCode": "REG-22-xxx"
  }
  ```

#### Check-In Interface
- **Route**: `/events/[id]/event-day/check-in`
- **Features**:
  - QR code scanner (camera-based)
  - Manual search by name/email
  - One-click check-in
  - Real-time stats
  - Duplicate check-in prevention

#### Check-In Flow
1. Attendee shows QR code
2. Scanner reads code
3. System validates registration
4. Updates status to CHECKED_IN
5. Records check-in time
6. Shows success message

### 5. Exhibitor Management

#### Exhibitor Registration
- **Route**: `/events/[id]/exhibitor-registration/register`
- **Features**:
  - Company details
  - Booth preferences
  - Electrical/furniture requirements
  - Document upload

#### Exhibitor Dashboard
- **Route**: `/events/[id]/exhibitor-registration`
- **Features**:
  - View all exhibitors
  - Approve/Reject applications
  - Assign booth numbers
  - Set pricing
  - Generate payment links
  - Process refunds

#### Booth Allocation
- Auto-assign booth numbers
- Manual assignment option
- Booth size selection (3x3, 3x6, etc.)
- Location preferences

### 6. Payment Integration

#### Razorpay (India)
- **Test Mode**: Enabled
- **Features**:
  - Create orders
  - Verify payments
  - Refunds
  - Webhooks

#### Stripe (International)
- **Features**:
  - Payment intents
  - 3D Secure
  - Refunds
  - Webhooks

#### Payment Flow
1. User completes registration
2. System creates order
3. Redirect to payment gateway
4. User completes payment
5. Webhook confirms payment
6. Update order status
7. Send confirmation

### 7. Notifications

#### Email
- **Provider**: Nodemailer / SendGrid
- **Templates**:
  - Registration confirmation
  - Payment receipt
  - Event reminders
  - Check-in confirmation

#### SMS
- **Provider**: Twilio / MSG91
- **Use Cases**:
  - Registration confirmation
  - Check-in code
  - Event reminders

#### WhatsApp
- **Provider**: Twilio WhatsApp API
- **Use Cases**:
  - Rich registration confirmation
  - QR code delivery
  - Event updates

### 8. Promo Codes

#### Create Promo Code
- **Route**: `/admin/settings/promo-codes`
- **Types**:
  - Percentage discount
  - Fixed amount discount
- **Settings**:
  - Usage limit
  - Expiry date
  - Minimum order value
  - Applicable events

#### Apply Promo Code
- Enter code during registration
- Automatic validation
- Discount calculation
- Usage tracking

### 9. Analytics & Reports

#### Dashboard Stats
- Total events
- Total registrations
- Revenue
- Check-in rate
- Popular events

#### Event Analytics
- Registration trends
- Revenue by ticket type
- Check-in statistics
- Exhibitor metrics

#### Export Options
- CSV export
- PDF reports
- Excel format

### 10. User Management

#### Roles
- **SUPER_ADMIN**: Full system access
- **ADMIN**: Tenant-level admin
- **ORGANIZER**: Event creator/manager
- **EVENT_MANAGER**: Event staff
- **USER**: Regular attendee
- **EXHIBITOR**: Booth vendor

#### Permissions
- Create events
- Manage registrations
- Access analytics
- Manage users
- System settings

---

## API Endpoints

### Events

#### GET /api/events
List all events (with pagination)
```
Query params: page, size, status, search
Response: { events: [], pagination: {} }
```

#### POST /api/events
Create new event
```
Body: { name, description, startDate, endDate, venue, ... }
Response: { id, ...eventData }
```

#### GET /api/events/[id]
Get event details
```
Response: { id, name, description, ... }
```

#### PUT /api/events/[id]
Update event
```
Body: { name, description, ... }
Response: { success: true }
```

#### DELETE /api/events/[id]
Delete event
```
Response: { success: true }
```

### Registrations

#### GET /api/events/[id]/registrations
List registrations for event
```
Query params: page, size, status, search
Response: { registrations: [], pagination: {} }
```

#### POST /api/events/[id]/registrations
Create registration
```
Body: { email, phone, type, data: {...} }
Response: { id, qrCode, checkInCode }
```

#### GET /api/events/[id]/registrations-emergency
Emergency endpoint (bypasses complex validation)
```
Response: { registrations: [], pagination: {} }
```

### Check-In

#### POST /api/events/[id]/check-in
Check in attendee
```
Body: { registrationId }
Response: { success: true, attendee: {} }
```

#### POST /api/events/[id]/checkin-emergency
Emergency check-in endpoint
```
Body: { registrationId }
Response: { success: true, attendee: {} }
```

### Floor Plans

#### GET /api/events/[id]/floor-plans-direct
Get all floor plans for event
```
Response: { floorPlans: [], count: 10 }
```

#### POST /api/events/[id]/design/floor-plan
Create/update floor plan
```
Body: { name, layoutData, capacity, pricing, ... }
Response: { id, ...floorPlanData }
```

### Exhibitors

#### GET /api/events/[id]/exhibitors
List exhibitors
```
Response: { exhibitors: [] }
```

#### POST /api/events/[id]/exhibitors
Create exhibitor
```
Body: { companyName, contactName, contactEmail, ... }
Response: { id, ...exhibitorData }
```

#### POST /api/events/[id]/exhibitors/[exhibitorId]/approve
Approve exhibitor
```
Response: { success: true, boothNumber }
```

#### DELETE /api/events/[id]/exhibitors/[exhibitorId]
Delete exhibitor
```
Response: { success: true }
```

### Payments

#### POST /api/payments/razorpay/create-order
Create Razorpay order
```
Body: { amount, currency, registrationId }
Response: { orderId, amount, currency }
```

#### POST /api/payments/razorpay/verify
Verify Razorpay payment
```
Body: { orderId, paymentId, signature }
Response: { success: true }
```

#### POST /api/payments/stripe/create-intent
Create Stripe payment intent
```
Body: { amount, currency }
Response: { clientSecret }
```

### Notifications

#### POST /api/notify/sms
Send SMS
```
Body: { to, message }
Response: { success: true, messageId }
```

#### POST /api/test-whatsapp
Send WhatsApp message
```
Body: { to, message }
Response: { success: true }
```

---

## User Roles & Permissions

### Permission Matrix

| Feature | Super Admin | Admin | Organizer | Event Manager | User | Exhibitor |
|---------|-------------|-------|-----------|---------------|------|-----------|
| Create Event | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Event | ✅ | ✅ | ✅ (own) | ✅ (assigned) | ❌ | ❌ |
| Delete Event | ✅ | ✅ | ✅ (own) | ❌ | ❌ | ❌ |
| View Registrations | ✅ | ✅ | ✅ (own events) | ✅ (assigned) | ❌ | ❌ |
| Approve Registrations | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Check-In | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Floor Plan | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Exhibitors | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ✅ (own) | ✅ (assigned) | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Register for Event | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Apply as Exhibitor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Installation & Setup

### Prerequisites

- Node.js 20+ 
- PostgreSQL database (or Supabase account)
- npm or yarn
- Git

### Step 1: Clone Repository

```bash
git clone https://github.com/rajasekarmohan2991/event-planner-v1.git
cd event-planner-v1/apps/web
```

### Step 2: Install Dependencies

```bash
npm install --legacy-peer-deps
```

### Step 3: Environment Variables

Create `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Multi-tenancy
DEFAULT_TENANT_ID="default-tenant"

# Razorpay
RAZORPAY_KEY_ID="your-key-id"
RAZORPAY_KEY_SECRET="your-key-secret"

# Stripe
STRIPE_PUBLIC_KEY="pk_test_xxx"
STRIPE_SECRET_KEY="sk_test_xxx"

# Twilio (SMS/WhatsApp)
TWILIO_ACCOUNT_SID="your-sid"
TWILIO_AUTH_TOKEN="your-token"
TWILIO_PHONE_NUMBER="+1234567890"
TWILIO_WHATSAPP_NUMBER="whatsapp:+1234567890"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Uploadthing
UPLOADTHING_SECRET="your-secret"
UPLOADTHING_APP_ID="your-app-id"
```

### Step 4: Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

### Step 5: Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Deployment

### Vercel Deployment

#### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Select `apps/web` as root directory

#### Step 2: Configure Environment Variables

Add all environment variables from `.env.local` to Vercel:

1. Go to Project Settings → Environment Variables
2. Add each variable
3. Select Production, Preview, Development

#### Step 3: Deploy

```bash
git push origin main
```

Vercel will automatically deploy on push.

### Database Migration on Vercel

Add build command in `package.json`:

```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

### Custom Domain

1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records
4. Wait for SSL certificate

---

## Troubleshooting

### Common Issues

#### 1. Floor Plans Not Showing

**Symptom**: Floor plans list is empty

**Cause**: `tenant_id` mismatch

**Fix**:
```sql
UPDATE floor_plans 
SET tenant_id = 'default-tenant' 
WHERE event_id = YOUR_EVENT_ID;
```

#### 2. Registrations Not Loading

**Symptom**: Check-in page shows 0 registrations

**Cause**: `tenant_id` filtering

**Fix**:
```sql
UPDATE registrations 
SET tenant_id = 'default-tenant' 
WHERE event_id = YOUR_EVENT_ID;
```

#### 3. QR Code Check-In Not Working

**Symptom**: Scanning QR code shows "Registration not found"

**Cause**: Registration has wrong `tenant_id`

**Fix**: Update registration tenant_id (see above)

#### 4. Payment Gateway Errors

**Symptom**: "Payment failed" error

**Causes**:
- Invalid API keys
- Test mode vs production mode mismatch
- Webhook URL not configured

**Fix**:
- Verify API keys in `.env`
- Check gateway dashboard
- Configure webhook URL: `https://yourdomain.com/api/payments/[gateway]/webhook`

#### 5. Email/SMS Not Sending

**Symptom**: No notifications received

**Causes**:
- Invalid SMTP credentials
- Twilio account not verified
- Phone number not in E.164 format

**Fix**:
- Test SMTP connection
- Verify Twilio account
- Format phone: `+919876543210`

#### 6. Vercel Build Timeout

**Symptom**: Build fails with "Static page generation timeout"

**Cause**: API routes trying to connect to database during build

**Fix**: Add to route files:
```typescript
export const dynamic = 'force-dynamic'
```

---

## Development Guide

### Project Structure

```
apps/web/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── events/            # Event pages
│   ├── dashboard/         # Dashboard pages
│   ├── auth/              # Auth pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Shadcn components
│   ├── events/           # Event components
│   └── forms/            # Form components
├── lib/                   # Utilities
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # Auth config
│   └── utils.ts          # Helper functions
├── prisma/               # Database
│   └── schema.prisma     # Database schema
├── public/               # Static files
└── styles/               # Global styles
```

### Adding a New Feature

#### 1. Create Database Table

Edit `prisma/schema.prisma`:

```prisma
model MyNewFeature {
  id        String   @id @default(cuid())
  tenantId  String   @map("tenant_id")
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  
  @@map("my_new_features")
}
```

Run migration:
```bash
npx prisma migrate dev --name add_my_new_feature
```

#### 2. Create API Route

Create `app/api/my-feature/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const features = await prisma.myNewFeature.findMany()
  return NextResponse.json({ features })
}

export async function POST(req: Request) {
  const body = await req.json()
  const feature = await prisma.myNewFeature.create({
    data: body
  })
  return NextResponse.json({ feature })
}
```

#### 3. Create Frontend Page

Create `app/my-feature/page.tsx`:

```typescript
'use client'
import { useState, useEffect } from 'react'

export default function MyFeaturePage() {
  const [features, setFeatures] = useState([])
  
  useEffect(() => {
    fetch('/api/my-feature')
      .then(r => r.json())
      .then(d => setFeatures(d.features))
  }, [])
  
  return (
    <div>
      <h1>My Feature</h1>
      {features.map(f => (
        <div key={f.id}>{f.name}</div>
      ))}
    </div>
  )
}
```

### Code Style Guidelines

#### TypeScript
- Use TypeScript for all files
- Define interfaces for data structures
- Avoid `any` type

#### React
- Use functional components
- Use hooks for state management
- Keep components small and focused

#### API Routes
- Always add `export const dynamic = 'force-dynamic'`
- Use try-catch for error handling
- Return proper HTTP status codes

#### Database
- Use snake_case for column names
- Use PascalCase for model names
- Always include `tenant_id` for multi-tenant tables

### Testing

#### Manual Testing Checklist

- [ ] Create event
- [ ] Register for event
- [ ] Select seat (if floor plan enabled)
- [ ] Complete payment
- [ ] Receive confirmation email/SMS
- [ ] Scan QR code for check-in
- [ ] View analytics
- [ ] Export data

#### API Testing

Use curl or Postman:

```bash
# Test registration endpoint
curl -X POST http://localhost:3000/api/events/22/registrations \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phone":"+919876543210","type":"GENERAL"}'
```

---

## Support & Maintenance

### Backup Strategy

#### Database Backups
- Supabase: Automatic daily backups
- Manual backup: Use `pg_dump`

```bash
pg_dump -h host -U user -d database > backup.sql
```

#### Code Backups
- Git repository (GitHub)
- Vercel deployment history

### Monitoring

#### Application Monitoring
- Vercel Analytics
- Error tracking (Sentry recommended)
- Performance monitoring

#### Database Monitoring
- Supabase dashboard
- Query performance
- Connection pool usage

### Updates & Upgrades

#### Dependency Updates

```bash
# Check outdated packages
npm outdated

# Update packages
npm update

# Update Prisma
npm install prisma@latest @prisma/client@latest
npx prisma generate
```

#### Database Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply to production
npx prisma migrate deploy
```

---

## Appendix

### Useful Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server

# Database
npx prisma studio             # Open Prisma Studio
npx prisma migrate dev        # Create migration
npx prisma migrate deploy     # Apply migrations
npx prisma generate           # Generate Prisma Client
npx prisma db push            # Push schema changes

# Deployment
vercel                        # Deploy to Vercel
vercel --prod                 # Deploy to production

# Utilities
npx tsx script.ts             # Run TypeScript script
```

### Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| DATABASE_URL | PostgreSQL connection string | ✅ | postgresql://... |
| NEXTAUTH_URL | Application URL | ✅ | http://localhost:3000 |
| NEXTAUTH_SECRET | Auth secret key | ✅ | random-string |
| DEFAULT_TENANT_ID | Default tenant | ✅ | default-tenant |
| RAZORPAY_KEY_ID | Razorpay key | ❌ | rzp_test_xxx |
| RAZORPAY_KEY_SECRET | Razorpay secret | ❌ | xxx |
| STRIPE_PUBLIC_KEY | Stripe public key | ❌ | pk_test_xxx |
| STRIPE_SECRET_KEY | Stripe secret key | ❌ | sk_test_xxx |
| TWILIO_ACCOUNT_SID | Twilio SID | ❌ | ACxxx |
| TWILIO_AUTH_TOKEN | Twilio token | ❌ | xxx |
| SMTP_HOST | Email server | ❌ | smtp.gmail.com |
| SMTP_PORT | Email port | ❌ | 587 |
| SMTP_USER | Email username | ❌ | user@gmail.com |
| SMTP_PASS | Email password | ❌ | app-password |

### Database Indexes

For optimal performance, ensure these indexes exist:

```sql
CREATE INDEX idx_events_tenant_id ON events(tenant_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_registrations_check_in_status ON registrations(check_in_status);
CREATE INDEX idx_floor_plans_event_id ON floor_plans(event_id);
CREATE INDEX idx_exhibitors_event_id ON exhibitors(event_id);
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
```

---

## License

Proprietary - All Rights Reserved

---

## Contact & Support

- **Developer**: Rajasekar Mohan
- **Email**: rajsam92@gmail.com
- **Repository**: https://github.com/rajasekarmohan2991/event-planner-v1

---

**Last Updated**: December 26, 2025
**Version**: 1.0.0
