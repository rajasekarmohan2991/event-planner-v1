#!/bin/bash
# Fix VIP Registration Script
# This script applies the SQL fixes and restarts the application

echo "🔧 Applying VIP registration fixes..."

# Run the SQL script to fix VIP registration
docker exec -i eventplannerv1-postgres-1 psql -U postgres -d event_planner < scripts/ensure-vip-registration.sql

echo "✅ SQL fixes applied successfully!"

echo "🔄 Restarting web application..."
docker-compose restart web

echo "✨ VIP Registration Flow fixes complete! The application has been restarted."
echo "You can now test VIP registration using the web UI or the test script:"
echo "npm install axios"
echo "node scripts/test-vip-registration.js"
