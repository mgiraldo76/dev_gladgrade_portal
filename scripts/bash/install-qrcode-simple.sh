#!/bin/bash

echo "📦 Installing QR Code dependencies (simple approach)..."

# Install qrcode and types with legacy peer deps to avoid conflicts
npm install qrcode @types/qrcode --legacy-peer-deps

echo "✅ QR Code dependencies installed successfully!"
echo ""
echo "You can now:"
echo "• Generate QR codes for business profiles"
echo "• Create menu QR codes for restaurants"
echo "• Automatically generate codes during prospect conversion"
