# URGENT: Force Vercel to Regenerate Prisma Client

## The Problem
Vercel is caching the OLD Prisma Client that expects `FloorPlanStatus` enum.
The 500 error is happening because:
```
Type 'string' is not assignable to type 'FloorPlanStatus | undefined'
```

## The Solution
This commit includes:

1. **Schema Change** (already done)
   - `FloorPlan.status` changed from enum to String

2. **Cache Busting**
   - Added `.vercelignore` to prevent Prisma Client caching
   - Added `PRISMA_CACHE_BUST.txt` to force rebuild

3. **Enhanced Logging**
   - Floor plan POST handler now logs every step
   - Will show exact error in Vercel logs

## Deployment Instructions

### Step 1: Commit and Push
```bash
cd "/Users/rajasekar/Event Planner V1"
git add -A
git commit -m "CRITICAL: Force Prisma Client regeneration - Fix FloorPlan enum error

- Added .vercelignore to prevent @prisma/client caching
- Added cache-busting file
- Enhanced error logging in floor-plan POST handler
- Schema already updated: FloorPlan.status is now String type"
git push
```

### Step 2: Force Clean Build on Vercel
**IMPORTANT**: You MUST do this in Vercel dashboard:

1. Go to https://vercel.com/your-project/settings/general
2. Scroll to "Build & Development Settings"
3. Click "Edit" next to "Build Command"
4. Change it temporarily to:
   ```
   rm -rf node_modules/@prisma/client && npm run build
   ```
5. Click "Save"
6. Go to Deployments tab
7. Click "..." on latest deployment → "Redeploy"
8. Select "Use existing Build Cache" = **OFF** ✅
9. Click "Redeploy"

### Step 3: Verify Build Logs
Watch the build logs for:
```
✔ Generated Prisma Client (v5.22.0)
```

This MUST appear BEFORE the Next.js build starts.

### Step 4: Test
After deployment completes:
1. Visit `/api/health-check` - should show `schemaCheck: "STRING_TYPE_ACCEPTED"`
2. Try creating a floor plan
3. Check Vercel Function Logs for the detailed logging

### Step 5: Restore Build Command (Optional)
After successful deployment, you can restore the build command to:
```
npm run build
```

## Why This Happened
- Vercel caches `node_modules/@prisma/client` between builds
- Even though `schema.prisma` changed, the cached client wasn't regenerated
- The `postinstall` script runs AFTER cache restoration, so it didn't help

## Alternative: Environment Variable
If the above doesn't work, add this to Vercel Environment Variables:
```
PRISMA_GENERATE_SKIP_AUTOINSTALL=false
```

Then redeploy.
