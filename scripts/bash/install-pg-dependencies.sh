#!/bin/bash
# Install PostgreSQL dependencies for GladGrade Portal

echo "📦 Installing PostgreSQL dependencies..."

# Install pg and its TypeScript types
npm install pg @types/pg

echo ""
echo "✅ PostgreSQL dependencies installed successfully!"
echo ""
echo "📋 Installed packages:"
echo "  - pg: PostgreSQL client for Node.js"
echo "  - @types/pg: TypeScript definitions for pg"
echo ""
echo "🔄 Next steps:"
echo "1. Restart your development server: npm run dev"
echo "2. Test database connection: npm run db:test"
echo "3. Visit http://localhost:3000/api/database/test"
echo ""
echo "🔧 If you still see TypeScript errors:"
echo "1. Restart your TypeScript language server in VS Code"
echo "2. Run: npx tsc --noEmit to check for any remaining issues"
