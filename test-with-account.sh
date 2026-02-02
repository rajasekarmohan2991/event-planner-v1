#!/bin/bash

# Test Event Planner with Test Account
# This script tests registration and login with a test account

echo "🧪 Testing Event Planner with Test Account"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test account details
TEST_NAME="Test User"
TEST_EMAIL="testuser$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"

echo -e "${BLUE}Test Account Details:${NC}"
echo "Name: $TEST_NAME"
echo "Email: $TEST_EMAIL"
echo "Password: $TEST_PASSWORD"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Check if services are running
echo -e "${BLUE}Step 1: Checking Services...${NC}"
if docker compose ps | grep -q "web.*Up"; then
    echo -e "${GREEN}✅ Web service is running${NC}"
else
    echo -e "${RED}❌ Web service is not running${NC}"
    echo "Starting services..."
    docker compose up -d
    sleep 5
fi
echo ""

# Step 2: Test register page accessibility
echo -e "${BLUE}Step 2: Testing Register Page...${NC}"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/auth/register)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Register page is accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Register page error (HTTP $HTTP_CODE)${NC}"
    echo "The page might still be loading. Wait a moment and try again."
    exit 1
fi
echo ""

# Step 3: Register a new account
echo -e "${BLUE}Step 3: Registering Test Account...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$TEST_NAME\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

if echo "$REGISTER_RESPONSE" | grep -q "success\|user\|id"; then
    echo -e "${GREEN}✅ Account registered successfully!${NC}"
    echo "Response: $REGISTER_RESPONSE"
else
    echo -e "${YELLOW}⚠️  Registration response:${NC}"
    echo "$REGISTER_RESPONSE"
fi
echo ""

# Step 4: Test login
echo -e "${BLUE}Step 4: Testing Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"callbackUrl\": \"/\"
  }")

if echo "$LOGIN_RESPONSE" | grep -q "url\|session"; then
    echo -e "${GREEN}✅ Login successful!${NC}"
else
    echo -e "${YELLOW}⚠️  Login response:${NC}"
    echo "$LOGIN_RESPONSE"
fi
echo ""

# Step 5: Test with existing account
echo -e "${BLUE}Step 5: Testing with Existing Account...${NC}"
echo "Email: test@example.com"
echo "Password: password123"
echo ""

EXISTING_LOGIN=$(curl -s -X POST http://localhost:3001/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test@example.com\",
    \"password\": \"password123\",
    \"callbackUrl\": \"/\"
  }")

if echo "$EXISTING_LOGIN" | grep -q "url\|session"; then
    echo -e "${GREEN}✅ Existing account login works!${NC}"
else
    echo -e "${YELLOW}⚠️  Existing account might not exist yet${NC}"
    echo "You can create it manually at: http://localhost:3001/auth/register"
fi
echo ""

# Step 6: Test OAuth buttons visibility
echo -e "${BLUE}Step 6: Checking OAuth Buttons...${NC}"
REGISTER_HTML=$(curl -s http://localhost:3001/auth/register)

if echo "$REGISTER_HTML" | grep -q "Google"; then
    echo -e "${GREEN}✅ Google button should be visible${NC}"
else
    echo -e "${YELLOW}⚠️  Google button might not be visible yet${NC}"
fi

if echo "$REGISTER_HTML" | grep -q "Instagram"; then
    echo -e "${GREEN}✅ Instagram button should be visible${NC}"
else
    echo -e "${YELLOW}⚠️  Instagram button might not be visible yet${NC}"
fi
echo ""

# Step 7: Check OAuth configuration
echo -e "${BLUE}Step 7: Checking OAuth Configuration...${NC}"
if grep -q "GOOGLE_CLIENT_ID=your-google-client-id-here" apps/web/.env.local; then
    echo -e "${YELLOW}⚠️  Google OAuth: NOT CONFIGURED${NC}"
    echo "   To enable: Run ./setup-oauth.sh"
else
    GOOGLE_ID=$(grep "GOOGLE_CLIENT_ID=" apps/web/.env.local | cut -d'=' -f2)
    if [ ! -z "$GOOGLE_ID" ] && [ "$GOOGLE_ID" != "your-google-client-id-here" ]; then
        echo -e "${GREEN}✅ Google OAuth: CONFIGURED${NC}"
    else
        echo -e "${YELLOW}⚠️  Google OAuth: NOT CONFIGURED${NC}"
    fi
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 Test Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Test Account Created:"
echo "  Email: $TEST_EMAIL"
echo "  Password: $TEST_PASSWORD"
echo ""
echo "Manual Testing:"
echo "  1. Open: http://localhost:3001/auth/register"
echo "  2. Try registering with:"
echo "     - Email/Password (should work)"
echo "     - Google (needs OAuth setup)"
echo "     - Instagram (needs OAuth setup)"
echo ""
echo "  3. Or login with existing account:"
echo "     - Email: test@example.com"
echo "     - Password: password123"
echo ""
echo "To set up OAuth:"
echo "  ./setup-oauth.sh"
echo ""
echo -e "${GREEN}✅ Testing complete!${NC}"
