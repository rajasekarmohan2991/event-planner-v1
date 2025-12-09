# EventPlanner V1 – Workflow

Repo root: `/Users/rajasekar/Event Planner V1`
Web: `apps/web`
API: `apps/api-java`

## 1) Auth Flow
- Pages: `app/auth/login`, `app/auth/register`, protected home `app/page.tsx`.
- Guard: `app/page.tsx` uses `useSession()` and redirects unauthenticated to `/auth/login`.
- Login UI: `components/auth/LoginClient.tsx` → `LoginForm`.
- If already signed in on login page, shows modern "Sign out and switch account" button.
- Sign out in header user menu and login page CTA.

## 2) Theme (Light/Dark/System)
- Provider: `components/theme-provider.tsx` via `next-themes` (single provider in `app/layout.tsx`).
- Toggle: `components/mode-toggle.tsx` (mounted state fix, visible icons, active highlight).
- Styles: `app/globals.css` CSS vars; dropdowns fixed via `components/ui/dropdown-menu.tsx` (explicit `bg-popover text-popover-foreground`).

## 3) Create Event
- Entry: Header "Create Event" → `/events/new`.
- Page: `app/events/new/page.tsx` (form + side panel).
- Form: `components/events/CreateEventForm.tsx` (RHForm + Zod, client validation).
- API client: `lib/api/events.ts` → `createEventRequest()`.
- Payload (Java `EventRequest`): `{ name, venue?, address?, city, startsAt, endsAt, priceInr, description?, bannerUrl? }`.
- Success: POST `/admin/events` → redirect to `/`.
- Errors: surfaced as inline banner.

## 4) Header UX
- File: `components/layout/AppShell.tsx`.
- Shows: Sign Up (on `/auth/login` when unauthenticated), Create Event (when authenticated), Theme toggle, Profile menu (details + Sign out).

## 5) Env & URLs
- Web: `NEXT_PUBLIC_API_URL` (e.g., `http://localhost:8081/api`).
- Docker compose runs web (3001) and API (8081).

## 6) QA Checklist
- Auth redirects and sign out work.
- Theme dropdown readable in both themes; icons visible.
- Create Event page submits and persists to DB.

## 7) Next Up
- Optional: convert Create Event to modal; add Category + Event Type wiring; redirect to event details; banner upload.
