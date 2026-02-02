#!/bin/bash

# Script to add logo column to tenants table
# Run this script to apply the migration

echo "🔧 Adding logo column to tenants table..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set it in your .env file or export it:"
    echo "  export DATABASE_URL='your-database-url'"
    exit 1
fi

# Run the migration
psql "$DATABASE_URL" -f prisma/migrations/add_logo_column.sql

if [ $? -eq 0 ]; then
    echo "✅ Logo column added successfully!"
    echo ""
    echo "You can now upload company logos in the Settings page."
else
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi
