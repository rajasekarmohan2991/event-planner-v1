#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Setting up development environment...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker Desktop and try again."
  exit 1
fi

# Run requirements check
echo -e "${YELLOW}Checking system requirements...${NC}"
./scripts/check-requirements.sh

# Make scripts executable
echo -e "${YELLOW}Making scripts executable...${NC}"
chmod +x scripts/*.sh

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo -e "${YELLOW}Creating .env file...${NC}"
  # Create .env with default values
  cat > .env << 'EOL'
# Application
NODE_ENV=development
APP_DEBUG=true

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8081
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081

# Backend
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8081

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=event_planner
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT (for future authentication)
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=86400000  # 24 hours in milliseconds

# CORS (comma-separated origins)
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
EOL
  
  echo -e "${GREEN}✅ Created .env file with default values${NC}"
else
  echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Install web dependencies
echo -e "\n${YELLOW}Installing web dependencies...${NC}"
cd apps/web
npm install
cd ../..

echo -e "\n${GREEN}✅ Development environment setup complete!${NC}"
echo -e "\nTo start the application, run: ${YELLOW}./scripts/dev.sh${NC}"
