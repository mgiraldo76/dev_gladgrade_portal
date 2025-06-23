#!/bin/bash

echo "🔧 Fixing dependency conflicts and installing required packages..."

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force

# Remove node_modules and package-lock.json
echo "Removing node_modules and package-lock.json..."
rm -rf node_modules
rm -f package-lock.json

# Install with legacy peer deps to resolve conflicts
echo "Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps

echo "✅ Dependencies fixed and installed successfully!"
echo "📦 Radix UI components are now available"
