# 🚀 Zero-to-Production Deployment Guide
This guide covers explicitly how to connect **Supabase** (Database), **Render** (API), and **Vercel** (Web) for a fully automated CI/CD pipeline.

---

## 🛑 Step 1: Database Setup (Supabase)
*If you already have a project, skip to "Get Credentials".*
1.  **Create Project**: Log in to [Supabase](https://supabase.com) and create a new project.
2.  **Get Credentials**:
    *   Go to **Project Settings** > **Database**.
    *   Scroll to **Connection parameters**.
    *   **Host**: `db.xyz.supabase.co`
    *   **User**: `postgres`
    *   **Password**: (The one you set when creating the project)
    *   **Database**: `postgres`
    *   **Port**: `5432` (for Transaction/Direct) or `6543` (for Session Mode)
    *   **Connection String (Node/Prisma)**: Use the "Transaction" or "Session" mode string.
        *   Format: `postgresql://postgres:[PASSWORD]@db.xyz.supabase.co:6543/postgres?pgbouncer=true`

---

## 🚀 Step 2: Deploy Backend API (Render)
*The API must be running first so the Web App has something to talk to.*

1.  **Connect GitHub**: Go to [Render Dashboard](https://dashboard.render.com). Click **New +** > **Web Service**.
2.  **Select Repository**: Choose your `Event Planner V1` repo.
3.  **Configuration**:
    *   **Root Directory**: `apps/api-java`
    *   **Runtime**: **Java** (OpenJDK 17/21 is standard on Render).
    *   **Build Command**: `mvn clean package -DskipTests`
    *   **Start Command**: `java -jar target/*.jar`
4.  **Environment Variables** (Add these in the "Environment" tab):
    *   `SPRING_PROFILES_ACTIVE`: `prod`
    *   `SPRING_DATASOURCE_URL`: `jdbc:postgresql://db.xyz.supabase.co:5432/postgres` (Use your Supabase host, port 5432 is best for Java JDBC)
    *   `SPRING_DATASOURCE_USERNAME`: `postgres`
    *   `SPRING_DATASOURCE_PASSWORD`: `[YOUR_SUPABASE_PASSWORD]`
    *   `PORT`: `8080` (Standard for Spring Boot)
5.  **Deploy**: Click **Create Web Service**.
6.  **Copy URL**: Once live, copy the URL (e.g., `https://event-planner-api.onrender.com`).

---

## 🌐 Step 3: Deploy Web App (Vercel)
*Now deploy the frontend that talks to your Render API.*

1.  **Import Project**: Go to [Vercel Dashboard](https://vercel.com/new). Import the `Event Planner V1` repo.
2.  **Configuration**:
    *   **Framework Preset**: Next.js (Auto-detected).
    *   **Root Directory**: Click "Edit" and select `apps/web`.
3.  **Environment Variables** (Expand the section):
    *   `DATABASE_URL`: `postgresql://postgres:[PASSWORD]@db.xyz.supabase.co:6543/postgres?pgbouncer=true` (Use the Supabase "Transaction" connection string here)
    *   `NEXT_PUBLIC_API_BASE_URL`: `https://event-planner-api.onrender.com` (Your Render URL)
    *   `INTERNAL_API_BASE_URL`: `https://event-planner-api.onrender.com`
    *   `NEXTAUTH_URL`: `https://[YOUR-VERCEL-PROJECT].vercel.app` (You can add this *after* the first deploy generates the URL, or guess it if you know the name)
    *   `NEXTAUTH_SECRET`: Generate a random string (e.g. use `openssl rand -base64 32`).
4.  **Deploy**: Click **Deploy**.

---

## 🔄 Step 4: Final Database Sync
*Your code has database migrations that need to run on the production database.*

1.  **Local Machine**: In your terminal, verify you can connect to Supabase.
2.  **Run Migrations**:
    ```bash
    # Set the DATABASE_URL to your Supabase connection string temporarily
    export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xyz.supabase.co:6543/postgres?pgbouncer=true"

    # Go to web app folder
    cd apps/web

    # Push schema to Supabase
    npx prisma db push
    ```
    *(Alternatively, you can configure the Build Command in Vercel to `npx prisma db push && next build`, but running it once locally is safer)*.

---

## ✅ Step 5: Verification
1.  Open your **Vercel URL**.
2.  **Loading Check**: The initial load might be slow if Render is "waking up". Wait 60s.
3.  **Login**: Try logging in. If Google OAuth fails, ensure you added the Vercel domain to your **Google Cloud Console** > **Authorized Javascript Origins** and **Authorized Redirect URIs**.
