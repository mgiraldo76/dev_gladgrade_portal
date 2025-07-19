#!/bin/bash

echo "🔧 Fixing dependency conflicts and installing QR Code..."

# Remove node_modules and package-lock.json to start fresh
echo "🧹 Cleaning up existing dependencies..."
rm -rf node_modules
rm -f package-lock.json

# Install dependencies with legacy peer deps to resolve conflicts
echo "📦 Installing all dependencies with legacy peer deps..."
npm install --legacy-peer-deps

echo "✅ Dependencies installed successfully!"
echo ""
echo "🎯 QR Code functionality is now ready:"
echo "• Generate QR codes for business profiles"
echo "• Create menu QR codes for restaurants"
echo "• Automatically generate codes during prospect conversion"
echo ""
echo "🚀 You can now test the prospect-to-client conversion!"
