# Technical Interview Setup Guide

This guide will help you set up the Technical Interview feature that uses AI to generate personalized interview questions based on your resume and job requirements.

## 🚀 Quick Start

1. **Set up your Gemini API key** (see instructions below)
2. **Run the startup script:**
   ```bash
   ./start-technical-interview.sh
   ```
3. **Access the application:**
   - Go to http://localhost:3000
   - Navigate to Dashboard
   - Click "Technical Interview" in Quick Start Practice

## 🔑 Setting up Gemini API Key

### Step 1: Get your API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### Step 2: Set the Environment Variable

**Option A: Temporary (for current session)**
```bash
export GEMINI_API_KEY='your-api-key-here'
```

**Option B: Permanent (add to your shell profile)**
```bash
# For bash (add to ~/.bashrc or ~/.bash_profile)
echo "export GEMINI_API_KEY='your-api-key-here'" >> ~/.bashrc
source ~/.bashrc

# For zsh (add to ~/.zshrc)
echo "export GEMINI_API_KEY='your-api-key-here'" >> ~/.zshrc
source ~/.zshrc
```

**Option C: Create a .env file**
```bash
# Create .env file in the project root
echo "GEMINI_API_KEY=your-api-key-here" > .env
```

### Step 3: Verify Setup
Run the startup script and check that you see:
```
✅ Python Resume Service is running on http://localhost:8002
```

If you see a warning about GEMINI_API_KEY not being set, the technical interview will use fallback questions instead of AI-generated ones.

## 📋 How It Works

### 1. User Input Collection
- **Preferred Industry**: e.g., Technology, Healthcare, Finance
- **Desired Role**: e.g., Software Engineer, Product Manager, Data Scientist  
- **Job Description**: Paste the full job description
- **Resume Upload**: PDF or DOC/DOCX format (max 10MB)

### 2. AI Processing
The system will:
1. Extract text from your uploaded resume
2. Send your resume + job info to Gemini API
3. Generate 5 personalized technical questions
4. Store the questions for your interview session

### 3. Interview Experience
- Same interface as behavioral interviews
- Real-time voice and facial analysis
- 3D AI avatar interviewer
- Comprehensive analysis and feedback

## 🔧 Technical Architecture

```
Frontend (Next.js) → API Route → Python Service → Gemini API
     ↓                    ↓              ↓              ↓
  User Interface    File Processing   Resume Text   AI Questions
```

### Components:
- **Frontend**: `/app/interview/technical/page.tsx`
- **API Route**: `/app/api/generate-technical-questions/route.ts`
- **Python Service**: `/python-resume-service/main.py`
- **Interview Logic**: Modified `/app/interview/behavioral/page.tsx`

## 🛠️ Troubleshooting

### Python Service Not Starting
```bash
# Check if Python 3 is installed
python3 --version

# Install dependencies manually
cd python-resume-service
pip3 install -r requirements.txt
python3 main.py
```

### API Key Issues
```bash
# Check if environment variable is set
echo $GEMINI_API_KEY

# Test the Python service directly
curl http://localhost:8002/health
```

### File Upload Issues
- Ensure file is PDF or DOC/DOCX format
- Check file size is under 10MB
- Try with a different resume file

### Network Issues
```bash
# Check if ports are available
lsof -ti:3000
lsof -ti:8002

# Kill processes if needed
kill -9 <PID>
```

## 📝 Example Usage

1. **Start the services:**
   ```bash
   ./start-technical-interview.sh
   ```

2. **Navigate to Technical Interview:**
   - Go to http://localhost:3000
   - Click Dashboard
   - Click "Technical Interview"

3. **Fill in your information:**
   - Industry: "Technology"
   - Role: "Software Engineer"
   - Job Description: "We're looking for a full-stack developer..."

4. **Upload your resume:**
   - Click "Choose File"
   - Select your resume (PDF/DOC/DOCX)
   - Click "Continue"

5. **Start your interview:**
   - Review the generated questions
   - Click "Start Technical Interview"
   - Begin your personalized interview!

## 🔒 Security Notes

- Your resume is processed locally and sent to Gemini API
- No resume data is stored permanently
- API calls are made securely over HTTPS
- Environment variables keep your API key secure

## 📊 Features

- ✅ Resume text extraction (PDF/DOC/DOCX)
- ✅ AI-powered question generation
- ✅ Real-time voice analysis
- ✅ Facial expression tracking
- ✅ 3D AI avatar interviewer
- ✅ Comprehensive interview analysis
- ✅ Detailed feedback and scoring

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your Gemini API key is set correctly
3. Ensure both services are running (ports 3000 and 8002)
4. Check the browser console for any errors
