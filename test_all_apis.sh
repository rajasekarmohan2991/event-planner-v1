#!/bin/bash

echo "🧪 Testing All Fixed APIs"
echo "========================="
echo ""

# Test 1: RSVP Interest API
echo "1. Testing RSVP Interest API..."
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/api/events/18/rsvp-interest")
if [ "$response" = "200" ]; then
    echo "   ✅ RSVP Interest API working (200 OK)"
else
    echo "   ❌ RSVP Interest API error: HTTP $response"
fi

# Test 2: Public Events API
echo "2. Testing Public Events API..."
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/api/events/public?limit=6")
if [ "$response" = "200" ]; then
    echo "   ✅ Public Events API working (200 OK)"
else
    echo "   ❌ Public Events API error: HTTP $response"
fi

# Test 3: My Registrations API
echo "3. Testing My Registrations API..."
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/api/registrations/my")
if [ "$response" = "401" ]; then
    echo "   ✅ My Registrations API responding (401 Unauthorized - expected without session)"
else
    echo "   ❌ My Registrations API error: HTTP $response"
fi

# Test 4: Cancellation Approvals API
echo "4. Testing Cancellation Approvals API..."
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/api/events/1/registrations/cancellation-approvals")
if [ "$response" = "401" ]; then
    echo "   ✅ Cancellation Approvals API responding (401 Unauthorized - expected without session)"
else
    echo "   ❌ Cancellation Approvals API error: HTTP $response"
fi

# Test 5: Payments API
echo "5. Testing Payments API..."
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/api/events/19/payments")
if [ "$response" = "401" ]; then
    echo "   ✅ Payments API responding (401 Unauthorized - expected without session)"
else
    echo "   ❌ Payments API error: HTTP $response"
fi

# Test 6: Promo Codes API
echo "6. Testing Promo Codes API..."
response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3001/api/events/19/promo-codes")
if [ "$response" = "401" ]; then
    echo "   ✅ Promo Codes API responding (401 Unauthorized - expected without session)"
else
    echo "   ❌ Promo Codes API error: HTTP $response"
fi

echo ""
echo "📊 Database Check:"
echo "=================="

# Check RSVP interests
docker compose exec -T postgres psql -U postgres -d event_planner -c "
SELECT 
    'RSVP Interests' as type,
    COUNT(*) as count 
FROM rsvp_interests;
" 2>/dev/null

# Check registrations
docker compose exec -T postgres psql -U postgres -d event_planner -c "
SELECT 
    'Total Registrations' as type,
    COUNT(*) as count 
FROM registrations;
" 2>/dev/null

# Check public events
docker compose exec -T postgres psql -U postgres -d event_planner -c "
SELECT 
    'Published Events' as type,
    COUNT(*) as count 
FROM events 
WHERE status = 'PUBLISHED';
" 2>/dev/null

echo ""
echo "🎯 Test URLs:"
echo "============="
echo "RSVP Interests Admin: http://localhost:3001/events/18/rsvp-interests"
echo "Public Events: http://localhost:3001/api/events/public?limit=6"
echo "Cancellation Approvals: http://localhost:3001/events/1/registrations/cancellation-approvals"
echo ""
echo "Login with: fiserv@gmail.com / password123"
