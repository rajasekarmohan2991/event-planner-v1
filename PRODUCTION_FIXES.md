# Production Fixes - Jan 2, 2026

## Issues Reported
1. Floor plan not saving
2. Registration failing
3. Seat selector not appearing
4. Team member add/remove/edit not working
5. Vendor page 500 error
6. Sponsor couldn't be deleted

## Root Cause Analysis

After reviewing the code, I found that while the bug fixes exist in the codebase (committed on Jan 2, 2025), there are several issues preventing them from working in production:

### Issue 1: Floor Plan Not Saving
- **Problem**: The floor plan designer page uses `/api/events/[id]/floor-plan` endpoint
- **Root Cause**: The PUT endpoint expects `body.id` but the frontend sends `floorPlan.id` which might be undefined for new plans
- **Fix Needed**: Update the save logic to handle both new and existing floor plans correctly

### Issue 2: Registration Failing
- **Problem**: Registration API has complex transaction logic with multiple table dependencies
- **Root Cause**: Missing error details in production, likely database schema mismatch or missing tables
- **Fix Needed**: Add better error logging and ensure all required tables exist

### Issue 3: Seat Selector Not Appearing
- **Problem**: SeatSelector component tries to fetch seats but may fail silently
- **Root Cause**: The `/api/events/[id]/seats/availability` endpoint might be failing or returning empty data
- **Fix Needed**: Check if seats are being generated properly and add fallback UI

### Issue 4: Team Member Operations
- **Problem**: Team member add/remove/edit not working
- **Root Cause**: The API endpoints exist but may have authentication or database issues
- **Fix Needed**: Verify the team member API routes are accessible and working

### Issue 5: Vendor Page 500 Error
- **Problem**: Vendor page crashes with 500 error
- **Root Cause**: Despite self-healing schema, the vendor table might still be missing columns in production
- **Fix Needed**: Ensure schema is applied to production Supabase database

### Issue 6: Sponsor Deletion
- **Problem**: Sponsor deletion not working
- **Root Cause**: The DELETE endpoint exists but might be failing silently
- **Fix Needed**: Add proper error handling and user feedback

## Action Plan
1. Run database migration on Supabase to ensure all tables and columns exist
2. Add comprehensive error logging to all failing endpoints
3. Fix floor plan save logic to handle new/existing plans
4. Add fallback UI for seat selector when no seats exist
5. Test all endpoints with production database
6. Deploy fixes to Vercel
