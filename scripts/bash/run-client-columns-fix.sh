#!/bin/bash

echo "🔧 Adding missing columns to business_clients table..."

# Check if we're in the scripts directory
if [ ! -f "add-missing-client-columns.sql" ]; then
    echo "❌ Error: add-missing-client-columns.sql not found"
    echo "💡 Make sure you're running this from the scripts directory"
    exit 1
fi

# Run the SQL script
echo "📊 Executing SQL script..."

# You can run this with your preferred method:
echo "✅ SQL script ready to run!"
echo ""
echo "🔍 To execute this script, use one of these methods:"
echo ""
echo "Method 1 - If you have psql installed:"
echo "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f add-missing-client-columns.sql"
echo ""
echo "Method 2 - Copy and paste the SQL commands directly into your database client"
echo ""
echo "Method 3 - Use the database test endpoint:"
echo "curl -X POST http://localhost:3000/api/database/execute-sql -H 'Content-Type: application/json' -d '{\"sql\":\"$(cat add-missing-client-columns.sql)\"}'"

echo ""
echo "📋 SQL Commands to run:"
echo "----------------------------------------"
cat add-missing-client-columns.sql
echo "----------------------------------------"
