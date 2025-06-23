#!/bin/bash
# Install PostgreSQL dependencies for GladGrade Portal

echo "📦 Installing PostgreSQL dependencies..."

npm install pg @types/pg

echo "✅ PostgreSQL dependencies installed!"
echo ""
echo "Next steps:"
echo "1. Set your DATABASE_URL environment variable"
echo "2. Update your .env.local file with Google Cloud SQL connection"
echo "3. Restart your development server"
