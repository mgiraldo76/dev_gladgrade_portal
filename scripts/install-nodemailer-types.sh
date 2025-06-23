#!/bin/bash

echo "📦 Installing nodemailer and types..."

# Install nodemailer and its types
npm install nodemailer @types/nodemailer --save

echo "✅ Nodemailer dependencies installed successfully!"

echo ""
echo "You can now:"
echo "• Send welcome emails during conversion"
echo "• Test email configuration at /email-debug"
echo "• Use the email service without TypeScript errors"
