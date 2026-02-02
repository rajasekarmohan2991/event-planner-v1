#!/bin/bash

# Lookup Management System Installation Script
# This script installs and configures the complete lookup management system

set -e

echo "🚀 Installing Lookup Management System..."
echo ""

# Step 1: Install dependencies
echo "📦 Step 1/4: Installing dependencies..."
cd apps/web
npm install pg @types/pg
echo "✅ Dependencies installed"
echo ""

# Step 2: Run database migrations
echo "🗄️  Step 2/4: Running database migrations..."
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set. Please set it and run migrations manually:"
  echo "   psql \$DATABASE_URL -f apps/web/prisma/migrations/add_lookup_management_system.sql"
  echo "   psql \$DATABASE_URL -f apps/web/prisma/migrations/seed_lookup_data.sql"
else
  psql $DATABASE_URL -f prisma/migrations/add_lookup_management_system.sql
  echo "✅ Schema migration completed"
  
  psql $DATABASE_URL -f prisma/migrations/seed_lookup_data.sql
  echo "✅ Seed data loaded"
fi
echo ""

# Step 3: Verify installation
echo "🔍 Step 3/4: Verifying installation..."
if [ ! -z "$DATABASE_URL" ]; then
  echo "Checking tables..."
  psql $DATABASE_URL -c "\dt lookup*" || echo "⚠️  Could not verify tables"
  
  echo ""
  echo "Checking seed data..."
  psql $DATABASE_URL -c "SELECT 
    lc.name as category,
    COUNT(lv.id) as value_count
  FROM lookup_categories lc
  LEFT JOIN lookup_values lv ON lv.category_id = lc.id
  GROUP BY lc.id, lc.name
  ORDER BY lc.name
  LIMIT 5;" || echo "⚠️  Could not verify seed data"
fi
echo ""

# Step 4: Build application
echo "🔨 Step 4/4: Building application..."
npm run build
echo "✅ Build completed"
echo ""

echo "✅ Lookup Management System installed successfully!"
echo ""
echo "📚 Next Steps:"
echo "1. Start your dev server: npm run dev"
echo "2. Login as Super Admin"
echo "3. Navigate to: /super-admin/lookups"
echo "4. Read the guide: LOOKUP_MANAGEMENT_GUIDE.md"
echo ""
echo "🎉 Installation complete!"
