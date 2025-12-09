#!/bin/bash

echo "🧪 Testing Approval Flows"
echo "========================="

# Test 1: Check if cancellation approvals API works
echo "1. Testing Cancellation Approvals API..."
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/api/events/1/registrations/cancellation-approvals")
if [ "$response" = "401" ]; then
    echo "   ✅ API responding (401 Unauthorized - expected without session)"
else
    echo "   ❌ API error: HTTP $response"
fi

# Test 2: Check if registration approvals API works  
echo "2. Testing Registration Approvals API..."
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/api/events/1/approvals/registrations")
if [ "$response" = "401" ]; then
    echo "   ✅ API responding (401 Unauthorized - expected without session)"
else
    echo "   ❌ API error: HTTP $response"
fi

# Test 3: Check if UI pages load
echo "3. Testing UI Pages..."
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/events/1/registrations/cancellation-approvals")
if [ "$response" = "200" ]; then
    echo "   ✅ Cancellation Approvals UI loads"
else
    echo "   ❌ Cancellation Approvals UI error: HTTP $response"
fi

response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/events/1/registrations/approvals")
if [ "$response" = "200" ]; then
    echo "   ✅ Registration Approvals UI loads"
else
    echo "   ❌ Registration Approvals UI error: HTTP $response"
fi

echo ""
echo "📊 Database Status:"
echo "=================="

# Check registrations needing approval
docker compose exec -T postgres psql -U postgres -d event_planner -c "
SELECT 
    'Registration Approvals' as type,
    COUNT(*) as count 
FROM registrations 
WHERE review_status = 'PENDING_APPROVAL';
"

# Check cancellation requests
docker compose exec -T postgres psql -U postgres -d event_planner -c "
SELECT 
    'Cancellation Requests' as type,
    COUNT(*) as count 
FROM registrations 
WHERE cancellation_reason IS NOT NULL AND cancellation_reason != '';
"

echo ""
echo "🎯 Test URLs (Login Required):"
echo "============================="
echo "Registration Approvals: http://localhost:3001/events/1/registrations/approvals"
echo "Cancellation Approvals: http://localhost:3001/events/1/registrations/cancellation-approvals"
echo ""
echo "Login with: fiserv@gmail.com / password123"
