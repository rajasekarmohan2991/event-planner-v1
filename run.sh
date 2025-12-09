#!/bin/bash

# Exit on error
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting Event Planner Application...${NC}"
echo -e "${YELLOW}------------------------------------${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Docker is installed and running
if ! command_exists docker; then
    echo -e "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo -e "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is installed
if ! command_exists docker-compose; then
    echo -e "❌ Docker Compose is not installed. Please install Docker Compose."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env exists, if not create it
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating with default values...${NC}"
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
fi

# Build and start containers
echo -e "${YELLOW}🔨 Building and starting containers...${NC}"
docker-compose up -d --build

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"

# Function to check if a service is healthy
wait_for_service() {
    local service=$1
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if [ "$(docker inspect -f '{{.State.Health.Status}}' ${service} 2>/dev/null)" = "healthy" ]; then
            echo -e "${GREEN}✅ ${service} is ready!${NC}"
            return 0
        fi
        echo -e "${YELLOW}⏳ Waiting for ${service} to be ready... (attempt ${attempt}/${max_attempts})${NC}"
        sleep 5
        attempt=$((attempt + 1))
    done

    echo -e "❌ ${service} failed to start within the expected time."
    exit 1
}

# Wait for PostgreSQL
wait_for_service "ep_postgres"

# Wait for Redis
wait_for_service "ep_redis"

# Wait for API
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/actuator/health | grep -q "200"; then
        echo -e "${GREEN}✅ API is ready!${NC}"
        break
    fi
    echo -e "${YELLOW}⏳ Waiting for API to be ready... (attempt ${attempt}/${max_attempts})${NC}"
    sleep 5
    attempt=$((attempt + 1))
    
    if [ $attempt -gt $max_attempts ]; then
        echo -e "❌ API failed to start within the expected time."
        echo "   Check the logs with: docker logs ep_api"
        exit 1
    fi
done

# Wait for Web
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200\|302"; then
        echo -e "${GREEN}✅ Web application is ready!${NC}"
        break
    fi
    echo -e "${YELLOW}⏳ Waiting for Web application to be ready... (attempt ${attempt}/${max_attempts})${NC}"
    sleep 3
    attempt=$((attempt + 1))
    
    if [ $attempt -gt $max_attempts ]; then
        echo -e "❌ Web application failed to start within the expected time."
        echo "   Check the logs with: docker logs ep_web"
        exit 1
    fi
done

# Print success message
echo -e "\n${GREEN}🎉 Event Planner is up and running!${NC}"
echo -e "${YELLOW}------------------------------------${NC}"
echo -e "🌐 ${GREEN}Frontend:    http://localhost:3001${NC}"
echo -e "🔧 ${GREEN}API:         http://localhost:8081${NC}"
echo -e "📊 ${GREEN}PostgreSQL:  localhost:5433 (user: postgres, pass: postgres, db: event_planner)${NC}"
echo -e "🔴 ${GREEN}Redis:       localhost:6380${NC}"
echo -e "\n${YELLOW}🛑 To stop the application, run: docker-compose down${NC}"

# Show logs in the foreground
echo -e "\n${YELLOW}📝 Tailing logs (Ctrl+C to stop logs but keep the services running)...${NC}"
docker-compose logs -f
