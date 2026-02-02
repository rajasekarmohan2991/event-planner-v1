#!/bin/bash

# Event Planner - Complete Testing Script
# This script tests all major functionality

echo "🧪 Event Planner - Complete Testing Script"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing $name... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (Status: $status)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC} (Expected: $expected_status, Got: $status)"
        ((FAILED++))
    fi
}

echo "1️⃣  Checking Services..."
echo "------------------------"

# Check if services are running
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Docker services are running${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Docker services are not running${NC}"
    echo "Run: docker compose up -d"
    exit 1
fi

echo ""
echo "2️⃣  Testing Web Application..."
echo "------------------------"

# Test web application
test_endpoint "Web App Home" "http://localhost:3001" 200
test_endpoint "Login Page" "http://localhost:3001/auth/login" 200
test_endpoint "Register Page" "http://localhost:3001/auth/register" 200
test_endpoint "Forgot Password" "http://localhost:3001/auth/forgot-password" 200

echo ""
echo "3️⃣  Testing API Endpoints (Public)..."
echo "------------------------"

# Test public endpoints (should return 401 or 200)
test_endpoint "Events API" "http://localhost:8081/api/events" 401
test_endpoint "Health Check" "http://localhost:8081/actuator/health" 200

echo ""
echo "4️⃣  Testing Frontend Routes..."
echo "------------------------"

test_endpoint "Events List" "http://localhost:3001/events" 200
test_endpoint "Dashboard" "http://localhost:3001/dashboard" 200

echo ""
echo "5️⃣  Testing Database Connection..."
echo "------------------------"

if docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ PostgreSQL is not ready${NC}"
    ((FAILED++))
fi

echo ""
echo "6️⃣  Testing Redis Connection..."
echo "------------------------"

if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is ready${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Redis is not ready${NC}"
    ((FAILED++))
fi

echo ""
echo "7️⃣  Checking Logs for Errors..."
echo "------------------------"

# Check for errors in logs
WEB_ERRORS=$(docker compose logs web --tail=100 2>&1 | grep -i "error" | grep -v "Error: Failed to fetch sessions" | wc -l)
API_ERRORS=$(docker compose logs api --tail=100 2>&1 | grep -i "error" | wc -l)

if [ "$WEB_ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✅ No errors in web logs${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Found $WEB_ERRORS errors in web logs${NC}"
fi

if [ "$API_ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✅ No errors in API logs${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Found $API_ERRORS errors in API logs${NC}"
fi

echo ""
echo "=========================================="
echo "📊 Test Results Summary"
echo "=========================================="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Application is ready!${NC}"
    echo ""
    echo "Quick Access URLs:"
    echo "  - Web App: http://localhost:3001"
    echo "  - Login: http://localhost:3001/auth/login"
    echo "  - Events: http://localhost:3001/events"
    echo "  - API: http://localhost:8081"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please check the errors above.${NC}"
    echo ""
    exit 1
fi
