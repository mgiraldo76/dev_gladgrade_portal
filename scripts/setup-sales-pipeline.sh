#!/bin/bash

echo "🚀 Setting up GladGrade Sales Pipeline..."

# Install new dependencies
echo "📦 Installing dependencies..."
npm install nodemailer @types/nodemailer qrcode @types/qrcode

# Check if database is accessible
echo "🔍 Checking database connection..."
response=$(curl -s http://localhost:3000/api/database/status)
if echo "$response" | grep -q '"success":true'; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed:"
    echo "$response"
    echo ""
    echo "Please check your database configuration and ensure it's running."
fi

echo ""
echo "✅ Sales Pipeline setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Run the database schema: scripts/create-sales-pipeline-tables.sql"
echo "2. Navigate to /dashboard/sales to see the sales dashboard"
echo "3. Test creating a prospect and converting to client"
echo "4. Check email functionality with /api/emails/process"
