# File: install-missing-deps.sh
#!/bin/bash

echo "🔧 Installing missing dependencies for GladGrade Portal..."

# Install the missing @radix-ui/react-tooltip dependency
npm install @radix-ui/react-tooltip

# Also install other potentially missing dependencies that might be needed
npm install @radix-ui/react-checkbox

echo "✅ Dependencies installed successfully!"
echo ""
echo "📝 Dependencies added:"
echo "  - @radix-ui/react-tooltip"
echo "  - @radix-ui/react-checkbox"
echo ""
echo "🚀 You can now run 'npm run dev' to start the development server."