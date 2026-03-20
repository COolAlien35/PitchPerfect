#!/bin/bash

# Start Technical Interview Services
echo "🚀 Starting Technical Interview Services..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

# Install Python dependencies for resume service
echo "📦 Installing Python dependencies..."
cd python-resume-service
pip3 install -r requirements.txt
cd ..

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  Warning: GEMINI_API_KEY environment variable is not set."
    echo "   The technical interview will use fallback questions."
    echo "   To enable Gemini API integration, set your API key:"
    echo "   export GEMINI_API_KEY='your-api-key-here'"
fi

# Start Python resume service in background
echo "🐍 Starting Python Resume Service on port 8002..."
cd python-resume-service
source venv/bin/activate
GEMINI_API_KEY="$GEMINI_API_KEY" python3 main.py &
PYTHON_PID=$!
cd ..

# Wait a moment for Python service to start
sleep 3

# Check if Python service is running
if curl -s http://localhost:8002/health > /dev/null; then
    echo "✅ Python Resume Service is running on http://localhost:8002"
else
    echo "❌ Failed to start Python Resume Service"
    kill $PYTHON_PID 2>/dev/null
    exit 1
fi

# Start Next.js development server
echo "⚡ Starting Next.js development server..."
npm run dev &
NEXTJS_PID=$!

# Wait for Next.js to start
sleep 5

# Check if Next.js is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Next.js development server is running on http://localhost:3000"
else
    echo "❌ Failed to start Next.js development server"
    kill $PYTHON_PID $NEXTJS_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 Technical Interview Services are running!"
echo "   Frontend: http://localhost:3000"
echo "   Python Service: http://localhost:8001"
echo ""
echo "📝 To use the Technical Interview feature:"
echo "   1. Go to http://localhost:3000"
echo "   2. Navigate to Dashboard"
echo "   3. Click 'Technical Interview' in Quick Start Practice"
echo "   4. Fill in your job information and upload resume"
echo "   5. Start your personalized technical interview!"
echo ""
echo "🛑 Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $PYTHON_PID $NEXTJS_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Keep script running
wait
