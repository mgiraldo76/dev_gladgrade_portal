#!/bin/bash
# chmod +x ./scripts/bash/deploy-devportalgladgradecom.sh


# GladGrade Portal - Deploy to Dev Portal
# Usage: ./deploy-devportalgladgradecom.sh

echo "🚀 Starting deployment to Dev Portal..."

# Exit on any error
set -e

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf out/

# Build for production
echo "🔨 Building for production..."
NODE_ENV=production npm run build

# Verify build
echo "📁 Build contents:"
ls -la out/

# Note: No need to clear/reapply target every time since it persists
# Only reapply if needed (commented out for efficiency)
# firebase target:clear hosting dev-portal  
# firebase target:apply hosting dev-portal devportalgladgradecom 

# Deploy
echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting:dev-portal

echo "✅ Deployment complete!"
echo "🌐 Site: https://devportal.gladgrade.com"