#!/bin/bash

# OAuth Setup Helper Script
# This script helps you set up Google and Instagram OAuth

echo "🔐 OAuth Setup Helper"
echo "===================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.local exists
ENV_FILE="apps/web/.env.local"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: .env.local not found${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Current OAuth Status:${NC}"
echo ""

# Check Google OAuth
if grep -q "GOOGLE_CLIENT_ID=your-google-client-id-here" "$ENV_FILE"; then
    echo -e "${YELLOW}⚠️  Google OAuth: NOT CONFIGURED${NC}"
    GOOGLE_SETUP=false
elif grep -q "GOOGLE_CLIENT_ID=" "$ENV_FILE" && ! grep -q "GOOGLE_CLIENT_ID=$" "$ENV_FILE"; then
    GOOGLE_ID=$(grep "GOOGLE_CLIENT_ID=" "$ENV_FILE" | cut -d'=' -f2)
    if [ ! -z "$GOOGLE_ID" ] && [ "$GOOGLE_ID" != "your-google-client-id-here" ]; then
        echo -e "${GREEN}✅ Google OAuth: CONFIGURED${NC}"
        echo "   Client ID: ${GOOGLE_ID:0:20}..."
        GOOGLE_SETUP=true
    else
        echo -e "${YELLOW}⚠️  Google OAuth: NOT CONFIGURED${NC}"
        GOOGLE_SETUP=false
    fi
else
    echo -e "${YELLOW}⚠️  Google OAuth: NOT CONFIGURED${NC}"
    GOOGLE_SETUP=false
fi

# Check Instagram OAuth
if grep -q "INSTAGRAM_CLIENT_ID=" "$ENV_FILE" && ! grep -q "INSTAGRAM_CLIENT_ID=$" "$ENV_FILE"; then
    INSTAGRAM_ID=$(grep "INSTAGRAM_CLIENT_ID=" "$ENV_FILE" | cut -d'=' -f2)
    if [ ! -z "$INSTAGRAM_ID" ]; then
        echo -e "${GREEN}✅ Instagram OAuth: CONFIGURED${NC}"
        echo "   Client ID: ${INSTAGRAM_ID:0:20}..."
        INSTAGRAM_SETUP=true
    else
        echo -e "${YELLOW}⚠️  Instagram OAuth: NOT CONFIGURED${NC}"
        INSTAGRAM_SETUP=false
    fi
else
    echo -e "${YELLOW}⚠️  Instagram OAuth: NOT CONFIGURED${NC}"
    INSTAGRAM_SETUP=false
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Main menu
echo -e "${BLUE}What would you like to do?${NC}"
echo ""
echo "1) Set up Google OAuth"
echo "2) Set up Instagram OAuth"
echo "3) View current configuration"
echo "4) Test OAuth setup"
echo "5) Open setup guides"
echo "6) Exit"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}🔧 Setting up Google OAuth...${NC}"
        echo ""
        echo "Step 1: Get your Google OAuth credentials"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Open Google Cloud Console:"
        echo -e "   ${BLUE}https://console.cloud.google.com/apis/credentials${NC}"
        echo ""
        echo "2. Create OAuth client ID (if not already created)"
        echo "3. Copy your credentials"
        echo ""
        read -p "Press Enter when you have your credentials ready..."
        echo ""
        
        read -p "Enter your Google Client ID: " GOOGLE_CLIENT_ID
        read -p "Enter your Google Client Secret: " GOOGLE_CLIENT_SECRET
        
        if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
            echo -e "${RED}❌ Error: Credentials cannot be empty${NC}"
            exit 1
        fi
        
        # Update .env.local
        if grep -q "GOOGLE_CLIENT_ID=" "$ENV_FILE"; then
            sed -i.bak "s|GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID|" "$ENV_FILE"
            sed -i.bak "s|GOOGLE_CLIENT_SECRET=.*|GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET|" "$ENV_FILE"
        else
            echo "" >> "$ENV_FILE"
            echo "GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID" >> "$ENV_FILE"
            echo "GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET" >> "$ENV_FILE"
        fi
        
        echo ""
        echo -e "${GREEN}✅ Google OAuth credentials saved!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Restart the application: docker compose restart web"
        echo "2. Test Google sign-in at: http://localhost:3001/auth/register"
        ;;
        
    2)
        echo ""
        echo -e "${BLUE}🔧 Setting up Instagram OAuth...${NC}"
        echo ""
        echo "Step 1: Get your Instagram OAuth credentials"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "1. Open Facebook Developers:"
        echo -e "   ${BLUE}https://developers.facebook.com/apps/${NC}"
        echo ""
        echo "2. Create Instagram Basic Display app (if not already created)"
        echo "3. Copy your credentials"
        echo ""
        read -p "Press Enter when you have your credentials ready..."
        echo ""
        
        read -p "Enter your Instagram Client ID: " INSTAGRAM_CLIENT_ID
        read -p "Enter your Instagram Client Secret: " INSTAGRAM_CLIENT_SECRET
        
        if [ -z "$INSTAGRAM_CLIENT_ID" ] || [ -z "$INSTAGRAM_CLIENT_SECRET" ]; then
            echo -e "${RED}❌ Error: Credentials cannot be empty${NC}"
            exit 1
        fi
        
        # Update .env.local
        if grep -q "INSTAGRAM_CLIENT_ID=" "$ENV_FILE"; then
            sed -i.bak "s|INSTAGRAM_CLIENT_ID=.*|INSTAGRAM_CLIENT_ID=$INSTAGRAM_CLIENT_ID|" "$ENV_FILE"
            sed -i.bak "s|INSTAGRAM_CLIENT_SECRET=.*|INSTAGRAM_CLIENT_SECRET=$INSTAGRAM_CLIENT_SECRET|" "$ENV_FILE"
        else
            echo "" >> "$ENV_FILE"
            echo "INSTAGRAM_CLIENT_ID=$INSTAGRAM_CLIENT_ID" >> "$ENV_FILE"
            echo "INSTAGRAM_CLIENT_SECRET=$INSTAGRAM_CLIENT_SECRET" >> "$ENV_FILE"
        fi
        
        echo ""
        echo -e "${GREEN}✅ Instagram OAuth credentials saved!${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Restart the application: docker compose restart web"
        echo "2. Test Instagram sign-in at: http://localhost:3001/auth/register"
        ;;
        
    3)
        echo ""
        echo -e "${BLUE}📄 Current Configuration:${NC}"
        echo ""
        echo "Google OAuth:"
        grep "GOOGLE_CLIENT_ID=" "$ENV_FILE" || echo "  Not configured"
        grep "GOOGLE_CLIENT_SECRET=" "$ENV_FILE" | sed 's/=.*/=***hidden***/' || echo "  Not configured"
        echo ""
        echo "Instagram OAuth:"
        grep "INSTAGRAM_CLIENT_ID=" "$ENV_FILE" || echo "  Not configured"
        grep "INSTAGRAM_CLIENT_SECRET=" "$ENV_FILE" | sed 's/=.*/=***hidden***/' || echo "  Not configured"
        ;;
        
    4)
        echo ""
        echo -e "${BLUE}🧪 Testing OAuth Setup...${NC}"
        echo ""
        
        # Test if web service is running
        if docker compose ps | grep -q "web.*Up"; then
            echo -e "${GREEN}✅ Web service is running${NC}"
        else
            echo -e "${RED}❌ Web service is not running${NC}"
            echo "   Run: docker compose up -d"
            exit 1
        fi
        
        # Test register page
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/auth/register)
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✅ Register page is accessible (HTTP $HTTP_CODE)${NC}"
        else
            echo -e "${RED}❌ Register page error (HTTP $HTTP_CODE)${NC}"
        fi
        
        echo ""
        echo "Manual test:"
        echo "1. Open: http://localhost:3001/auth/register"
        echo "2. Look for Google/Instagram buttons"
        echo "3. Click a button to test OAuth flow"
        ;;
        
    5)
        echo ""
        echo -e "${BLUE}📚 Opening setup guides...${NC}"
        echo ""
        echo "Available guides:"
        echo "1. ENABLE_SOCIAL_LOGIN.md - Complete setup guide"
        echo "2. GOOGLE_OAUTH_SETUP.md - Google-specific guide"
        echo ""
        
        if command -v open &> /dev/null; then
            open "ENABLE_SOCIAL_LOGIN.md" 2>/dev/null || cat "ENABLE_SOCIAL_LOGIN.md"
        else
            cat "ENABLE_SOCIAL_LOGIN.md"
        fi
        ;;
        
    6)
        echo ""
        echo "👋 Goodbye!"
        exit 0
        ;;
        
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Done!${NC}"
echo ""
