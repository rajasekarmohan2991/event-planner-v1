# Deployment Guide - Event Planner V1

## 🎯 Current Status

Your application is **already deploying to Vercel automatically** on every git push to the main branch.

**Vercel Dashboard**: https://vercel.com/dashboard
**Deployment Region**: Mumbai (bom1)

---

## 📋 Deployment Options

Since this is a **Next.js full-stack application** (frontend + backend API routes in one app), you have two deployment options:

### **Option 1: Vercel (Recommended)** ✅
- ✅ Already configured and working
- ✅ Automatic deployments on git push
- ✅ Optimized for Next.js
- ✅ Free tier available
- ✅ Global CDN
- ✅ Serverless functions for API routes

### **Option 2: Render**
- Deploy entire Next.js app to Render
- Full server control
- Can use Render PostgreSQL
- Good for long-running processes

---

## 🚀 Option 1: Vercel Deployment (Current Setup)

### **What's Already Configured**

1. **Vercel Configuration** (`apps/web/vercel.json`):
```json
{
  "version": 2,
  "buildCommand": "NEXT_TELEMETRY_DISABLED=1 npx prisma generate && NEXT_TELEMETRY_DISABLED=1 next build",
  "installCommand": "npm install --legacy-peer-deps --no-audit --no-fund",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["bom1"]
}
```

2. **Automatic Deployments**: 
   - Every push to `main` branch triggers deployment
   - Preview deployments for pull requests

### **Required Environment Variables on Vercel**

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database?schema=public

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-key-here

# Email (if using)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@your-domain.com

# File Upload (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe/Razorpay (if using)
STRIPE_SECRET_KEY=sk_test_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Other
NODE_ENV=production
```

### **Database Options for Vercel**

#### **Option A: Neon (Recommended)**
- Free PostgreSQL database
- Serverless, scales to zero
- Perfect for Vercel

**Setup**:
1. Go to https://neon.tech
2. Create account and new project
3. Copy connection string
4. Add to Vercel as `DATABASE_URL`

#### **Option B: Supabase**
- Free PostgreSQL + Storage + Auth
- 500MB database, 1GB storage

**Setup**:
1. Go to https://supabase.com
2. Create project
3. Get connection string from Settings → Database
4. Add to Vercel as `DATABASE_URL`

#### **Option C: Vercel Postgres**
- Native Vercel integration
- Paid service

**Setup**:
1. Vercel Dashboard → Storage → Create Database
2. Select Postgres
3. Automatically adds `DATABASE_URL`

### **Deployment Steps**

1. **Push to GitHub**:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Vercel Auto-Deploys**:
   - Detects changes
   - Runs build command
   - Generates Prisma client
   - Builds Next.js app
   - Deploys to production

3. **Check Deployment**:
   - Go to Vercel Dashboard
   - Check deployment logs
   - Visit your production URL

### **Post-Deployment**

1. **Run Database Migrations**:
```bash
# In Vercel Dashboard → Settings → Functions
# Or run locally against production DB
npx prisma migrate deploy
```

2. **Verify**:
   - Visit your app URL
   - Test login
   - Test API endpoints
   - Check database connections

---

## 🔧 Option 2: Render Deployment

### **Why Choose Render?**
- Full server control
- Long-running processes
- WebSocket support
- Integrated PostgreSQL
- Free tier available

### **Setup Steps**

#### **1. Create Render Account**
- Go to https://render.com
- Sign up with GitHub

#### **2. Create PostgreSQL Database**

1. Dashboard → New → PostgreSQL
2. Name: `event-planner-db`
3. Region: Singapore (closest to India)
4. Plan: Free
5. Create Database
6. Copy **Internal Database URL**

#### **3. Create Web Service**

1. Dashboard → New → Web Service
2. Connect GitHub repository
3. Configure:

```yaml
Name: event-planner-v1
Region: Singapore
Branch: main
Root Directory: apps/web
Runtime: Node
Build Command: npm install --legacy-peer-deps && npx prisma generate && npm run build
Start Command: npm run start
```

#### **4. Environment Variables**

Add in Render Dashboard → Environment:

```bash
DATABASE_URL=<Internal Database URL from step 2>
NEXTAUTH_URL=https://event-planner-v1.onrender.com
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NODE_ENV=production

# Add other variables as needed
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### **5. Deploy**

1. Click "Create Web Service"
2. Render will:
   - Clone repository
   - Install dependencies
   - Generate Prisma client
   - Build Next.js app
   - Start server
3. Wait 5-10 minutes for first deployment

#### **6. Run Migrations**

After deployment, run migrations:

1. Dashboard → Your Service → Shell
2. Run:
```bash
npx prisma migrate deploy
```

Or use Render's PostgreSQL dashboard to run SQL directly.

---

## 🔄 Hybrid Approach (Advanced)

### **Frontend on Vercel + Backend on Render**

If you want to separate concerns:

#### **1. Split the Application**

**Frontend (Vercel)**:
- Deploy Next.js app to Vercel
- Configure API routes to proxy to Render backend

**Backend (Render)**:
- Create separate Express.js API
- Move all `/app/api` routes to Express
- Deploy to Render

#### **2. Configuration**

**Vercel** (`next.config.js`):
```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://your-backend.onrender.com/api/:path*'
      }
    ]
  }
}
```

**Render** (Express.js):
```javascript
const express = require('express')
const app = express()

// CORS for Vercel
app.use(cors({
  origin: 'https://your-app.vercel.app'
}))

// Your API routes
app.use('/api', apiRoutes)

app.listen(process.env.PORT || 3001)
```

⚠️ **Note**: This approach requires significant refactoring and is not recommended for this project.

---

## 📊 Comparison

| Feature | Vercel | Render |
|---------|--------|--------|
| **Setup** | ✅ Already configured | ⚠️ Needs setup |
| **Next.js Support** | ✅ Native | ⚠️ Generic Node |
| **Auto Deploy** | ✅ Yes | ✅ Yes |
| **Free Tier** | ✅ Generous | ✅ Limited |
| **Database** | ⚠️ External needed | ✅ Integrated |
| **Build Time** | ✅ Fast | ⚠️ Slower |
| **Cold Starts** | ⚠️ Serverless | ✅ Always on |
| **Region** | ✅ Mumbai (bom1) | ✅ Singapore |
| **Cost** | Free → $20/mo | Free → $7/mo |

---

## ✅ Recommended Deployment

### **Use Vercel (Current Setup)**

**Reasons**:
1. ✅ Already configured and working
2. ✅ Optimized for Next.js
3. ✅ Automatic deployments
4. ✅ Fast build times
5. ✅ Global CDN
6. ✅ Free tier is generous

**Database**: Use **Neon** (free, serverless PostgreSQL)

### **Complete Setup Checklist**

- [ ] 1. Create Neon database account
- [ ] 2. Create new Neon project
- [ ] 3. Copy connection string
- [ ] 4. Add to Vercel environment variables:
  - [ ] `DATABASE_URL`
  - [ ] `NEXTAUTH_URL`
  - [ ] `NEXTAUTH_SECRET`
  - [ ] `SMTP_*` (for emails)
  - [ ] `NEXT_PUBLIC_SUPABASE_*` (for file uploads)
- [ ] 5. Push to GitHub (triggers deployment)
- [ ] 6. Wait for Vercel deployment
- [ ] 7. Run database migrations
- [ ] 8. Test production app
- [ ] 9. Configure custom domain (optional)

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] All environment variables set
- [ ] `NEXTAUTH_SECRET` is strong (32+ characters)
- [ ] Database has SSL enabled
- [ ] SMTP credentials are app-specific passwords
- [ ] API routes have authentication checks
- [ ] File uploads have size limits
- [ ] Rate limiting enabled
- [ ] CORS configured properly
- [ ] Error messages don't expose sensitive data

---

## 🚨 Troubleshooting

### **Vercel Build Fails**

**Issue**: Prisma generation fails
**Solution**: 
```bash
# Ensure DATABASE_URL is set in Vercel
# Check build logs for specific error
```

**Issue**: Module not found
**Solution**:
```bash
# Clear Vercel cache
# Redeploy
```

### **Database Connection Fails**

**Issue**: Can't connect to database
**Solution**:
```bash
# Check DATABASE_URL format
# Ensure database allows external connections
# Verify SSL settings
```

### **API Routes Return 500**

**Issue**: Server error in production
**Solution**:
```bash
# Check Vercel function logs
# Verify environment variables
# Test API locally with production DB
```

---

## 📝 Post-Deployment Tasks

1. **Set up monitoring**:
   - Vercel Analytics
   - Error tracking (Sentry)
   - Uptime monitoring

2. **Configure custom domain**:
   - Vercel → Settings → Domains
   - Add your domain
   - Update DNS records

3. **Set up CI/CD**:
   - Already configured with Vercel
   - Add tests before deployment

4. **Database backups**:
   - Neon: Automatic backups
   - Or use `pg_dump` regularly

5. **Performance optimization**:
   - Enable Vercel Analytics
   - Monitor Core Web Vitals
   - Optimize images

---

## 🎉 Summary

**Current Status**: ✅ Already deploying to Vercel automatically

**Recommended Action**: 
1. Set up Neon database
2. Add environment variables to Vercel
3. Push to GitHub
4. Done! 🚀

**Your app will be live at**: `https://your-project.vercel.app`

No need for Render unless you have specific requirements for a separate backend server.
