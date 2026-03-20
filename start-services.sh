#!/bin/bash

# Start PitchPerfect services (frontend + Python voice analysis)
echo "🚀 Starting PitchPerfect services..."

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Check if Next.js is already running
if check_port 3000; then
    echo "⚠️  Port 3000 is already in use. Please stop the existing service first."
    exit 1
fi

# Check if Python service is already running
if check_port 8001; then
    echo "⚠️  Port 8001 is already in use. Please stop the existing service first."
    exit 1
fi

# Start Python voice analysis service
echo "🐍 Starting Python voice analysis service on port 8001..."
cd python-voice-analysis-service
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 &
PYTHON_PID=$!
cd ..

# Wait a moment for Python service to start
sleep 3

# Start Next.js dev server (no longer goes through server.js)
echo "⚡ Starting Next.js dev server on port 3000..."
npm run dev &
NEXTJS_PID=$!

echo "✅ Services started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔊 Voice Analysis API: http://localhost:8001"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $PYTHON_PID 2>/dev/null
    kill $NEXTJS_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
