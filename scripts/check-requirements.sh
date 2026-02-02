#!/bin/bash

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Checking system requirements...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker Desktop from https://www.docker.com/products/docker-desktop/${NC}"
    exit 1
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed or not in your PATH. Please ensure Docker Desktop is installed correctly.${NC}"
    exit 1
fi

# Check Node.js (optional, only if running without Docker)
if [ "$1" == "--check-node" ]; then
    if ! command -v node &> /dev/null; then
        echo -e "${YELLOW}⚠️  Node.js is not installed. It's required for local development without Docker.${NC}"
        echo -e "   Download from https://nodejs.org/ (LTS version recommended)"
    else
        NODE_VERSION=$(node -v | cut -d'v' -f2)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$NODE_MAJOR" -lt 16 ]; then
            echo -e "${YELLOW}⚠️  Node.js version is outdated (v${NODE_VERSION}). Version 16 or higher is recommended.${NC}"
        else
            echo -e "${GREEN}✅ Node.js v${NODE_VERSION} is installed${NC}"
        fi
    fi
fi

# Check Java (optional, only if developing the API)
if [ "$1" == "--check-java" ]; then
    if ! command -v java &> /dev/null; then
        echo -e "${YELLOW}⚠️  Java is not installed. It's required for local API development.${NC}"
        echo -e "   Download from https://adoptium.net/ (Java 17 recommended)"
    else
        JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
        echo -e "${GREEN}✅ Java ${JAVA_VERSION} is installed${NC}"
    fi
fi

# Check available resources
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CPU_CORES=$(sysctl -n hw.ncpu)
    MEM_GB=$(($(sysctl -n hw.memsize) / 1024 / 1024 / 1024))
else
    # Linux
    CPU_CORES=$(nproc)
    MEM_GB=$(free -g | awk '/^Mem:/{print $2}')
fi

if [ "$MEM_GB" -lt 8 ]; then
    echo -e "${YELLOW}⚠️  Your system has ${MEM_GB}GB of RAM. For better performance, 8GB or more is recommended.${NC}"
else
    echo -e "${GREEN}✅ System has ${CPU_CORES} CPU cores and ${MEM_GB}GB RAM${NC}"
fi

# Check Docker resources
if [ "$(docker info --format '{{.NCPU}}' 2>/dev/null || echo 0)" -lt 2 ]; then
    echo -e "${YELLOW}⚠️  Docker has less than 2 CPUs allocated. Consider increasing the resources in Docker Desktop.${NC}"
fi

if [ "$(docker info --format '{{.MemTotal}}' 2>/dev/null || echo 0)" -lt 4000000000 ]; then
    echo -e "${YELLOW}⚠️  Docker has less than 4GB of memory allocated. Consider increasing the resources in Docker Desktop.${NC}"
fi

echo -e "${GREEN}✅ All system requirements are met!${NC}"
