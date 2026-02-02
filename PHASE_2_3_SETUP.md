# 📦 Package Dependencies for Phase 2 & 3

## Required NPM Packages

Run these commands in the `apps/web` directory:

```bash
# Phase 2: Frontend Optimization
npm install @tanstack/react-query@latest
npm install @tanstack/react-query-devtools@latest

# Image optimization (if not already installed)
npm install sharp@latest

# Optional: For advanced compression
npm install compression@latest

# Optional: For Redis caching (Phase 3)
npm install ioredis@latest
npm install @types/ioredis@latest --save-dev
```

## Update package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "analyze": "ANALYZE=true next build",
    "postbuild": "next-sitemap"
  }
}
```

## Environment Variables

Add these to your `.env.local`:

```env
# Performance
NEXT_PUBLIC_ENABLE_SW=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Redis (if using)
REDIS_URL=your_redis_url_here

# Push Notifications (optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

## Vercel Configuration

Add to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

## Next Steps

1. **Install dependencies:**
   ```bash
   cd apps/web
   npm install @tanstack/react-query @tanstack/react-query-devtools
   ```

2. **Update next.config.js:**
   - Copy contents from `next.config.optimized.js`
   - Merge with your existing config

3. **Wrap app with React Query Provider:**
   - Import `ReactQueryProvider` in your root layout
   - Wrap children with the provider

4. **Enable service worker:**
   - Add `useServiceWorker()` hook in root layout
   - Deploy and test offline functionality

5. **Test performance:**
   - Run Lighthouse audit
   - Check Network tab for cache hits
   - Monitor server logs for performance metrics
