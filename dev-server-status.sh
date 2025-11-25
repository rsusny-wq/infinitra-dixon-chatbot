#!/bin/bash

# dev-server-status.sh - Check Dixon Smart Repair development server status

echo "🚗 DIXON SMART REPAIR - DEVELOPMENT SERVER STATUS"
echo "================================================="
echo ""

# Check if Expo process is running
EXPO_PID=$(ps aux | grep "expo start" | grep -v grep | awk '{print $2}')

if [ -n "$EXPO_PID" ]; then
    echo "✅ Expo Development Server: RUNNING (PID: $EXPO_PID)"
else
    echo "❌ Expo Development Server: NOT RUNNING"
    echo ""
    echo "To start the server:"
    echo "cd /Users/saidachanda/development/dixon-smart-repair/dixon-smart-repair-app"
    echo "nohup npm start > expo-dev-server.log 2>&1 &"
    exit 1
fi

# Get local IP
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")

echo "🌐 Server URLs:"
echo "• Local: http://localhost:8081"
echo "• Network: http://$LOCAL_IP:8081"
echo "• Expo URL: exp://$LOCAL_IP:8081"
echo ""

# Check if ports are accessible
if curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo "✅ Metro Bundler: ACCESSIBLE on port 8081"
else
    echo "❌ Metro Bundler: NOT ACCESSIBLE on port 8081"
fi

echo ""
echo "📱 Mobile Testing:"
echo "• Run: ./dixon-smart-repair-app/get-qr-code.sh"
echo "• Or manually enter in Expo Go: exp://$LOCAL_IP:8081"
echo ""

echo "📋 Server Logs:"
echo "• View logs: tail -f /Users/saidachanda/development/dixon-smart-repair/dixon-smart-repair-app/expo-dev-server.log"
echo "• Stop server: kill $EXPO_PID"
echo ""

echo "🔧 Quick Actions:"
echo "• Restart server: kill $EXPO_PID && cd dixon-smart-repair-app && nohup npm start > expo-dev-server.log 2>&1 &"
echo "• Generate QR: ./dixon-smart-repair-app/get-qr-code.sh"
echo "• Check status: ./dev-server-status.sh"
