# 🏛️ PitchPerfect — Complete Architectural Blueprint & Implementation Strategy

## 1. The Big Picture: What You're Actually Building

Before discussing architecture, understand what PitchPerfect is at its core — it's a **real-time AI-powered interview simulation platform** with three distinct subsystems running concurrently:

- **Media Pipeline** — Video/Audio capture, streaming, and analysis
- **AI Inference Pipeline** — Question generation, transcription, evaluation
- **Analytics Engine** — Scoring, feedback, historical tracking

Each subsystem has different performance characteristics and should be designed accordingly. This is what separates a student project from a production system.

---

## 2. Architectural Pattern: Modular Monolith → Clean Architecture

### Why NOT Microservices (Yet)

A true microservices architecture requires service discovery, API gateways, distributed tracing, and inter-service communication protocols. For a 2nd-year placement project, you'll spend 60% of your time on infrastructure, not features. **Interviewers care more about what you built, not how many services you split it into.**

### The Right Pattern: **Clean Architecture with Domain-Driven Design inside a Modular Monolith**

```
┌──────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                         │
│              Next.js 15 (App Router + Server Components)          │
│         TanStack Query | shadcn/ui | Framer Motion | Socket.IO   │
└────────────────────────┬─────────────────────────────────────────┘
                         │ HTTP/WebSocket
┌────────────────────────▼─────────────────────────────────────────┐
│                         API LAYER (FastAPI)                        │
│   ┌──────────────┐  ┌─────────────┐  ┌───────────────────────┐  │
│   │  REST Router  │  │  WS Router  │  │  Middleware Chain      │  │
│   │  /api/v1/... │  │  /ws/...    │  │  Auth → Rate Limit →  │  │
│   └──────────────┘  └─────────────┘  │  CORS → Logging       │  │
│                                       └───────────────────────┘  │
└────────────────────────┬─────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│                      DOMAIN / SERVICE LAYER                        │
│  ┌─────────────────┐ ┌──────────────┐ ┌──────────────────────┐  │
│  │  Interview      │ │  AI Service  │ │  Analytics Service   │  │
│  │  Service        │ │  (LangChain  │ │  (Scoring, Reports)  │  │
│  │  - Session mgmt │ │   + Gemini   │ │                      │  │
│  │  - Flow control │ │   + Whisper) │ │                      │  │
│  └────────┬────────┘ └──────┬───────┘ └──────────┬───────────┘  │
└───────────┼────────────────┼──────────────────────┼─────────────┘
            │                │                      │
┌───────────▼────────────────▼──────────────────────▼─────────────┐
│                    INFRASTRUCTURE LAYER                            │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ PostgreSQL  │  │  Redis   │  │  AI APIs │  │  File Store  │  │
│  │ SQLAlchemy  │  │  Cache   │  │  (Ext.)  │  │  (optional)  │  │
│  └────────────┘  └──────────┘  └──────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

This pattern is **explainable**, **testable**, and **actually used at companies like Netflix, Shopify, and Airbnb** in their early stages.

---

## 3. Backend Architecture Deep-Dive (FastAPI)

### Project Structure (This is the most important thing to get right)

```
backend/
├── app/
│   ├── main.py                    # FastAPI app factory
│   ├── config.py                  # Pydantic Settings (env vars)
│   ├── dependencies.py            # Shared DI (DB session, Redis, current_user)
│   │
│   ├── api/                       # ONLY routing lives here
│   │   ├── v1/
│   │   │   ├── router.py          # Include all sub-routers
│   │   │   ├── auth.py
│   │   │   ├── interviews.py
│   │   │   ├── analytics.py
│   │   │   └── websocket.py
│   │
│   ├── core/                      # Domain logic (NO DB, NO HTTP)
│   │   ├── interview/
│   │   │   ├── service.py         # InterviewService
│   │   │   ├── schemas.py         # Pydantic I/O models
│   │   │   └── exceptions.py      # Domain-specific errors
│   │   ├── ai/
│   │   │   ├── service.py         # AIService (orchestrates LangChain)
│   │   │   ├── prompts.py         # All prompt templates
│   │   │   └── whisper.py         # Voice transcription
│   │   └── analytics/
│   │       └── service.py         # AnalyticsService
│   │
│   ├── models/                    # SQLAlchemy ORM models
│   │   ├── base.py                # Base model with timestamps
│   │   ├── user.py
│   │   ├── interview.py
│   │   ├── session.py
│   │   └── analytics.py
│   │
│   ├── repositories/              # Data access layer (the key pattern)
│   │   ├── base.py                # Generic CRUD repository
│   │   ├── user_repo.py
│   │   ├── interview_repo.py
│   │   └── analytics_repo.py
│   │
│   ├── infrastructure/
│   │   ├── database.py            # SQLAlchemy engine + session
│   │   ├── redis_client.py        # Redis connection + helpers
│   │   └── cache.py               # Cache decorator
│   │
│   └── middleware/
│       ├── auth.py                # JWT validation middleware
│       ├── rate_limiter.py        # Redis-backed rate limiting
│       └── logging.py             # Structured request logging
│
├── tests/
│   ├── conftest.py                # Shared fixtures (test DB, mock Redis)
│   ├── unit/
│   │   ├── test_interview_service.py
│   │   └── test_analytics_service.py
│   └── integration/
│       ├── test_auth_endpoints.py
│       └── test_interview_endpoints.py
│
├── alembic/                       # Database migrations
│   ├── versions/
│   └── env.py
│
├── Dockerfile
├── requirements.txt
└── pyproject.toml
```

### The Repository Pattern — Why It Matters

This is what separates your project from every other student's:

```python
# repositories/base.py
from typing import Generic, TypeVar, Type
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

ModelType = TypeVar("ModelType")

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get_by_id(self, id: int) -> ModelType | None:
        result = await self.db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> ModelType:
        obj = self.model(**kwargs)
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)
        return obj
```

When an interviewer asks *"how do you change your database?"*, you say: *"My repository pattern abstracts the data layer. I'd only need to swap the repository implementation — the service layer and API layer are completely unaffected."* That's a senior-level answer.

### Dependency Injection Pattern (FastAPI's Superpower)

```python
# dependencies.py
from fastapi import Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.database import get_db
from app.repositories.interview_repo import InterviewRepository
from app.core.interview.service import InterviewService

async def get_interview_service(db: AsyncSession = Depends(get_db)) -> InterviewService:
    repo = InterviewRepository(db)
    return InterviewService(repo)

# api/v1/interviews.py
@router.post("/interviews", response_model=InterviewResponse)
async def create_interview(
    payload: CreateInterviewRequest,
    service: InterviewService = Depends(get_interview_service),
    current_user: User = Depends(get_current_user),
):
    return await service.create_interview(user_id=current_user.id, **payload.dict())
```

Every component is swappable, mockable, and testable in isolation.

---

## 4. Database Architecture (PostgreSQL)

### Schema Design with JSONB — The Best of Both Worlds

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interviews table  
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    job_role VARCHAR(255),
    difficulty_level VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',    -- pending, active, completed
    resume_data JSONB,                        -- parsed resume stored flexibly
    job_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interview sessions (each attempt)
CREATE TABLE interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID REFERENCES interviews(id),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    overall_score DECIMAL(5,2),
    detailed_metrics JSONB DEFAULT '{}',      -- { "communication": 85, "confidence": 72 }
    metadata JSONB DEFAULT '{}'
);

-- Questions and responses
CREATE TABLE qa_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES interview_sessions(id),
    question TEXT NOT NULL,
    question_type VARCHAR(100),               -- behavioral, technical, situational
    transcript TEXT,                          -- Whisper output
    ai_feedback JSONB,                        -- { "score": 8, "strengths": [], "improvements": [] }
    audio_metrics JSONB,                      -- { "wpm": 140, "filler_count": 3, "confidence": 0.87 }
    video_metrics JSONB,                      -- { "eye_contact": 0.75, "posture_score": 0.82 }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_interviews_user_id ON interviews(user_id);
CREATE INDEX idx_sessions_interview_id ON interview_sessions(interview_id);
CREATE INDEX idx_qa_session_id ON qa_records(session_id);
CREATE INDEX idx_sessions_overall_score ON interview_sessions(overall_score);
CREATE INDEX idx_interviews_status ON interviews(status);

-- GIN index for JSONB querying
CREATE INDEX idx_qa_audio_metrics ON qa_records USING gin(audio_metrics);
```

The JSONB fields are critical — they let you store evolving AI analysis data without needing migrations every time you add a new metric. You can also query inside JSONB: `WHERE audio_metrics->>'wpm' > '120'`. This is a sophisticated design choice that you can explain in interviews.

### Alembic for Database Migrations

```python
# This gives you version-controlled database changes
# alembic revision --autogenerate -m "add video_metrics to qa_records"
# alembic upgrade head
```

Every schema change is tracked, reversible, and auditable. This is how every real company manages databases.

---

## 5. Redis Architecture — Four Distinct Use Cases

Don't just use Redis as "a cache." Use it for four distinct purposes, and name them correctly in interviews:

```python
# infrastructure/redis_client.py
import redis.asyncio as aioredis
from enum import Enum

class RedisDB(Enum):
    SESSIONS = 0        # JWT session blacklist + refresh tokens
    API_CACHE = 1       # Analytics and read-heavy data
    RATE_LIMIT = 2      # Rate limiting counters
    REALTIME = 3        # WebSocket connection state

class RedisManager:
    def __init__(self):
        self.clients = {}

    async def get_client(self, db: RedisDB) -> aioredis.Redis:
        if db not in self.clients:
            self.clients[db] = await aioredis.from_url(
                f"redis://redis:6379/{db.value}",
                encoding="utf-8",
                decode_responses=True
            )
        return self.clients[db]
```

**DB 0 — Session Management:**
```python
# On login: store refresh token
await redis.setex(f"session:{user_id}:{token_id}", 86400, refresh_token)

# On logout: blacklist the access token
await redis.setex(f"blacklist:{jti}", 3600, "1")
```

**DB 1 — Smart API Caching:**
```python
# cache.py - Cache decorator
def cache(ttl: int = 300, key_prefix: str = ""):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            cache_key = f"{key_prefix}:{hash(str(kwargs))}"
            client = await redis_manager.get_client(RedisDB.API_CACHE)
            
            cached = await client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            result = await func(*args, **kwargs)
            await client.setex(cache_key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator

# Usage
@cache(ttl=600, key_prefix="analytics:user")
async def get_user_analytics(user_id: str) -> dict:
    ...  # expensive DB query only runs every 10 minutes
```

**DB 2 — Rate Limiting (Sliding Window Algorithm):**
```python
async def check_rate_limit(user_id: str, limit: int = 100, window: int = 3600) -> bool:
    client = await redis_manager.get_client(RedisDB.RATE_LIMIT)
    key = f"rate:{user_id}"
    pipe = client.pipeline()
    now = time.time()
    
    pipe.zremrangebyscore(key, 0, now - window)        # Remove old entries
    pipe.zadd(key, {str(now): now})                    # Add current request
    pipe.zcard(key)                                     # Count requests
    pipe.expire(key, window)
    
    results = await pipe.execute()
    return results[2] <= limit                          # True if within limit
```

**DB 3 — WebSocket State:**
```python
# Track which sessions are active (for reconnection support)
await redis.setex(f"ws:session:{session_id}", 300, user_id)
```

---

## 6. AI Pipeline Architecture — The Core Differentiator

### LangChain Orchestration with Proper Chain Design

```python
# core/ai/service.py
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from langchain.chains import LLMChain

class AIService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-pro",
            temperature=0.7,
            convert_system_message_to_human=True
        )
        self._build_chains()
    
    def _build_chains(self):
        # Chain 1: Resume Analysis → Role-specific question bank
        self.question_chain = LLMChain(
            llm=self.llm,
            prompt=ChatPromptTemplate.from_messages([
                ("system", SYSTEM_PROMPT),
                ("human", QUESTION_GEN_TEMPLATE)
            ]),
            output_parser=PydanticOutputParser(pydantic_object=QuestionSet)
        )
        
        # Chain 2: Answer Evaluation
        self.eval_chain = LLMChain(
            llm=self.llm,
            prompt=ChatPromptTemplate.from_messages([
                ("system", EVALUATOR_SYSTEM_PROMPT),
                ("human", EVALUATION_TEMPLATE)
            ]),
            output_parser=PydanticOutputParser(pydantic_object=EvaluationResult)
        )
    
    async def generate_questions(self, resume_text: str, job_role: str, 
                                  difficulty: str) -> QuestionSet:
        return await self.question_chain.ainvoke({
            "resume": resume_text,
            "job_role": job_role,
            "difficulty": difficulty,
            "count": 10
        })
    
    async def evaluate_answer(self, question: str, transcript: str, 
                               audio_metrics: dict) -> EvaluationResult:
        return await self.eval_chain.ainvoke({
            "question": question,
            "answer": transcript,
            "speaking_rate": audio_metrics.get("wpm"),
            "filler_count": audio_metrics.get("filler_count")
        })
```

### Whisper Integration with Audio Preprocessing

```python
# core/ai/whisper.py
import openai
import asyncio
from pydub import AudioSegment
import io

class WhisperService:
    def __init__(self):
        self.client = openai.AsyncOpenAI()
    
    async def transcribe(self, audio_bytes: bytes, language: str = "en") -> TranscriptResult:
        # Preprocess: normalize audio for better accuracy
        audio = AudioSegment.from_bytes(audio_bytes)
        audio = audio.normalize()
        
        buffer = io.BytesIO()
        audio.export(buffer, format="wav")
        buffer.seek(0)
        
        response = await self.client.audio.transcriptions.create(
            model="whisper-1",
            file=("audio.wav", buffer, "audio/wav"),
            language=language,
            response_format="verbose_json",    # Get word-level timestamps
            timestamp_granularities=["word"]
        )
        
        return TranscriptResult(
            text=response.text,
            words=response.words,               # Word-level timestamps for WPM
            confidence=self._calculate_confidence(response)
        )
    
    def analyze_speech_patterns(self, words: list) -> AudioMetrics:
        filler_words = {"um", "uh", "like", "you know", "basically", "literally"}
        
        total_duration = words[-1].end - words[0].start if words else 0
        wpm = (len(words) / total_duration * 60) if total_duration > 0 else 0
        filler_count = sum(1 for w in words if w.word.lower().strip() in filler_words)
        
        # Detect pause patterns
        pauses = [words[i].start - words[i-1].end for i in range(1, len(words))]
        avg_pause = sum(pauses) / len(pauses) if pauses else 0
        
        return AudioMetrics(
            wpm=round(wpm),
            filler_count=filler_count,
            filler_rate=filler_count / len(words) if words else 0,
            avg_pause_duration=avg_pause,
            total_duration=total_duration
        )
```

---

## 7. WebSocket Architecture — Real-Time Interview Flow

```python
# api/v1/websocket.py
from fastapi import WebSocket, WebSocketDisconnect
from app.core.interview.service import InterviewService

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
    
    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[session_id] = websocket
    
    async def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
    
    async def send_json(self, session_id: str, data: dict):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json(data)

manager = ConnectionManager()

@router.websocket("/ws/interview/{session_id}")
async def interview_websocket(
    websocket: WebSocket,
    session_id: str,
    service: InterviewService = Depends(get_interview_service)
):
    await manager.connect(session_id, websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type")
            
            match event_type:
                case "audio_chunk":
                    # Process audio asynchronously, don't block
                    asyncio.create_task(
                        handle_audio_chunk(session_id, data["payload"])
                    )
                case "frame":
                    asyncio.create_task(
                        handle_video_frame(session_id, data["payload"])
                    )
                case "answer_complete":
                    result = await service.evaluate_response(
                        session_id=session_id,
                        transcript=data["transcript"]
                    )
                    await manager.send_json(session_id, {
                        "type": "evaluation_result",
                        "payload": result
                    })
    except WebSocketDisconnect:
        await manager.disconnect(session_id)
```

---

## 8. Frontend Architecture (Next.js 15)

### App Router with Server and Client Components Split

```
frontend/
├── app/
│   ├── (auth)/                    # Route group - no layout wrapper
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/               # Protected route group
│   │   ├── layout.tsx             # Dashboard layout (sidebar, nav)
│   │   ├── dashboard/page.tsx     # Server Component (direct DB/API calls)
│   │   ├── interviews/
│   │   │   ├── page.tsx           # Server Component
│   │   │   ├── [id]/page.tsx
│   │   │   └── new/page.tsx
│   │   └── analytics/
│   │       └── page.tsx           # Server Component - async data fetch
│   └── api/                       # Next.js API routes (minimal - only auth cookie mgmt)
│       └── auth/
│           └── [...nextauth]/
│
├── components/
│   ├── ui/                        # shadcn/ui components (don't touch)
│   ├── interview/
│   │   ├── VideoCapture.tsx       # 'use client' - MediaStream API
│   │   ├── QuestionDisplay.tsx    # 'use client' - animated question
│   │   ├── AudioWaveform.tsx      # 'use client' - real-time waveform
│   │   └── FeedbackPanel.tsx      # 'use client' - live feedback
│   ├── analytics/
│   │   ├── PerformanceChart.tsx   # recharts integration
│   │   └── ScoreBreakdown.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── TopNav.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts              # Configured fetch/axios instance
│   │   ├── interviews.ts          # API functions
│   │   └── analytics.ts
│   ├── hooks/
│   │   ├── useWebSocket.ts        # WebSocket management hook
│   │   ├── useMediaCapture.ts     # Camera/mic access hook
│   │   └── useInterviewSession.ts # Full session state machine
│   ├── stores/
│   │   └── interviewStore.ts      # Zustand for complex client state
│   └── utils/
│       └── audio.ts               # Audio processing utilities
│
└── types/
    └── index.ts                   # Shared TypeScript interfaces
```

### TanStack Query — The Right Way

```typescript
// lib/hooks/useInterviews.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { interviewsApi } from "@/lib/api/interviews"

// Query Keys factory (prevents typos, enables precise invalidation)
export const interviewKeys = {
  all: ["interviews"] as const,
  lists: () => [...interviewKeys.all, "list"] as const,
  list: (filters: object) => [...interviewKeys.lists(), filters] as const,
  detail: (id: string) => [...interviewKeys.all, "detail", id] as const,
  analytics: (id: string) => [...interviewKeys.all, "analytics", id] as const,
}

export function useInterviews(filters = {}) {
  return useQuery({
    queryKey: interviewKeys.list(filters),
    queryFn: () => interviewsApi.getAll(filters),
    staleTime: 30_000,          // Data fresh for 30s
    gcTime: 5 * 60_000,         // Keep in memory 5 minutes
  })
}

export function useCreateInterview() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: interviewsApi.create,
    onSuccess: (newInterview) => {
      // Optimistic update - update cache before server response
      queryClient.setQueryData(
        interviewKeys.detail(newInterview.id),
        newInterview
      )
      // Invalidate list so it refetches
      queryClient.invalidateQueries({ queryKey: interviewKeys.lists() })
    }
  })
}
```

### Interview Session State Machine

This is what will genuinely impress interviewers — modeling complex UI state as a state machine:

```typescript
// lib/hooks/useInterviewSession.ts
type InterviewState = 
  | { status: "idle" }
  | { status: "setup"; interviewId: string }
  | { status: "connecting"; sessionId: string }
  | { status: "question_display"; question: Question; timeRemaining: number }
  | { status: "recording"; question: Question; transcript: string }
  | { status: "processing" }
  | { status: "feedback"; evaluation: Evaluation }
  | { status: "completed"; report: InterviewReport }
  | { status: "error"; error: string }

// Each state only allows valid transitions
// Can't go from "idle" to "recording" — must go through "setup" → "connecting" first
// This is called a discriminated union — a key TypeScript pattern
```

---

## 9. Testing Strategy — How to Hit 60-70% Coverage Intelligently

Test what matters, not everything equally:

```
tests/
├── unit/                          # Fast, isolated, mock everything external
│   ├── test_audio_metrics.py      # Pure calculation functions
│   ├── test_scoring_logic.py      # Scoring algorithms
│   └── test_prompt_templates.py   # LangChain prompt construction
│
├── integration/                   # Test with real DB (test DB), mock external APIs
│   ├── test_auth_flow.py          # Login → token → protected route
│   ├── test_interview_lifecycle.py # Create → start → answer → complete
│   └── test_analytics_queries.py  # Complex DB queries
│
└── e2e/                           # Happy path only (Playwright optional)
    └── test_complete_interview.py
```

```python
# tests/conftest.py - The key to clean tests
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

@pytest_asyncio.fixture
async def test_db():
    """Fresh database for each test — never pollute production data"""
    engine = create_async_engine("postgresql+asyncpg://test:test@localhost/test_db")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def mock_ai_service(mocker):
    """Never call real AI APIs in tests — slow and costs money"""
    mock = mocker.patch("app.core.ai.service.AIService")
    mock.return_value.generate_questions.return_value = MOCK_QUESTIONS
    mock.return_value.evaluate_answer.return_value = MOCK_EVALUATION
    return mock

@pytest_asyncio.fixture
async def client(test_db, mock_ai_service):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
```

---

## 10. DevOps Architecture

### Docker Compose for Development

```yaml
# docker-compose.yml
version: "3.9"

services:
  frontend:
    build:
      context: ./frontend
      target: development           # Multi-stage build
    volumes:
      - ./frontend:/app
      - /app/node_modules           # Don't override node_modules
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      target: development
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://pitchperfect:password@postgres:5432/pitchperfect
      - REDIS_URL=redis://redis:6379
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: pitchperfect
      POSTGRES_PASSWORD: password
      POSTGRES_DB: pitchperfect
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pitchperfect"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s

volumes:
  postgres_data:
  redis_data:
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: test_pitchperfect
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: "3.11"
          cache: "pip"
      
      - name: Install dependencies
        run: pip install -r backend/requirements.txt
      
      - name: Run tests with coverage
        run: |
          cd backend
          pytest tests/ --cov=app --cov-report=xml --cov-report=term-missing
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3     # Badge on README!

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      
      - run: cd frontend && npm ci
      - run: cd frontend && npm run type-check
      - run: cd frontend && npm test -- --coverage --watchAll=false

  docker-build:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker images
        run: docker compose build
      - name: Verify services start correctly
        run: |
          docker compose up -d
          sleep 10
          curl -f http://localhost:8000/health || exit 1
          docker compose down
```

---

## 11. Security Implementation (Often Ignored, Always Impressive)

```python
# core/security.py
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import jwt
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class SecurityService:
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
    
    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)
    
    def verify_password(self, plain: str, hashed: str) -> bool:
        return pwd_context.verify(plain, hashed)
    
    def create_access_token(self, user_id: str) -> str:
        payload = {
            "sub": user_id,
            "jti": str(uuid.uuid4()),      # Unique token ID for blacklisting
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
            "type": "access"
        }
        return jwt.encode(payload, self.secret_key, algorithm="HS256")
    
    def create_refresh_token(self, user_id: str) -> str:
        payload = {
            "sub": user_id,
            "jti": str(uuid.uuid4()),
            "exp": datetime.now(timezone.utc) + timedelta(days=7),
            "type": "refresh"
        }
        return jwt.encode(payload, self.secret_key, algorithm="HS256")
```

Also implement: CORS configuration (not wildcard), environment variable validation on startup (Pydantic Settings), SQL injection prevention (SQLAlchemy parameterized queries), and XSS protection (Content-Security-Policy headers).

---

## 12. What Makes This Project Stand Out in Interviews

### The Story You Tell

> *"PitchPerfect is a real-time AI interview simulator. When I started, it was a basic Flask app with Firebase. I redesigned it with Clean Architecture, separating concerns across four layers — presentation, API, domain logic, and infrastructure. The domain layer has zero knowledge of HTTP or databases, making it fully testable. I use the Repository Pattern to abstract data access, so I can switch databases without touching business logic.*
>
> *For performance, I implemented Redis with four separate databases for different use cases: session management, API caching, rate limiting with a sliding window algorithm, and WebSocket connection tracking. My analytics endpoints went from 800ms to 45ms average response time after adding caching.*
>
> *The AI pipeline uses LangChain to orchestrate Gemini for question generation and Whisper for speech transcription. Whisper gives me word-level timestamps, which I use to calculate speaking rate, detect filler words, and analyze pause patterns — these feed into a holistic confidence score.*
>
> *Everything runs in Docker containers with a GitHub Actions CI/CD pipeline. Tests run automatically on every push — I'm at 68% coverage targeting the highest-risk code paths rather than chasing 100%."*

That answer demonstrates: system design thinking, performance optimization, architectural patterns, AI integration depth, and DevOps maturity. It's a senior-engineer-level answer from a 2nd-year student.

---

## 13. Resume Bullet Points

Transform these vague claims into specific, quantified bullet points:

```
❌ "Built an AI interview app using Python and React"

✅ "Architected a real-time AI interview simulator using FastAPI and Next.js 15,
   implementing Clean Architecture with Repository Pattern across a 4-service
   Docker Compose stack (PostgreSQL, Redis, FastAPI, Next.js)"

✅ "Reduced API response time by 94% (800ms → 45ms) through Redis caching with
   TTL-based invalidation and connection pooling via SQLAlchemy"

✅ "Integrated OpenAI Whisper with word-level timestamps to analyze 6 speech
   metrics (WPM, filler rate, pause patterns) in real-time over WebSocket"

✅ "Established CI/CD pipeline with GitHub Actions achieving 68% test coverage
   across 47 pytest and Jest test cases; all tests run on every commit"

✅ "Implemented JWT authentication with refresh token rotation and Redis-backed
   token blacklisting, and sliding window rate limiting (100 req/hr per user)"
```

Numbers, patterns, and specific technologies win interviews.

---

## Summary: The Full Stack, Justified

| Layer | Technology | Why It's the Right Choice |
|---|---|---|
| Frontend Framework | Next.js 15 App Router | Server Components = better performance, SEO |
| Client State | TanStack Query | Solves cache invalidation, loading states automatically |
| Backend | FastAPI (async) | Handles concurrent WebSocket + REST without blocking |
| ORM | SQLAlchemy async | Type-safe queries, migration support, repository pattern |
| Primary DB | PostgreSQL + JSONB | Relational integrity + flexible schema for AI outputs |
| Cache/Sessions | Redis (4 DBs) | Purpose-separated, not one generic cache |
| AI Orchestration | LangChain | Chain composition, prompt management, model swapping |
| Transcription | OpenAI Whisper | Word-level timestamps = richer speech analytics |
| Containerization | Docker Compose | One-command startup, environment parity |
| CI/CD | GitHub Actions | Free, badge-able, industry-standard |
| Testing | pytest + Jest | Async-native, fixture-based isolation |
| Auth | JWT + Refresh Rotation | Stateless but revocable — industry best practice |

This is a coherent, well-reasoned system where every technology earns its place. That's the quality that gets you offers.