# 📋 Complete API Endpoints List

## 🔐 Authentication & Admin
- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - Login user
- **GET** `/api/admin/events` - List all events (admin)
- **GET** `/api/admin/users` - List all users
- **POST** `/api/admin/users` - Create new user (SUPER_ADMIN only)
- **DELETE** `/api/admin/users/[id]` - Delete user (SUPER_ADMIN only)
- **PUT** `/api/admin/users/[id]/role` - Update user role (SUPER_ADMIN only)
- **GET** `/api/admin/analytics` - Get admin analytics

## 📅 Events Management
- **GET** `/api/events` - List events (with filters: status, category, etc.)
- **POST** `/api/events` - Create new event
- **GET** `/api/events/[id]` - Get event details
- **PUT** `/api/events/[id]` - Update event
- **DELETE** `/api/events/[id]` - Delete event
- **POST** `/api/events/[id]/publish` - Publish event (set status to LIVE)
- **POST** `/api/events/[id]/cancel` - Cancel event
- **POST** `/api/events/[id]/trash` - Move event to trash
- **POST** `/api/events/[id]/restore` - Restore trashed event
- **POST** `/api/events/[id]/purge` - Permanently delete event
- **PUT** `/api/events/[id]/update` - Update event (alternative endpoint)
- **GET** `/api/events/[id]/public` - Get public event info
- **GET** `/api/events/[id]/stats` - Get event statistics
- **GET** `/api/events/[id]/ics` - Download calendar file

## 🎨 Design Module
- **GET** `/api/events/[id]/design/site` - Get site design settings
- **PUT** `/api/events/[id]/design/site` - Save site design draft
- **POST** `/api/events/[id]/design/publish` - Publish design
- **GET** `/api/events/[id]/design/published` - Get published design
- **GET** `/api/events/[id]/design/banner` - Get banner settings
- **POST** `/api/events/[id]/design/banner` - Create/update banner
- **GET** `/api/events/[id]/design/branding` - Get branding
- **POST** `/api/events/[id]/design/branding` - Update branding
- **GET** `/api/events/[id]/design/theme` - Get theme
- **POST** `/api/events/[id]/design/theme` - Update theme
- **GET** `/api/events/[id]/design/emails` - Get email templates
- **POST** `/api/events/[id]/design/emails` - Save email templates
- **GET** `/api/events/[id]/design/microsite` - Get microsite settings
- **POST** `/api/events/[id]/design/microsite` - Update microsite
- **GET** `/api/events/[id]/design/floor-plan` - List floor plans ✅ NEW
- **POST** `/api/events/[id]/design/floor-plan` - Create floor plan ✅ NEW
- **DELETE** `/api/events/[id]/design/floor-plan/[planId]` - Delete floor plan ✅ NEW

## 🪑 Seat Management
- **GET** `/api/events/[id]/seats/availability` - Check seat availability
- **POST** `/api/events/[id]/seats/reserve` - Reserve seats (15 min hold)
- **POST** `/api/events/[id]/seats/confirm` - Confirm seat reservation
- **POST** `/api/events/[id]/seats/generate` - Generate seats from floor plan

## 📝 Registrations
- **GET** `/api/events/[id]/registrations` - List event registrations
- **POST** `/api/events/[id]/registrations` - Create registration
- **GET** `/api/events/[id]/registrations/[registrationId]` - Get registration details
- **PUT** `/api/events/[id]/registrations/[registrationId]` - Update registration
- **DELETE** `/api/events/[id]/registrations/[registrationId]` - Cancel registration
- **POST** `/api/events/[id]/registrations/[registrationId]/approve` - Approve registration
- **POST** `/api/events/[id]/registrations/[registrationId]/cancel` - Cancel request
- **GET** `/api/events/[id]/registrations/[registrationId]/qr` - Get QR code
- **POST** `/api/events/[id]/registrations/[registrationId]/payment` - Process payment
- **GET** `/api/events/[id]/registrations/approvals` - List pending approvals
- **POST** `/api/events/[id]/registrations/approve` - Bulk approve
- **POST** `/api/events/[id]/registrations/bulk-approve` - Bulk approve multiple
- **GET** `/api/events/[id]/registrations/cancellation-approvals` - Cancellation requests
- **GET** `/api/events/[id]/registrations/missed` - Get missed registrations
- **GET** `/api/events/[id]/registrations/trend` - Registration trend data

## 🎫 Tickets
- **GET** `/api/events/[id]/tickets` - List event tickets
- **POST** `/api/events/[id]/tickets` - Create ticket type
- **GET** `/api/events/[id]/tickets/[ticketId]` - Get ticket details
- **PUT** `/api/events/[id]/tickets/[ticketId]` - Update ticket
- **DELETE** `/api/events/[id]/tickets/[ticketId]` - Delete ticket
- **DELETE** `/api/events/[id]/tickets/[ticketId]/delete-direct` - Direct delete
- **GET** `/api/events/[id]/tickets/[ticketId]/qr` - Get ticket QR code

## 📧 RSVP Management
- **GET** `/api/events/[id]/rsvp` - Get RSVP settings
- **POST** `/api/events/[id]/rsvp` - Create RSVP
- **GET** `/api/events/[id]/rsvp/summary` - RSVP summary stats
- **GET** `/api/events/[id]/rsvp/guests` - List RSVP guests
- **POST** `/api/events/[id]/rsvp/guests` - Add guest to RSVP
- **GET** `/api/events/[id]/rsvp/guests/[guestId]` - Get guest details
- **PUT** `/api/events/[id]/rsvp/guests/[guestId]` - Update guest
- **DELETE** `/api/events/[id]/rsvp/guests/[guestId]` - Remove guest
- **GET** `/api/events/[id]/rsvps` - List all RSVPs
- **GET** `/api/events/[id]/rsvps/[rsvpId]` - Get RSVP details
- **PUT** `/api/events/[id]/rsvps/[rsvpId]` - Update RSVP
- **DELETE** `/api/events/[id]/rsvps/[rsvpId]` - Delete RSVP
- **GET** `/api/events/[id]/rsvps/approvals` - RSVP approvals

## 💰 Orders & Payments
- **GET** `/api/events/[id]/orders` - List orders
- **POST** `/api/events/[id]/orders` - Create order
- **GET** `/api/events/[id]/orders/[orderId]` - Get order details
- **PUT** `/api/events/[id]/orders/[orderId]` - Update order
- **DELETE** `/api/events/[id]/orders/[orderId]` - Cancel order
- **POST** `/api/events/[id]/orders/[orderId]/refund` - Refund order
- **GET** `/api/events/[id]/payment-settings` - Get payment settings
- **PUT** `/api/events/[id]/payment-settings` - Update payment settings
- **POST** `/api/payments/stripe/create-intent` - Create Stripe payment
- **POST** `/api/payments/stripe/confirm` - Confirm Stripe payment
- **POST** `/api/payments/stripe/refund` - Refund via Stripe
- **POST** `/api/payments/stripe/webhook` - Stripe webhook handler
- **POST** `/api/payments/razorpay/create-order` - Create Razorpay order
- **POST** `/api/payments/razorpay/verify` - Verify Razorpay payment
- **POST** `/api/stripe/checkout` - Stripe checkout session
- **POST** `/api/webhooks/payments/mock` - Mock payment webhook

## 🎟️ Promo Codes
- **GET** `/api/events/[id]/promo-codes` - List promo codes
- **POST** `/api/events/[id]/promo-codes` - Create promo code
- **GET** `/api/events/[id]/promo-codes/[codeId]` - Get promo code
- **PUT** `/api/events/[id]/promo-codes/[codeId]` - Update promo code
- **DELETE** `/api/events/[id]/promo-codes/[codeId]` - Delete promo code
- **GET** `/api/events/[id]/promo-codes/active` - List active codes
- **POST** `/api/events/[id]/promo-codes/validate` - Validate code
- **POST** `/api/events/[id]/promo-codes/apply` - Apply promo code
- **POST** `/api/promocodes/[code]/validate` - Validate promo (global)
- **POST** `/api/promocodes/[code]/redeem` - Redeem promo code
- **GET** `/api/promocodes` - List all promo codes

## 👥 Attendees & Check-in
- **GET** `/api/events/[id]/attendees` - List attendees
- **POST** `/api/events/[id]/attendees` - Add attendee
- **POST** `/api/events/[id]/checkin` - Check-in attendee
- **GET** `/api/events/[id]/checkin-simple` - Simple check-in
- **POST** `/api/events/[id]/event-day/checkin` - Event day check-in
- **GET** `/api/events/[id]/event-day/live` - Live event stats

## 🎤 Speakers & Sessions
- **GET** `/api/events/[id]/speakers` - List speakers
- **POST** `/api/events/[id]/speakers` - Add speaker
- **GET** `/api/events/[id]/speakers/[speakerId]` - Get speaker
- **PUT** `/api/events/[id]/speakers/[speakerId]` - Update speaker
- **DELETE** `/api/events/[id]/speakers/[speakerId]` - Delete speaker
- **GET** `/api/events/[id]/sessions` - List sessions
- **POST** `/api/events/[id]/sessions` - Create session
- **GET** `/api/events/[id]/sessions/list` - List sessions (alternative)
- **GET** `/api/events/[id]/sessions/[sessionId]` - Get session
- **PUT** `/api/events/[id]/sessions/[sessionId]` - Update session
- **DELETE** `/api/events/[id]/sessions/[sessionId]` - Delete session
- **GET** `/api/events/[id]/sessions/[sessionId]/speakers/[speakerId]` - Get session speaker
- **PUT** `/api/events/[id]/sessions/[sessionId]/speakers/[speakerId]` - Update session speaker
- **DELETE** `/api/events/[id]/sessions/[sessionId]/speakers/[speakerId]` - Remove speaker

## 🏢 Sponsors & Exhibitors
- **GET** `/api/events/[id]/sponsors` - List sponsors
- **POST** `/api/events/[id]/sponsors` - Add sponsor
- **GET** `/api/events/[id]/sponsors/[sponsorId]` - Get sponsor
- **PUT** `/api/events/[id]/sponsors/[sponsorId]` - Update sponsor
- **DELETE** `/api/events/[id]/sponsors/[sponsorId]` - Delete sponsor
- **GET** `/api/events/[id]/exhibitors` - List exhibitors
- **POST** `/api/events/[id]/exhibitors` - Add exhibitor
- **GET** `/api/events/[id]/exhibitors/[exhibitorId]` - Get exhibitor
- **PUT** `/api/events/[id]/exhibitors/[exhibitorId]` - Update exhibitor
- **DELETE** `/api/events/[id]/exhibitors/[exhibitorId]` - Delete exhibitor

## 👨‍💼 Team Management
- **GET** `/api/events/[id]/team/members` - List team members
- **POST** `/api/events/[id]/team/members` - Add team member
- **GET** `/api/events/[id]/team/members/[memberId]` - Get member
- **PUT** `/api/events/[id]/team/members/[memberId]` - Update member
- **DELETE** `/api/events/[id]/team/members/[memberId]` - Remove member
- **POST** `/api/events/[id]/team/invite` - Invite team member
- **POST** `/api/events/[id]/team/reinvite` - Resend invitation
- **POST** `/api/events/[id]/team/approve` - Approve team member

## 🔐 Roles & Permissions
- **GET** `/api/events/[id]/roles` - List event roles
- **POST** `/api/events/[id]/roles` - Assign role
- **GET** `/api/events/[id]/roles/[assignmentId]` - Get role assignment
- **PUT** `/api/events/[id]/roles/[assignmentId]` - Update role
- **DELETE** `/api/events/[id]/roles/[assignmentId]` - Remove role

## ⚙️ Settings
- **GET** `/api/events/[id]/settings/general` - General settings
- **PUT** `/api/events/[id]/settings/general` - Update general settings
- **GET** `/api/events/[id]/settings/registration` - Registration settings
- **PUT** `/api/events/[id]/settings/registration` - Update registration
- **GET** `/api/events/[id]/settings/payments` - Payment settings
- **PUT** `/api/events/[id]/settings/payments` - Update payment settings
- **GET** `/api/events/[id]/settings/notifications` - Notification settings
- **PUT** `/api/events/[id]/settings/notifications` - Update notifications
- **GET** `/api/events/[id]/settings/integrations` - Integration settings
- **PUT** `/api/events/[id]/settings/integrations` - Update integrations
- **GET** `/api/events/[id]/registration-settings` - Get reg settings
- **PUT** `/api/events/[id]/registration-settings` - Update reg settings
- **GET** `/api/events/[id]/registration-settings/advanced` - Advanced settings
- **PUT** `/api/events/[id]/registration-settings/advanced` - Update advanced
- **GET** `/api/events/[id]/tax` - Get tax settings
- **PUT** `/api/events/[id]/tax` - Update tax settings

## 📊 Reports & Analytics
- **GET** `/api/events/[id]/analytics` - Event analytics
- **GET** `/api/events/[id]/reports/summary` - Summary report
- **GET** `/api/events/[id]/reports/stats` - Statistics report
- **GET** `/api/events/[id]/reports/trends` - Trends report
- **GET** `/api/events/[id]/reports/payments` - Payment reports
- **GET** `/api/events/[id]/reports/ticket-sales` - Ticket sales report
- **GET** `/api/events/[id]/reports/promo-codes` - Promo code usage
- **GET** `/api/events/[id]/reports/export` - Export all reports

## 📤 Exports
- **GET** `/api/events/[id]/exports/attendees` - Export attendees CSV
- **GET** `/api/events/[id]/exports/orders` - Export orders CSV
- **GET** `/api/events/[id]/exports/rsvps` - Export RSVPs CSV

## 📧 Communications & Notifications
- **POST** `/api/events/[id]/communicate/bulk` - Send bulk communication
- **POST** `/api/events/[id]/invite` - Send event invitation
- **GET** `/api/events/[id]/notifications/templates` - Email templates
- **POST** `/api/events/[id]/notifications/templates` - Create template
- **POST** `/api/events/[id]/notifications/send` - Send notification
- **POST** `/api/events/[id]/notifications/schedule` - Schedule notification
- **GET** `/api/notifications` - List user notifications
- **GET** `/api/notifications/[id]/read` - Mark notification as read
- **POST** `/api/notifications/event-created` - Event created notification
- **POST** `/api/notifications/process` - Process notification queue
- **GET** `/api/notifications/smtp-config` - Get SMTP config
- **PUT** `/api/notifications/smtp-config` - Update SMTP config
- **POST** `/api/notifications/test-email` - Test email delivery
- **POST** `/api/notify/sms` - Send SMS notification
- **GET** `/api/track/email/open` - Track email open
- **GET** `/api/track/email/click` - Track email click

## 📝 Custom Fields
- **GET** `/api/events/[id]/custom-fields` - List custom fields
- **POST** `/api/events/[id]/custom-fields` - Create custom field
- **GET** `/api/events/[id]/custom-fields/[fieldId]` - Get custom field
- **PUT** `/api/events/[id]/custom-fields/[fieldId]` - Update custom field
- **DELETE** `/api/events/[id]/custom-fields/[fieldId]` - Delete custom field
- **GET** `/api/events/[id]/public/custom-fields` - Public custom fields

## 💬 Feedback & Prospects
- **GET** `/api/events/[id]/feedback` - Get event feedback
- **POST** `/api/events/[id]/feedback` - Submit feedback
- **GET** `/api/events/[id]/prospects` - List prospects
- **POST** `/api/events/[id]/prospects` - Add prospect

## 📋 Calendar & Campaigns
- **GET** `/api/events/[id]/calendar` - Calendar data
- **GET** `/api/events/[id]/campaigns` - List campaigns
- **POST** `/api/events/[id]/campaigns` - Create campaign

## 🌍 Geo & Venues
- **GET** `/api/geo/city` - Get cities
- **GET** `/api/geo/places` - Search places
- **GET** `/api/geo/venues` - Search venues
- **GET** `/api/geo/coordinates` - Get coordinates
- **GET** `/api/geo/address-autocomplete` - Address autocomplete
- **GET** `/api/geo/place-details` - Place details
- **GET** `/api/venues/search` - Search venues
- **GET** `/api/map/static` - Get static map

## 📁 File Uploads
- **POST** `/api/uploads` - Upload file
- **POST** `/api/uploads/proofs` - Upload payment proof

## 🔍 Lookups & External
- **GET** `/api/lookups` - Get lookup data
- **GET** `/api/lookups/[id]` - Get specific lookup
- **GET** `/api/external/eventbrite` - Eventbrite integration

## 🏢 Tenants & Users
- **GET** `/api/tenants` - List tenants
- **POST** `/api/tenants` - Create tenant
- **GET** `/api/tenants/check-slug` - Check slug availability
- **GET** `/api/user/city` - Get user city
- **POST** `/api/user/switch-tenant` - Switch tenant
- **GET** `/api/verification/profile` - Verify profile

## 🎯 Audit Trail
- **GET** `/api/events/[id]/audit` - Get audit logs

---

## 📊 Summary Statistics

### Total API Endpoints: **150+**

### By Category:
- **Events**: 20 endpoints
- **Design Module**: 14 endpoints (✅ 3 new floor plan endpoints)
- **Registrations**: 14 endpoints
- **Tickets**: 7 endpoints
- **Seats**: 4 endpoints
- **RSVP**: 13 endpoints
- **Orders & Payments**: 13 endpoints
- **Promo Codes**: 10 endpoints
- **Speakers & Sessions**: 14 endpoints
- **Sponsors & Exhibitors**: 10 endpoints
- **Team Management**: 8 endpoints
- **Reports**: 7 endpoints
- **Communications**: 14 endpoints
- **Admin & Users**: 7 endpoints (✅ 2 new user management endpoints)
- **Other**: 25+ endpoints

### Recently Added: ✅
1. **POST `/api/admin/users`** - Create user (Super Admin)
2. **DELETE `/api/admin/users/[id]`** - Delete user (Super Admin)
3. **GET `/api/events/[id]/design/floor-plan`** - List floor plans
4. **POST `/api/events/[id]/design/floor-plan`** - Create floor plan
5. **DELETE `/api/events/[id]/design/floor-plan/[planId]`** - Delete floor plan

### Fixed Issues: ✅
1. ✅ FloorPlan table created in database
2. ✅ Site design form removed from design module
3. ✅ Floor plans now listed in design module
4. ✅ 500 errors on floor-plan and site APIs resolved
