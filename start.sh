#!/bin/bash

echo "🚀 Starting NearbyStores Application"
echo "===================================="
echo ""

# Check if MongoDB is running
if ! systemctl is-active --quiet mongod; then
    echo "⚠️  MongoDB is not running. Starting it..."
    sudo systemctl start mongod
    sleep 2
fi

echo "✅ MongoDB is running"
echo ""

# Start backend in background
echo "🔧 Starting Backend Server..."
cd "$(dirname "$0")/backend"
npm run dev &
BACKEND_PID=$!

echo "   Backend PID: $BACKEND_PID"
echo "   Waiting for backend to start..."
sleep 5

# Start frontend
echo ""
echo "🎨 Starting Frontend Server..."
cd ../frontend
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT
