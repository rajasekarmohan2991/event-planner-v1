#!/bin/bash

echo "🔍 Checking Docker Build Status..."
echo ""

# Check if build is running
if docker ps -a | grep -q "eventplannerv1-web"; then
    echo "✅ Web container exists"
    
    # Check container status
    STATUS=$(docker ps --filter "name=eventplannerv1-web" --format "{{.Status}}")
    if [ -n "$STATUS" ]; then
        echo "📊 Status: $STATUS"
    else
        echo "⚠️  Container is not running"
    fi
else
    echo "❌ Web container not found"
fi

echo ""
echo "📋 Recent logs:"
docker compose logs web --tail=10

echo ""
echo "💡 To monitor build progress:"
echo "   docker compose logs web --follow"
