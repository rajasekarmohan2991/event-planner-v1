# Issues to Fix

## 1. Registration Settings - "Failed to load"
**Problem**: `/api/events/[id]/registration-settings` is trying to call Java API but endpoint doesn't exist
**Solution**: Use Prisma to read/write from `RegistrationSettings` table directly

## 2. Registration Approvals - "Failed to load"
**Problem**: Works but may have permission issues
**Solution**: Verify RBAC and add better error handling

## 3. Cancellation Approvals - "Failed to load"  
**Problem**: Similar to registration approvals
**Solution**: Check endpoint and add error handling

## 4. Sessions - "Failed to save"
**Problem**: Proxying to Java API which may not have the endpoint
**Solution**: Check Java API or implement in Next.js with Prisma

## Quick Fixes Being Applied:
1. Fix registration-settings to use Prisma directly
2. Add better error messages
3. Ensure all tables exist in database
4. Add proper RBAC checks
