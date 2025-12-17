# Event Planner V1 - Complete Functionality Overview

## System Architecture

### Technology Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Next.js API Routes + Java Spring Boot (separate service)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: NextAuth.js (Credentials + OAuth: Google, Instagram)
- **ORM**: Prisma
- **Styling**: Tailwind CSS + shadcn/ui components
- **Deployment**: Vercel (Frontend) + Render (Java Backend)

### Multi-Tenancy Model
- **Tenant-based**: Each company is a separate tenant
- **Subdomain support**: `company-slug.domain.com`
- **Row Level Security (RLS)**: Enabled on all tables
- **Tenant isolation**: Users can belong to multiple tenants

---

## User Roles & Permissions

### System Roles (Global)
1. **SUPER_ADMIN**: Full system access, manages all companies
2. **ADMIN**: Company admin, manages their company
3. **EVENT_MANAGER**: Creates and manages events
4. **USER**: Regular user, can register for events
5. **STAFF**: Support staff with limited access
6. **VIEWER**: Read-only access

### Tenant Roles (Company-level)
1. **TENANT_ADMIN**: Company administrator
2. **EVENT_MANAGER**: Event creator and manager
3. **VENUE_MANAGER**: Venue management
4. **FINANCE_ADMIN**: Financial operations
5. **MARKETING_ADMIN**: Marketing and promotions
6. **EXHIBITOR_MANAGER**: Exhibitor management
7. **SUPPORT_STAFF**: Customer support
8. **STAFF**: General staff
9. **MEMBER**: Basic member
10. **VIEWER**: Read-only member

### Event Team Roles
1. **Event Owner**: Full control over specific event
2. **Coordinator**: Manage operations and registrations
3. **Event Staff**: Check-in attendees, view info
4. **Vendor**: Manage booth/service information

---

## Core Modules & Features

### 1. Authentication & User Management

#### Login/Registration
- **Email/Password** authentication
- **OAuth** (Google, Instagram)
- **Dev Login** (for development)
- Email verification
- Password reset
- Session management (30-day sessions)
- Auto-refresh every 10 minutes

#### User Dashboard (`/dashboard/user`)
- View upcoming public events
- View user's registrations
- Profile management
- Ticket access

### 2. Company Management

#### Company Registration (`/company/register`)
- Create new company/tenant
- Automatic tenant creation
- Admin user setup

#### Company Dashboard (`/company/page` or `/admin/company`)
- Company overview
- Event statistics
- Team member count
- Registration metrics
- Quick actions (invite team, create event)

#### Team Management (`/company/team`)
- Invite team members
- Assign roles
- Manage permissions
- View team activity

### 3. Event Management

#### Event Creation & Editing (`/events/[id]/info`)
- **Basic Info**: Name, description, dates, location
- **Pricing**: Free or paid events, currency support
- **Capacity**: Max attendees, ticket limits
- **Status**: DRAFT, PUBLISHED, LIVE, CANCELLED, COMPLETED
- **Visibility**: Public/Private
- **Categories**: Event type classification

#### Event Modules (Tabs)
1. **Event Info** (`/events/[id]/info`)
   - Edit basic details
   - Upload banner/images
   - Set dates and location

2. **Speakers** (`/events/[id]/speakers`)
   - Add/manage speakers
   - Speaker profiles
   - Session assignments

3. **Sessions** (`/events/[id]/sessions`)
   - Create session schedule
   - Assign speakers
   - Track attendance

4. **Team** (`/events/[id]/team`)
   - Invite event team members
   - Assign event-specific roles
   - Manage permissions
   - **Issue**: Company users not loading in invite modal (FIXED)

5. **Sponsors** (`/events/[id]/sponsors`)
   - Add sponsor information
   - Sponsor tiers
   - Logo management

6. **Promote** (`/events/[id]/promote`)
   - Marketing materials
   - Share links
   - QR codes

7. **Engagement** (`/events/[id]/engagement`)
   - Polls and surveys
   - Q&A sessions
   - Live interactions

8. **Event Library** (`/events/[id]/library`)
   - Documents and resources
   - Media files
   - Downloads for attendees

9. **Custom Forms** (`/events/[id]/forms`)
   - Create registration forms
   - Custom fields
   - Form builder

10. **Zones** (`/events/[id]/zones`)
    - Venue zones/areas
    - Zone management

#### Floor Planner & Seating (`/events/[id]/floor-plan`)
- **Simple 2D Floor Generator** (`Simple2DFloorGenerator.tsx`)
  - Event types: Conference, Wedding, Theatre, Concert, Banquet
  - Table types: Rows (Theatre), Round, Rectangle, Square
  - Seat allocation: VIP, Premium, Standard
  - Pricing per seat type
  - **Issue**: Floor plan not saving, seat selector not showing (NEEDS FIX)

- **Seat Selection** (`SeatSelector.tsx`)
  - Visual seat map
  - Real-time availability
  - Seat reservation (temporary hold)
  - Multiple view modes (sectors, table, map)
  - Ticket class filtering

#### Registration Management (`/events/[id]/registrations`)
- View all registrations
- Filter by status (Pending, Approved, Cancelled, Waitlist)
- Search registrations
- Export data
- Approve/reject registrations
- Manual check-in toggle
- **Issue**: Check-in toggle working correctly (FIXED)

#### Check-in System
- **QR Code Check-in** (`/events/[id]/event-day/check-in`)
  - Scan QR codes
  - Instant validation
  - Check-in status update
  
- **Manual Check-in** (API: `/api/events/[id]/checkin`)
  - Token-based check-in
  - Email verification
  
- **Simple Check-in** (API: `/api/events/[id]/checkin-simple`)
  - Quick check-in flow

#### Event Registration (Public)
- **Standard Registration** (`/events/[id]/register`)
  - Form submission
  - Payment integration
  - Confirmation emails

- **Seat Selection Registration** (`/events/[id]/register-with-seats`)
  - Choose seats
  - Real-time availability
  - Seat reservation
  - Payment with selected seats

#### Payment & Billing
- **Tax Settings** (`/events/[id]/payments/tax`)
  - Configure tax rates
  - Tax calculations

- **Orders** (`/events/[id]/orders`)
  - View all orders
  - Order details
  - Payment status

#### Design & Branding (`/events/[id]/design/branding`)
- Custom branding
- Color schemes
- Logo upload
- Email templates

### 4. Super Admin Features

#### Company Management (`/super-admin/companies`)
- View all companies
- Company details
- Subscription management
- Usage limits (events, users, storage)
- Trial periods

#### Company Details (`/super-admin/companies/[id]`)
- Company overview
- Events list
- Team members
- Analytics (for super-admin company only)
- Subscription & limits card

#### Lookups Management (`/super-admin/lookups`)
- Manage system lookups
- Categories
- Event types
- Custom fields

#### Diagnostics (`/super-admin/diagnostics`)
- System health checks
- Performance metrics
- Error logs

### 5. Analytics & Reporting

#### Admin Analytics (`/admin/analytics`)
- Event performance
- Registration trends
- Revenue reports
- Attendance metrics

#### Company Analytics (`/company/analytics` or `/tenant/analytics`)
- Company-wide statistics
- Event comparisons
- Growth metrics

### 6. Settings & Configuration

#### Billing Settings (`/admin/settings/billing`)
- Subscription plans
- Payment methods
- Billing history
- Upgrade/downgrade

#### Currency Settings (`/admin/currency`)
- Multi-currency support
- Exchange rates
- Default currency

#### Notifications (`/admin/notifications`)
- Email notifications
- SMS alerts
- Push notifications
- Notification preferences

### 7. User Features

#### My Tickets (`/account/my-tickets`)
- View purchased tickets
- Download tickets
- QR codes

#### My Registrations (`/registrations/my`)
- View all registrations
- Registration status
- Event details
- Cancel registrations

### 8. Vendor Management

#### Vendors List (`/company/vendors`)
- View all vendors
- Vendor details
- Event assignments

#### Vendor Details (`/company/vendors/[eventId]/[vendorId]`)
- Vendor profile
- Services offered
- Booth information
- Contact details

### 9. Approvals

#### Team Approvals (`/team-approvals`)
- Pending team member requests
- Approve/reject team invitations

#### Exhibitor Approvals (`/exhibitor-approvals`)
- Pending exhibitor applications
- Approve/reject exhibitors

---

## Database Schema (Key Tables)

### Core Tables
1. **User**: User accounts, authentication
2. **Tenant**: Companies/organizations
3. **TenantMember**: User-tenant relationships
4. **Event**: Events
5. **Registration**: Event registrations
6. **EventTeamMember**: Event-specific team members

### Seating & Floor Plans
7. **FloorPlanConfig**: Floor plan configurations
8. **SeatInventory**: Available seats
9. **SeatReservation**: Temporary seat holds

### Additional Tables
10. **Speaker**: Event speakers
11. **Session**: Event sessions
12. **Sponsor**: Event sponsors
13. **Order**: Payment orders
14. **Notification**: System notifications

---

## API Routes Structure

### Authentication
- `/api/auth/*` - NextAuth endpoints
- `/api/company/register` - Company registration
- `/api/company/login` - Company login

### Events
- `/api/events` - List events
- `/api/events/[id]` - Event CRUD
- `/api/events/[id]/registrations` - Registration management
- `/api/events/[id]/team` - Event team management
- `/api/events/[id]/seats/generate` - Generate seat inventory
- `/api/events/[id]/seats/availability` - Check seat availability
- `/api/events/[id]/checkin` - Check-in endpoints

### Company
- `/api/company/dashboard` - Company dashboard data
- `/api/company/users` - Company users list
- `/api/company/team` - Company team management

### Admin
- `/api/admin/analytics` - Analytics data
- `/api/admin/dashboard/stats` - Dashboard statistics
- `/api/super-admin/companies` - Company management

---

## Known Issues & Recent Fixes

### ✅ Fixed Issues
1. **Login redirect loop** - Fixed secure cookie detection
2. **Access denied on refresh** - Redirect to login instead
3. **Infinite loading on user dashboard** - Fixed session status handling
4. **Check-in toggle not working** - Fixed parameter naming conflict
5. **Session logout on refresh** - Extended session to 30 days, added keep-alive
6. **Company users not loading in team invite** - Fixed Prisma query WHERE clause

### ⚠️ Current Issues
1. **Floor Planner**:
   - Unable to save floor plan with seats
   - "Seated" and "Theatre" styles not selectable
   - Seat selector not appearing after floor plan generation

2. **Performance**:
   - Some pages loading slowly (partially addressed with LoadingWithTimeout)
   - Database queries need optimization (indexes created, need to be applied)

### 🚀 Recent Optimizations
1. Session persistence (30-day sessions, auto-refresh)
2. LoadingWithTimeout component (3-second timeout)
3. Database indexes migration (ready to apply)
4. React Query integration (caching, smart refetching)
5. Service Worker (offline support)

---

## Deployment

### Frontend (Vercel)
- Auto-deploys on push to `main`
- Environment variables configured
- Custom domain support

### Backend (Render)
- Java Spring Boot service
- Auto-deploy configured with `render.yaml`
- Health check endpoint: `/api/health`

### Database (Supabase)
- PostgreSQL database
- Connection pooling
- Row Level Security enabled

---

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Auth secret key
- `NEXTAUTH_URL` - App URL
- `NEXT_PUBLIC_API_BASE_URL` - Java backend URL
- `INTERNAL_API_BASE_URL` - Internal backend URL

### Optional
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `INSTAGRAM_CLIENT_ID` / `INSTAGRAM_CLIENT_SECRET` - Instagram OAuth
- `ENABLE_DEV_LOGIN` - Enable dev login
- `DEV_LOGIN_EMAIL` / `DEV_LOGIN_PASSWORD` - Dev credentials

---

## Testing Checklist

When testing, verify:

### Authentication
- [ ] Login with email/password
- [ ] Login with Google OAuth
- [ ] Session persists on refresh
- [ ] Session stays active (no auto-logout)
- [ ] Logout works correctly

### Company Management
- [ ] Create new company
- [ ] View company dashboard
- [ ] Invite team members
- [ ] Company users load in invite modal

### Event Management
- [ ] Create new event
- [ ] Edit event details
- [ ] Publish event
- [ ] View event on public page

### Floor Planner & Seating
- [ ] Generate floor plan
- [ ] Save floor plan with seats
- [ ] Select "Theatre" and "Seated" styles
- [ ] Seat selector appears on registration page
- [ ] Seats can be selected
- [ ] Seat reservation works

### Registration
- [ ] Register for event (standard)
- [ ] Register with seat selection
- [ ] View registrations in admin
- [ ] Approve/reject registrations
- [ ] Check-in toggle works

### Performance
- [ ] Pages load within 3 seconds
- [ ] No infinite loading states
- [ ] Session doesn't expire unexpectedly
- [ ] Offline mode works (cached content)

---

**I'm now ready to help you test and fix any issues you encounter!** 🚀
