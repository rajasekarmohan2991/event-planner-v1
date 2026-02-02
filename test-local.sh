#!/bin/bash

echo "🚀 Starting local development server with all fixes..."
echo ""
echo "This will run the app locally on http://localhost:3001"
echo "All registration fixes are included in the local code."
echo ""
echo "Press Ctrl+C to stop the server when done testing."
echo ""

cd apps/web
npm run dev
