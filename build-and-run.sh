#!/bin/bash

# Event Planner - Docker Build and Run Script
# This script builds and runs both frontend and backend services

set -e  # Exit on error

echo "======================================"
echo "Event Planner - Docker Build & Run"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Docker is running"

# Ask user which mode to use
echo ""
echo "Select build mode:"
echo "1) Development (Fast, no build, hot reload)"
echo "2) Production (Full build, optimized)"
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        MODE="development"
        COMPOSE_FILE="docker-compose.dev.yml"
        print_info "Using development mode (no build required)"
        ;;
    2)
        MODE="production"
        COMPOSE_FILE="docker-compose.yml"
        print_info "Using production mode (full build)"
        ;;
    *)
        print_error "Invalid choice. Using development mode."
        MODE="development"
        COMPOSE_FILE="docker-compose.dev.yml"
        ;;
esac

echo ""
print_info "Stopping existing containers..."
docker compose -f $COMPOSE_FILE down

echo ""
print_info "Removing old images (optional)..."
read -p "Remove old images? [y/N]: " remove_images
if [[ $remove_images =~ ^[Yy]$ ]]; then
    docker compose -f $COMPOSE_FILE down --rmi all --volumes
    print_status "Old images removed"
fi

echo ""
print_info "Building services..."
if [ "$MODE" == "production" ]; then
    print_info "This may take 5-10 minutes for production build..."
fi

docker compose -f $COMPOSE_FILE build --no-cache

if [ $? -ne 0 ]; then
    print_error "Build failed!"
    exit 1
fi

print_status "Build completed successfully!"

echo ""
print_info "Starting services..."
docker compose -f $COMPOSE_FILE up -d

if [ $? -ne 0 ]; then
    print_error "Failed to start services!"
    exit 1
fi

print_status "Services started successfully!"

echo ""
print_info "Waiting for services to be ready..."
sleep 5

# Check service status
echo ""
echo "Service Status:"
echo "---------------"
docker compose -f $COMPOSE_FILE ps

echo ""
echo "======================================"
print_status "Build and deployment complete!"
echo "======================================"
echo ""
echo "Access your application:"
echo "  Frontend: http://localhost:3001"
echo "  Backend API: http://localhost:8081"
echo "  PostgreSQL: localhost:5433"
echo "  Redis: localhost:6380"
echo ""
echo "Useful commands:"
echo "  View logs: docker compose -f $COMPOSE_FILE logs -f"
echo "  Stop: docker compose -f $COMPOSE_FILE down"
echo "  Restart: docker compose -f $COMPOSE_FILE restart"
echo ""

# Ask if user wants to see logs
read -p "View logs now? [y/N]: " view_logs
if [[ $view_logs =~ ^[Yy]$ ]]; then
    docker compose -f $COMPOSE_FILE logs -f
fi
