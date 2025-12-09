#!/bin/bash

echo "🔧 Fixing remaining 8 raw SQL APIs with tenant_id filters..."

# Files already fixed:
# 1. seats/reserve ✅
# 2. seats/availability ✅

# Remaining 8 files to fix:
# 3. seats/generate
# 4. seats/confirm
# 5. reports/summary
# 6. stats
# 7. notifications/process
# 8. registrations/approvals
# 9. registrations/cancellation-approvals
# 10. registrations/trend

echo "✅ Files 1-2 already fixed"
echo "⏳ Fixing files 3-10..."
echo "📝 Manual fixes required - see REMAINING_RAW_SQL_FIXES.md"

