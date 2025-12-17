# Deployment Guide

This guide ensures a smooth deployment process for the Event Planner application on **Render** (Backend) and **Vercel** (Frontend) using Native Runtimes (No Docker).

## 1. Backend Deployment (Render)

We are using Render's **Native Java Environment** (not Docker) for the Spring Boot API.

### Configuration
*   **Runtime**: Java (OpenJDK 21 or 17)
*   **Build Command**: `cd apps/api-java && mvn clean package -DskipTests`
*   **Start Command**: `cd apps/api-java && java -jar target/*.jar`

### Required Environment Variables (Render Dashboard)
Go to your Render Service -> Environment and add these:

| Key | Value / Notes |
| :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DATABASE_URL` | Your Supabase connection string. **ensure** `?sslmode=disable` is NOT used here if Supabase requires SSL (usually transaction pooler `6543` supports it). Standard JDBC format: `jdbc:postgresql://host:6543/postgres?user=...` |
| `CORS_ORIGINS` | Your Vercel Frontend URL (e.g., `https://your-app.vercel.app`). **No trailing slash**. |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary Secret |
| `PORT` | `8080` (Render sets this automatically, but good to check) |

---

## 2. Frontend Deployment (Vercel)

We use Vercel's standard **Next.js** deployment (No Docker).

### Configuration
*   **Root Directory**: `apps/web` (Important: Set this in Vercel Project Settings)
*   **Framework Preset**: Next.js
*   **Build Command**: `next build` (Default)
*   **Install Command**: `npm install` (Default)

### Required Environment Variables (Vercel Project Settings)

| Key | Value / Notes |
| :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | The URL of your Render Backend (e.g., `https://event-planner-api.onrender.com`). **No trailing slash**. |
| `NEXTAUTH_URL` | Your Vercel Deployment URL (e.g., `https://your-app.vercel.app`). |
| `NEXTAUTH_SECRET` | A long random string (generate one with `openssl rand -base64 32`). |
| `DATABASE_URL` | Same PostgreSQL connection string as backend (used for NextAuth Adapter). |

**Note**: Since `apps/web/lib/apiBase.ts` uses `NEXT_PUBLIC_API_BASE_URL`, setting this variable is CRITICAL for the frontend to talk to the backend.

---

## 3. Database & Roles (Fixing "Redirect" Issues)

If you experience "infinite redirect" loops or missing access:

1.  **Run Migrations**: Ensure your production database has the latest schema.
    *   Locally run: `npx prisma migrate deploy` (pointing `DATABASE_URL` to prod) OR manually execute SQL scripts.
2.  **Verify Roles**: The application now supports `ADMIN` and `STAFF` roles.
    *   If using an existing database, ensure the `SystemRole` and `TenantRole` enums are updated.
    *   The Middleware has been patched to allow `STAFF` and `ADMIN` access to dashboard routes.

## 4. Troubleshooting

*   **App works locally but not on server**:
    *   Check Browser Console (F12) -> Network Tab. access to `/api/...` failing?
    *   If failing with CORS, check `CORS_ORIGINS` in Render.
    *   If failing with 404, check `NEXT_PUBLIC_API_BASE_URL`.
*   **Redirect Loop**:
    *   Clear your browser cookies.
    *   Ensure your user role in the database is one of the allowed roles in `middleware.ts` (we just added `STAFF` and `ADMIN`).


