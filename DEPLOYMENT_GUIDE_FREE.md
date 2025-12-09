# Zero-Cost Deployment Guide (Supabase + Render + Vercel)

This guide will help you deploy your Event Planner application for free without using a credit card (in most cases).

## Architecture
- **Database**: **Supabase** (Free PostgreSQL).
- **Backend API**: **Render** (Free Web Service for Java API).
- **Frontend**: **Vercel** (Free Next.js Hosting).
- **Code Hosting**: **Bitbucket**.

---

## Step 1: Push Code to Bitbucket

1.  **Initialize Git** (if not done):
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```

2.  **Create Repository on Bitbucket**:
    - Go to [Bitbucket](https://bitbucket.org/).
    - Click **Create > Repository**.
    - Name it `event-planner-v1`.
    - Uncheck "Private repository" if you want it public (easier for Vercel/Render integration), or keep it private (requires auth setup).

3.  **Push Code**:
    - Copy the "git remote add" command from Bitbucket.
    - Run it in your terminal:
      ```bash
      git remote add origin https://bitbucket.org/YOUR_USERNAME/event-planner-v1.git
      git push -u origin master
      ```

---

## Step 2: Setup Database (Supabase)

1.  Go to [Supabase](https://supabase.com/) and sign up.
2.  **Create New Project**:
    - Name: `event-planner-db`
    - Password: **Save this password!**
    - Region: Choose one close to you (e.g., Mumbai, Singapore).
3.  **Get Connection String**:
    - Go to **Project Settings > Database**.
    - Under "Connection string", select **Node.js** or **URI**.
    - Copy the `postgresql://...` URL.
    - *Replace `[YOUR-PASSWORD]` with the password you created.*
4.  **Run Migrations**:
    - Update your local `.env` file in `apps/web` with this new URL temporarily.
    - Run:
      ```bash
      cd apps/web
      npx prisma db push
      ```
    - This creates all the tables in your Supabase database.

---

## Step 3: Deploy Java Backend (Render)

1.  Go to [Render](https://render.com/) and sign up.
2.  **Create New Web Service**:
    - Connect your Bitbucket repository.
    - **Name**: `event-planner-api`
    - **Root Directory**: `apps/api-java`
    - **Runtime**: **Docker**
    - **Instance Type**: **Free**
3.  **Environment Variables** (Advanced):
    - Add `DATABASE_URL` = (Your Supabase URL)
    - Add `PORT` = `8080`
4.  **Deploy**:
    - Click **Create Web Service**.
    - Wait for the build to finish.
    - **Copy the Service URL** (e.g., `https://event-planner-api.onrender.com`).
    - *Note: The free tier spins down after 15 minutes of inactivity. The first request will be slow.*

---

## Step 4: Deploy Frontend (Vercel)

1.  Go to [Vercel](https://vercel.com/) and sign up.
2.  **Add New Project**:
    - Import from Bitbucket.
    - Select your `event-planner-v1` repo.
3.  **Configure Project**:
    - **Framework Preset**: Next.js
    - **Root Directory**: `apps/web` (Click Edit to change this!)
4.  **Environment Variables**:
    - `DATABASE_URL`: (Your Supabase URL)
    - `INTERNAL_API_BASE_URL`: (Your Render Backend URL, e.g., `https://event-planner-api.onrender.com`)
    - `NEXT_PUBLIC_API_BASE_URL`: (Same as above)
    - `NEXTAUTH_SECRET`: (Generate a random string, e.g., `openssl rand -base64 32`)
    - `NEXTAUTH_URL`: (Leave empty, Vercel sets this automatically, or set to your Vercel domain later)
5.  **Deploy**:
    - Click **Deploy**.
    - Once finished, you will get a dashboard URL (e.g., `https://event-planner-v1.vercel.app`).

---

## Step 5: Final Check
1.  Open your Vercel URL.
2.  Login/Register.
3.  Create an event (this tests the Java API connection).
4.  Register for an event (this tests the Database connection).

**Enjoy your free deployment!**
