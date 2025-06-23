#!/bin/bash
# Install Firebase Admin SDK for GladGrade Portal

echo "🔥 Installing Firebase Admin SDK..."

# Install firebase-admin package
npm install firebase-admin

echo ""
echo "✅ Firebase Admin SDK installed successfully!"
echo ""
echo "📋 Installed packages:"
echo "  - firebase-admin: Server-side Firebase SDK"
echo ""
echo "🔧 Next steps:"
echo "1. Get your Firebase service account key from Firebase Console"
echo "2. Download the JSON file and place it in your project"
echo "3. Set GOOGLE_APPLICATION_CREDENTIALS environment variable"
echo "4. Restart your development server: npm run dev"
echo ""
echo "🔗 Firebase Console: https://console.firebase.google.com/"
echo "📖 Service Account Setup: https://firebase.google.com/docs/admin/setup"
echo ""
echo "⚠️  For now, the app will use mock Firebase functions until you set up service account credentials."
