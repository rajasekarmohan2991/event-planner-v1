#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting build fix process..."

# Navigate to the project root
cd "$(dirname "$0")/.."

# Clean up previous builds
echo "🧹 Cleaning up previous builds..."
rm -rf .next/
rm -rf node_modules/
rm -f package-lock.json
rm -f yarn.lock

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Update framer-motion imports
echo "🔄 Updating framer-motion imports..."
npm run fix:imports

# Run type checking
echo "🔍 Running type checking..."
npm run type-check

# Run linting
echo "🧹 Running linter..."
npm run lint -- --fix

# Format code
echo "🎨 Formatting code..."
npm run format

# Build the project
echo "🏗️  Building the project..."
npm run build

echo "✅ Build fix completed successfully!"
echo "🚀 Start the development server with: npm run dev"
