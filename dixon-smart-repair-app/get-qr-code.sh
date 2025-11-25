#!/bin/bash

# get-qr-code.sh - Generate QR code for Dixon Smart Repair mobile testing
# Usage: ./get-qr-code.sh

echo "📱 DIXON SMART REPAIR - MOBILE QR CODE"
echo "====================================="
echo ""

# Get local IP address
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")

# Check if Expo server is likely running
if ! curl -s "http://$LOCAL_IP:8081" > /dev/null 2>&1; then
    echo "⚠️  WARNING: Expo development server may not be running"
    echo "Please make sure you've started the server with: npm start"
    echo ""
fi

echo "🔗 CONNECTION DETAILS:"
echo "• Local IP: $LOCAL_IP"
echo "• Expo Server: http://$LOCAL_IP:8081"
echo "• Expo URL: exp://$LOCAL_IP:8081"
echo ""

echo "📱 QR CODE FOR EXPO GO:"
echo "======================="

# Generate QR code if qrencode is available
if command -v qrencode >/dev/null 2>&1; then
    qrencode -t ANSI "exp://$LOCAL_IP:8081"
else
    echo "❌ qrencode not found. Install with: brew install qrencode"
    echo "Or visit: https://www.qr-code-generator.com/"
    echo "And enter: exp://$LOCAL_IP:8081"
fi

echo ""
echo "📱 MOBILE TESTING STEPS:"
echo "========================"
echo "1. Install 'Expo Go' app on your mobile device"
echo "   • iOS: Download from App Store"
echo "   • Android: Download from Google Play Store"
echo ""
echo "2. Ensure your mobile device is on the same WiFi network"
echo "   • Your computer: Connected to WiFi"
echo "   • Your phone: Connected to SAME WiFi network"
echo ""
echo "3. Open Expo Go app and scan the QR code above"
echo "   • OR manually enter: exp://$LOCAL_IP:8081"
echo ""
echo "4. The Dixon Smart Repair app should load on your device!"
echo ""
echo "🌐 ALTERNATIVE ACCESS METHODS:"
echo "=============================="
echo "• Web Browser: http://$LOCAL_IP:8081"
echo "• Localhost: http://localhost:8081 (computer only)"
echo ""
echo "🔧 TROUBLESHOOTING:"
echo "=================="
echo "• If QR code doesn't work, try manual URL entry"
echo "• Ensure both devices are on same WiFi network"
echo "• Check that Expo development server is running with: npm start"
echo "• Try refreshing the Expo Go app"
echo "• Make sure Expo Go app is updated to latest version"
echo "• If IP changes, run this script again: ./get-qr-code.sh"
echo ""
