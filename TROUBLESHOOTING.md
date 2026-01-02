# ✅ Troubleshooting Report - Update

## 🔍 Recent Error: Persistent 500 (Floor Plan & Registration)
**Cause**:
1. **Floor Plan**: The database was rejecting the query because we were sending a "Text" ID to check a "BigNumber" column. Postgres assumes they don't match unless explicitly told to convert.
2. **Registration**: The table `registrations` might have been missing the `ticket_id` column in some environments, causing the save to fail. Also, the `Order` table expected a String Event ID but we were strictly sending a BigInt.

**Fix**:
1. **Floor Plan**: Added explicit `::bigint` casting in the query so the database knows how to handle the ID check.
2. **Registration**: 
   - Added a check to automatically Create/Update the `registrations` table with the missing `ticket_id` column.
   - Updated the Order creation to pass the Event ID as a String, matching the official schema.
3. **Debug**: Enabled detailed error messages. If you see a 500 error again, the "Network" tab response will now show the exact reason (e.g., "column X missing").

---

## 🛠️ Action Plan

1. **Wait 1 minute** for deployment.
2. **Refresh** the page.
3. Test both **Floor Plan listing** and **Registration**.
