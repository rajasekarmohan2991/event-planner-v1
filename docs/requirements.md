# Event Planner Assistant — Product Requirements

Last updated: 2025-10-07 12:35 (IST)
Owner: Product
Status: Draft v1

## 1. Vision
A comprehensive event management platform that helps individuals, organizations, and agencies to:
- Plan and manage tasks
- Invite and engage guests
- Track budgets and vendors
- Enable on-site check-in and hybrid events
- Deliver post-event analytics and value

It merges the simplicity of a task planner with the power of enterprise-grade event tools like Zoho Backstage, Eventbrite, and Cvent.

## 2. Target Users
- Families / Individuals → weddings, birthdays, anniversaries
- Organizations → conferences, product launches, trade shows, team outings
- Agencies → professional event planners and vendors
- Students / NGOs → cultural fests, charity events

## 3. Core Functionalities

### A. Event Creation and Management
- Create single or recurring events
- Event microsite builder (custom branding, themes, custom domains)
- Role-based access: Organizer, Co-Organizer, Guest, Vendor, Staff
- Multi-language and multi-currency support
 - City-aware venue suggestions (places autocomplete) on Create Event
 - Planning metadata capture during creation: Budget (INR) and Expected Attendees

### B. Task and Resource Management
- To-do lists with deadlines, priorities, reminders
- Assign tasks to team members, vendors, volunteers
- Resource tracking: rooms, equipment, staff
- Progress dashboards: % tasks done, overdue tasks
- Automated workflows: e.g., "When venue booked → notify catering team"

### C. Guest Registration and Ticketing
- Custom registration forms (conditional logic)
- Free / paid / tiered tickets (VIP, early bird, student pass)
- Waitlist support and ticket capacity control
- QR code / NFC badges auto-generated
- Group registration (families, teams)
- Discount codes, promo codes, referrals

### D. Guest and Attendee Engagement
- Digital invitations + RSVP tracking
- Personalized agendas (attendees pick sessions)
- Live polling, Q&A, chat rooms
- Gamification: earn points for attending sessions, visiting booths
- Networking: AI-based matchmaking (interests, job role)
- Social wall: guests share live photos, comments

### E. Travel and Venue Guide
- Venue maps with Google Maps integration
- Interactive floor plans (booths, stages, stalls)
- Suggested hotels, transport, parking
- Group travel coordination (carpool, shuttle buses)
- Offline venue map (useful in poor connectivity)

### F. Budget and Expense Tracking
- Budget categories (venue, catering, décor, music, marketing)
- Planned vs. actual cost tracking
- Multi-currency support with FX conversion
- Split expenses between organizers (like Splitwise)
- Automated invoices, receipts
- Vendor payments and commission tracking

### G. Vendor, Sponsor, and Exhibitor Management
- Vendor marketplace (caterers, photographers, decorators)
- Exhibitor booth management with floor plan assignments
- Sponsor pages with logos, offers, custom branding
- Self-service portals for vendors to upload info
- Lead scanning (exhibitors scan QR badges to capture contacts)

### H. Speaker and Content Management
- Speaker profiles (bio, photo, social links)
- Upload presentations, rehearse, manage sessions
- Session management: tracks, sub-tracks, timings
- On-demand content library (recorded sessions)
- Live streaming and hybrid event support

### I. On-site Event Operations
- Guest check-in (QR/NFC scanning)
- Badge printing kiosks
- Staff assignments (security, ushers, volunteers)
- Real-time attendance tracking
- Offline check-in mode (syncs later)

### J. Analytics and Reporting
- Real-time dashboard: registrations, attendance, ticket sales
- Session popularity reports
- Budget vs. expense analysis
- Guest feedback and sentiment analysis (text + ratings)
- Post-event summary: highlights, challenges, recommendations

### K. Marketing and Branding
- Custom branded microsites and event apps
- Social media sharing integrations
- Email campaigns with templates
- Affiliate/referral tracking
- Certificates (attendance, participation)

### L. Accessibility and Inclusivity
- Screen reader support, high contrast mode
- Multi-language translations
- Real-time captions and subtitles for sessions
- Accessibility-friendly maps and navigation

## 4. UI/UX Flow (Mobile and Web)

### Organizer Side
- Dashboard – overview of all events
- Events List – supports List/Grid views and simplified sorting (Date/Name with ↑/↓)
- Event Builder – event details, branding, ticketing, agenda
- Task Manager – Kanban board for planning
- Guest Manager – RSVPs, ticket sales, check-ins
- Budget Dashboard – planned vs. actual expenses
- Reports – real-time analytics + export

### Guest Side
- Event Invite Page – RSVP + ticket purchase
- Event Home – agenda, sessions, maps, travel guide
- Engagement Zone – Q&A, polls, networking, gamification
- Check-in – QR/NFC badge
- Post-Event Library – access recordings, certificates

## 5. Tech Stack
- Frontend Web → React.js (with Next.js for SEO-friendly microsites)
- Mobile App → React Native
- Backend → Spring Boot (Java, Maven)
- Real-time → Spring WebSocket (STOMP) and SSE; evaluate RSocket if needed
- Database → PostgreSQL (primary), Redis (caching/queues); MongoDB deferred to Phase 2 for engagement/chat
- Authentication → OAuth2, JWT (Spring Security)
  - UX rule: On sign-out, redirect to public landing page. When authenticated and visiting `/`, redirect to `/events/new`.
- Payments → Stripe / Razorpay (multi-currency support)
- Maps and Venue → Google Maps API, Mapbox (for floorplans)
- Streaming → WebRTC, Zoom/Teams integrations
- Notifications → Firebase Cloud Messaging
- File Storage → AWS S3 / Cloudinary

## 6. Monetization
- Freemium
  - Free: event creation, invites, tasks
  - Paid: advanced engagement, analytics, branding
- Tiered Pricing (SaaS)
  - ₹499/event → Basic (100 guests)
  - ₹1,999/event → Pro (500 guests, vendors, budget)
  - Custom pricing → Enterprise (10,000+ guests, white-labeling)
- Vendor Commissions
  - % fee from marketplace vendor bookings
- Premium Add-ons
  - Live streaming, AI matchmaking, offline kiosks, extra storage

## 7. Roles and Permissions (RBAC)
- Organizer: full control over event configuration and finances
- Co-Organizer: manage event modules excluding billing by default
- Staff: limited operational permissions (check-in, support)
- Vendor: manage own listings, orders, invoices
- Exhibitor: manage booth details, lead scanning
- Sponsor: manage branding assets and offers
- Guest: registration, agenda selection, engagement features

## 8. Non-Functional Requirements
- Performance: p95 < 300ms for core APIs; support surges (up to 100 req/s) during check-in
- Availability: 99.9% for paid tiers
- Scalability: horizontal scaling for web, workers, and real-time services
- Security: OWASP ASVS L2, rate limiting, audit logs, encryption at rest and in transit (TLS 1.2+)
- Privacy and Compliance: GDPR-ready, SOC2 roadmap, PCI-DSS for payments via provider
- Observability: centralized logging, metrics, tracing; alerting SLOs defined
- Offline-first: critical operational flows (check-in) must function offline and sync later

## 9. Integrations
- Payments: Stripe, Razorpay
- Email/SMS: SendGrid, AWS SES, Twilio
- Identity: Google, Microsoft, LinkedIn OAuth
- Maps: Google Maps, Mapbox
- Video: Zoom, MS Teams, WebRTC (TURN/STUN)
- File Storage: AWS S3, Cloudinary
- Notifications: FCM/APNs

## 10. Data Model (High-level)
- Event: id, orgId, name, type, start/end, venue, timezone, branding, settings
- User: id, roles, profile, auth
- Ticket: id, type, price, currency, capacity, benefits, status
- Order: id, buyer, items, payment status, refunds
- Guest/Attendee: id, contact, registration fields, QR/NFC token, agenda
- Session: id, track, speakers, capacity, time, room
- Task: id, assignees, priority, due, status, links
- Vendor: id, category, catalog, pricing, ratings
- BudgetLine: id, category, planned, actual, vendor, invoice
- Engagement: poll, qna, chat messages
- Analytics: events, sessions, attendance, conversions
 - Location: id, placeId, name, displayName, address, city, state, country, lat, lon, timezone, venueType
 - EventPlanning: id, eventId (unique), locationId, budgetInr, expectedAttendees, timestamps

## 11. MVP Scope (Proposed)
- Event creation and microsite (basic theme)
- Ticketing (free + paid), QR code generation, check-in app (basic)
- Guest registration with custom fields, RSVP tracking
- Task manager (lists + assignments + due dates)
- Budget tracker (planned vs. actual, categories)
- Basic analytics dashboard (registrations, sales, check-ins)
- Email invitations and confirmations
 - Places autocomplete for venue selection on Create Event
 - Planning fields persisted (budget, expected attendees) linked to event

Defer to Phase 2: vendor marketplace, sponsors/exhibitors, gamification, AI matchmaking, floor plan editor, live streaming, offline kiosks, advanced workflows.

## 12. Acceptance Criteria (Sample)
- Guests can register, pay, receive QR code, and be checked in on-site (online/offline)
- Organizer can configure tickets (capacity, tiers, promo codes)
- Organizer can assign tasks and track progress
- Budget dashboard shows variance by category and total
- Microsite passes lighthouse 90+ performance (desktop), SEO indexable
- All PII stored encrypted at rest; JWT-based auth with refresh tokens
 - On sign-out, user lands on public landing page; on visiting `/` while authenticated, user is redirected to `/events/new`
 - Events list offers List/Grid views; sorting available by Date/Name with direction toggle (↑/↓)

## 13. Open Questions
- Preferred streaming vendor for hybrid sessions?
- White-label mobile app requirements for Enterprise?
- Data residency requirements for EU customers?

## 14. Risks and Mitigations
- Payment failures during peak traffic → webhook retries, idempotency keys
- Check-in connectivity → offline-first with background sync and conflict resolution
- Fraud (promo code abuse, duplicate tickets) → anomaly detection, rate limits, device binding
- Scope creep → strict MVP, phased roadmap, change control

## 15. Roadmap (High-level)
- Month 0–1: MVP scope, architecture, repo scaffolding, CI/CD
- Month 2–3: Ticketing, registration, check-in, task manager
- Month 4: Budgeting, analytics v1, emails, microsite polish
- Month 5+: Vendor marketplace, engagement suite, streaming, floor plans, mobile polish

## 16. Glossary
- RSVPs: Responses to invitations
- Microsite: Public-facing event page(s)
- Check-in: On-site validation of entry via QR/NFC

---
Document intent: Keep this requirements specification in a separate Markdown file (`docs/requirements.md`).

## 17. Changelog

- 2025-10-07
  - Added Locations and EventPlanning tables and REST endpoints:
    - `/api/locations` (find-or-create by placeId)
    - `/api/events/{eventId}/planning` (GET/POST/PUT)
  - Create Event: city-aware places autocomplete for venue
  - Create Event: added Budget (INR) and Expected Attendees fields
  - UI: Events list supports List/Grid view toggle; sort simplified to Date/Name with ↑/↓ direction
  - Auth UX: Sign-out redirects to landing; authenticated `/` redirects to `/events/new`

## Addendum v2 — Roles, Workflows, Media, Event Types, Ireland Credibility, and Status

### Roles / Personas
- **Super Admin**: platform settings, billing, approvals, global analytics.
- **Support**: assists organizers/attendees, incident handling.
- **Organizer/Host**: creates events, branding, registration, analytics.
- **Event Manager**: daily ops, logistics, vendor/staff coordination.
- **Marketing Lead**: campaigns, landing pages, ads, email.
- **Finance/Ticketing**: pricing, discounts, invoices, refunds.
- **Speaker Manager**: speaker onboarding, sessions, assets.
- **Volunteer/Staff**: on-ground help, check-ins.
- **Attendee**: registration/tickets, agenda, feedback.
- **Speaker**: bio/assets, session delivery, Q&A.
- **Vendor/Exhibitor**: booth/assets, lead capture.
- **Sponsor**: package assets, placements, reports.

### End-to-End Workflow
- **Platform setup** → Super Admin config, organizer onboarding/approval.
- **Event creation** → basics, branding, tickets, team, speakers, sponsors, vendors.
- **Promotion & registration** → landing page, social/email/ads, confirmations, sales tracking.
- **Event execution** → QR check-in, agenda, engagement (polls/Q&A), announcements.
- **Post-event** → thank-you/feedback/certificates, analytics, sponsor reports, follow-ups.

### Media / Promotion Channels
- **Digital**: landing/SEO, email, social (LinkedIn/Instagram/Facebook/X/YouTube/TikTok), content/blogs, video, paid ads, influencers, messaging (WhatsApp/Telegram/SMS).
- **Traditional**: print/radio/TV/outdoor, flyers.
- **Owned**: website/app push/forums/newsletters.
- **Community/Partners**: associations, universities, listing sites.
- **Experiential**: pop-ups, merch, QR to landing.

### Event Types Supported
- **Format**: in-person, virtual, hybrid, multi-venue/day.
- **Purpose**: corporate (conferences/workshops/launches), academic (seminars/fests), marketing (activations/roadshows), cultural/entertainment (concerts/festivals), social (weddings/parties), non-profit (fundraisers/drives), government/institutional, industry-specific.

### Ireland Credibility Checks (Organizer/Events)
- **Legal**: CRO company lookup, EU VIES VAT validation.
- **Insurance**: public liability certificate (coverage/validity).
- **Licenses/Permits**: venue/local authority compliance, stewarding/security.
- **Track record**: past events, testimonials, media/social presence.
- **Payments**: refund policy, gateway verification.
- **Data protection**: GDPR/privacy policy.
- **Ticket anti-fraud**: unique QR, verification.
- **Approval workflow**: auto + manual review, verified organizer badge; pre-event monitoring.

### Completion Status Snapshot (as of this addendum)
- **Admin Dashboard**: Completed
  - APIs: `GET /api/admin/dashboard/stats`, `GET /api/admin/activities/recent`
  - Files: `apps/web/app/api/admin/dashboard/stats/route.ts`, `apps/web/app/api/admin/activities/recent/route.ts`
- **Users & Roles listing**: Completed
  - API: `GET /api/admin/users`
  - File: `apps/web/app/api/admin/users/route.ts`
- **Auth (NextAuth)**: Completed
  - File: `apps/web/lib/auth.ts`
- **Registration (delegated to Java API)**: Partial
  - Proxy: `apps/web/app/api/auth/register/route.ts` (forwards to `:8081/api/auth/register`)
- **Email/SMTP**: Completed (capability)
  - ENV > DB-config (`/api/notifications/smtp-config`) > Ethereal fallback
  - File: `apps/web/lib/email.ts`, `apps/web/app/api/notifications/smtp-config/route.ts`
- **Forgot Password**: Completed
  - API: `apps/web/app/api/auth/forgot-password/route.ts`
- **Invites (users/event members)**: Completed
  - API: `apps/web/app/api/auth/invite/route.ts`
- **Multi-tenancy**: Partial
  - Models: `Tenant`, `TenantMember`, `User.lastTenantId` in `apps/web/prisma/schema.prisma`
  - Slug routing foundation present; scope remaining APIs by `tenantId` pending
- **RSVP / Custom Fields / Attendee APIs / Check-in (QR+offline)**: Pending
- **Ireland credibility module** (CRO/VIES integrations, document uploads, approvals): Pending

For a detailed backlog, see open tasks in the repo and API route coverage under `apps/web/app/api/**`.
