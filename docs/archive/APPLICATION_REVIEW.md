# Application Review: Event Planner V1

## 1. Project Overview
Event Planner V1 is a comprehensive, multi-tenant event management platform designed to handle the entire lifecycle of events, from planning and ticketing to check-ins and post-event analytics. It supports various roles including super admins, tenant admins, event managers, exhibitors, and regular attendees.

## 2. Technology Stack
The application primarily uses a modern web stack:

### Frontend & Core Application (`apps/web`)
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router structure)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, utilizing `@tailwindcss/animate` and `class-variance-authority`.
- **UI Components**: Radix UI primitives, likely combined with a component library (shadcn/ui style), reacting with `framer-motion` for animations.
- **Icons**: Lucide React, React Icons.
- **State/Data Fetching**: React Query (`@tanstack/react-query`).
- **Forms**: React Hook Form with Zod validation.

### Backend Services
- **Primary Backend**: Next.js API Routes (`apps/web/app/api`).
- **Secondary Service**: Java-based API (`apps/api-java`) using Maven, likely for specific processing tasks or enterprise integrations.
- **Database**: PostgreSQL (managed via Prisma ORM).
- **Authentication**: NextAuth.js (supporting multiple providers).
- **Payments**: Stripe & Razorpay integration.

### Infrastructure & DevOps
- **Containerization**: Docker (Dockerfiles for web, api-java, and `docker-compose.yml` for orchestration).
- **Testing**:
  - Unit/Integration: Vitest
  - E2E: Playwright
- **Package Management**: npm (with likely Turborepo or similar workspace management implied by `apps/` structure).

## 3. Project Structure
The project follows a monorepo-like structure:
- **Root**: Configuration files, scripts, and documentation (`docs/`).
- **apps/web**: The main full-stack Next.js application containing both frontend UI and backend API logic.
- **apps/api-java**: A Java backend service.
- **apps/feed-server**: A clearer separation for feed-related functionality (likely a microservice).

## 4. Database & Data Model
The Prisma schema (`apps/web/prisma/schema.prisma`) is robust and covers:
- **Multi-tenancy**: `Tenant`, `TenantMember` models allowing for isolated organizations.
- **User Management**: `User`, `Account` (OAuth), `Profile`, `Verification` (KYC/Organizers).
- **Event Management**: `Event` (implied), `Session`, `Speaker` (implied).
- **Commerce**: `Ticket`, `Registration`, `Order`, `PromoCode`.
- **Engagement**: `RSVP`, `Attendee`, `FeedPost` (Social), `ScheduledNotification`.
- **Exhibitors**: `Exhibitor`, `Booth`, `BoothAsset`.
- **CMS**: `EventSite` for dynamic event landing pages.

## 5. Frontend Architecture
- **Design System**: A sophisticated Tailwind configuration defining custom color palettes (`brand`, `celebration`, `energy`) and custom animations (`float`, `shimmer`, `confetti`).
- **Layouts**: Uses Next.js App Router layouts to separate Authentication, Admin, Dashboard, and Tenant contexts.
- **Components**: Structured in `components/` with likely separation for `ui` (primitives) and feature-specific components (`home`, `dashboard`).
- **Visuals**: High emphasis on aesthetics with gradients, glassmorphism (`backdrop-blur`), and Lottie animations.

## 6. Key Features Identified
- **Dynamic Event Microsites**: Users can publish custom pages for events.
- **Advanced Ticketing**: Support for tiered tickets, promo codes, and cancellations.
- **Exhibitor Portal**: Management of booths, staff, and assets.
- **Communication Suite**: Email/SMS campaigns with scheduling.
- **Interactive Floor Plans**: (Inferred from Exhibitor/Booth models).
- **Social Feed**: Internal social network features for event attendees.
- **Verification flows**: KYC for individuals and organizers.

## 7. Observations & Quality Assessment
- **Documentation**: The project is exceptionally well-documented with numerous `.md` files tracking fixes, builds, and features in the root directory.
- **Code Quality**: Usage of TypeScript ensures type safety. The directory structure in `app/` is logical and scalable.
- **Testing Culture**: Strong presence of testing setups (Vitest, Playwright scripts) indicates a focus on reliability.
- **Complexity**: The schema and API route count suggests a high level of complexity. The dual-backend approach (Next.js + Java) might introduce integration challenges but offers flexibility.

## 8. Recommendations
1.  **Code Splitting**: ensure `apps/web/app/api` doesn't become too monolithic. Consider moving heavy logic to `server-actions` or dedicated services if not already done.
2.  **Java Service Integration**: Ensure clear documentation on the role of `api-java` vs the Next.js API to avoid logic duplication.
3.  **Performance**: With such a rich UI (animations, gradients), ensure `Lighthouse` scores are monitored, especially for event landing pages.
4.  **Database Indexing**: The Prisma schema already includes many indexes, which is good. Continue monitoring query performance as data grows, especially for multi-tenant queries.
