# PitchPerfect

An AI-powered interview preparation platform with real-time voice and facial analysis.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Python 3.8+
- npm or pnpm

### Installation

1. Install Node.js dependencies:
```bash
npm install
```

2. Install Python dependencies:
```bash
cd python-voice-analysis-service
pip install -r requirements.txt
cd ..
```

### Starting the Application

Simply start the Node.js server:
```bash
npm run dev
```

### Accessing the Application

- **Frontend**: http://localhost:3000

## 🛠️ Architecture

The application consists of:

1. **Node.js Server** (`server.js`)
   - Handles WebSocket connections for facial analysis
   - Serves the Next.js frontend

2. **Client-side Voice Analysis** (`components/voice-analysis.tsx`)
   - Real-time audio analysis using Web Audio API
   - Provides voice metrics (WPM, volume, confidence, etc.)
   - No external dependencies required

## 🔧 Troubleshooting

### Voice Analysis Error
If you see "Voice Analysis Error: Failed to analyze audio", ensure:
1. The Node.js server is running (port 3000)
2. Your browser supports Web Audio API
3. Microphone permissions are granted

### Port Conflicts
If ports are already in use:
```bash
# Check what's using the ports
lsof -ti:3000
lsof -ti:8001

# Kill processes if needed
kill -9 <PID>
```