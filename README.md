# PitchPerfect

## 1. Project Overview

PitchPerfect is an AI-powered mock-interview platform aimed at job-seekers who want structured, data-driven practice before real interviews. Candidates upload a résumé and job description, receive dynamically generated questions from a Gemini LLM, and conduct a live interview session where their spoken answers are transcribed by OpenAI Whisper, their audio is analysed for pacing and filler-word count by a Python microservice, and their facial expressions are evaluated for engagement by a DeepFace microservice. After the session a Celery worker renders a PDF report scoring each answer across three dimensions (Communication, Engagement, Substance) and pushes a `report_ready` event back to the client via Redis Pub/Sub.

### Status

| Category | State |
|---|---|
| JWT auth (register / login / refresh / logout, Redis token blacklist) | ✅ End-to-end |
| Question generation — `POST /api/v1/questions/behavioral` and `/technical` | ✅ End-to-end |
| WebSocket audio pipeline: `audio_chunk` → voice microservice + Whisper STT → transcript accumulation in `qa_records` | ✅ End-to-end |
| WebSocket video pipeline: `video_frame` → facial-analysis microservice → emotion result pushed to client | ✅ End-to-end |
| `POST /api/v1/interviews/{id}/finish` → Celery `generate_interview_report` task → PDF + Redis Pub/Sub push | ✅ End-to-end |
| `GET /api/v1/analytics/sessions` and `POST` (save session) | ✅ End-to-end |
| Schedule CRUD (`GET` / `POST` / `DELETE /api/v1/schedule`) | ✅ End-to-end |
| User profile (`GET` / `POST` / `PATCH /api/v1/users/profile`) | ✅ End-to-end |
| `AnalyticsProcessor.score_session` — scoring engine called from reporting task | ✅ Implemented and wired |
| `AnalyticsRepository.get_session_summary` and `get_user_trends` — SQL queries implemented | ✅ Implemented — **not yet wired to any REST endpoint** |
| `MediaProcessor` (`core/media/processor.py`) — pydub/OpenCV normalisation stub | ⚠️ Implemented but not called from the live WebSocket path (superseded by `StreamProcessor`) |
| `RedisStateManager` (`infrastructure/redis_state.py`) — older pub/sub design | ⚠️ Implemented but not used in the live request path (superseded by `RedisManager`) |
| Voice analysis microservice (`python-voice-analysis-service`) — energy-based WPM estimation | ⚠️ Running but produces rough approximations; no real speech recognition |
| S3 report upload (`STORAGE_BACKEND=s3` path in `reporting.py`) | ⚠️ Code present — requires `aioboto3` and AWS credentials not in `.env.example` |
| `SYNC_DATABASE_URL` required by Celery reporting task | ⚠️ Not in `.env.example`; missing at runtime breaks PDF generation |
| Badge/XP/streak system visible in `useAuth` frontend types | 🔲 Frontend UI types only — no backend implementation |
| `TrendData` / `TrendPoint` schemas in `analytics/schemas.py` | 🔲 Schemas exist; no REST endpoint exposes them yet |

---

## 2. Tech Stack

### Frontend

| Technology | Version (package.json) | Role |
|---|---|---|
| **Next.js** | 15.2.4 | App-router SSR/CSR framework; hosts all pages under `app/` |
| **React** | 18.3.1 | UI component model |
| **TypeScript** | ^5 | Static typing across all frontend code |
| **Tailwind CSS** | ^3.4.17 | Utility-first styling; configured in `tailwind.config.ts` |
| **Radix UI** | various | Accessible, unstyled primitives (Dialog, Toast, Select, etc.) |
| **Framer Motion** | ^12.38 | Micro-animations and page transitions |
| **TanStack Query** | ^5.91 | Server-state caching and background refetching for API calls |
| **React Hook Form + Zod** | ^7.54 / ^3.24 | Form state management and runtime validation |
| **Recharts** | latest | Score charts on the analytics and results pages |
| **react-webcam** | ^7.2 | Browser camera capture for `video_frame` WebSocket frames |
| **Axios** | ^1.11 | HTTP client used alongside native `fetch` in `use-auth.ts` |
| **Sonner** | ^1.7 | Toast notifications |

### Backend

| Technology | Version (requirements.txt) | Role |
|---|---|---|
| **FastAPI** | ≥0.111 | ASGI web framework; all REST routes and WebSocket endpoint |
| **Uvicorn** | ≥0.30 | ASGI server with `standard` extras (WebSocket support) |
| **SQLAlchemy 2 (async)** | ≥2.0.30 | ORM with `asyncpg` driver for async PostgreSQL access |
| **Alembic** | ≥1.13 | Schema migrations (3 migrations: initial schema, `profile_data`, `scheduled_sessions`) |
| **Pydantic v2** | ≥2.7 | Request/response validation and typed output parsing for LLM responses |
| **PyJWT + bcrypt** | ≥2.8 / ≥4.1 | HS256 JWT creation/validation; bcrypt password hashing |
| **redis (asyncio)** | ≥5.0 | Token blacklist, session metadata, Pub/Sub for report events, rate-limiter backing store |
| **Celery + Kombu** | ≥5.4 / ≥5.3 | Async task queue for PDF report generation (broker = Redis) |
| **prometheus-client** | ≥0.20 | HTTP, DB, AI, and WebSocket metrics exposed at `/metrics` |
| **httpx** | ≥0.27 | Async HTTP client inside `StreamProcessor` for calling the two Python microservices |

### AI / ML

| Technology | Role |
|---|---|
| **LangChain-Google-GenAI** (≥1.0) + **langchain-core** (≥0.2) | `AIService` builds `ChatPromptTemplate` chains piped through `ChatGoogleGenerativeAI` (model `gemini-1.5-flash`) and parses structured output with `PydanticOutputParser` |
| **OpenAI Whisper** (`openai` ≥1.30, model `whisper-1`) | `StreamProcessor.transcribe_audio` sends 16 kHz mono WAV to the Whisper API for speech-to-text; result is accumulated into `qa_records.transcript` |
| **DeepFace** (in `python-analysis-service`) | Facial emotion recognition on every `video_frame`; returns `dominant_emotion` and per-emotion scores |
| **soundfile** (≥0.12) | In-process WAV decode/encode before Whisper upload |

### Data

| Technology | Role |
|---|---|
| **PostgreSQL 16** (Docker: `postgres:16-alpine`) | Primary relational store; JSONB columns for `resume_data`, `ai_feedback`, `audio_metrics`, `video_metrics`, `profile_data`, `detailed_metrics` |
| **Redis 7** (Docker: `redis:7-alpine`) | Three functions: JWT blacklist, session metadata (TTL 1 h), Celery broker/result-backend |

### Infrastructure

| Technology | Role |
|---|---|
| **Docker Compose** (`docker-compose.prod.yml`) | Orchestrates `db`, `redis`, `app` (FastAPI), `web` (Next.js), `nginx` on two networks: `pitchperfect_internal` (DB+Redis, not internet-reachable) and `pitchperfect_external` |
| **Nginx 1.27** | Reverse proxy + TLS termination; config expected at `./nginx/nginx.conf` |
| **GitHub Container Registry** | Images tagged `ghcr.io/${GITHUB_REPOSITORY}/backend:${IMAGE_TAG}` and `/frontend:${IMAGE_TAG}` |

---

## 3. Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Browser (Next.js 15)"]
        UI["app/ pages\n(interview, dashboard,\nanalytics, schedule)"]
        WS_CLIENT["WebSocket client\n(useInterviewMachine.ts)"]
        AUTH_HOOK["useAuth hook\n(hooks/use-auth.ts)"]
    end

    subgraph API["FastAPI Backend (backend/app)"]
        AUTH_R["auth.py\n/api/v1/auth/*"]
        INTERVIEW_R["interviews.py\n/api/v1/interviews/*"]
        QUESTIONS_R["questions.py\n/api/v1/questions/*"]
        ANALYTICS_R["analytics.py\n/api/v1/analytics/*"]
        USERS_R["users.py\n/api/v1/users/*"]
        SCHEDULE_R["schedule.py\n/api/v1/schedule/*"]
        HEALTH_R["health.py\n/health*"]
        WS_R["websocket.py\n/ws/interview/{session_id}"]
    end

    subgraph Services["Service / Domain Layer (core/)"]
        AI_SVC["AIService\n(core/ai/service.py)"]
        INTERVIEW_SVC["InterviewService\n(core/interview/service.py)"]
        STREAM_PROC["StreamProcessor\n(core/media/stream_processor.py)"]
        ANALYTICS_PROC["AnalyticsProcessor\n(core/analytics/processor.py)"]
        REPORTING["generate_interview_report\n(core/tasks/reporting.py)"]
        SECURITY["security.py\n(JWT + bcrypt)"]
    end

    subgraph Repos["Repository Layer (repositories/)"]
        USER_REPO["UserRepository"]
        INTERVIEW_REPO["InterviewRepository"]
        SESSION_REPO["SessionRepository"]
        QA_REPO["QARecordRepository"]
        SCHEDULE_REPO["ScheduleRepository"]
        ANALYTICS_REPO["AnalyticsRepository"]
    end

    subgraph Infra["Infrastructure"]
        PG["PostgreSQL 16\n(users, interviews,\ninterview_sessions,\nqa_records,\nscheduled_sessions)"]
        REDIS["Redis 7\n(blacklist, session meta,\nCelery broker)"]
        VOICE_MS["python-voice-analysis-service\n:8001 /analyze-voice"]
        FACIAL_MS["python-analysis-service\n:8002 /analyze"]
        OPENAI["OpenAI Whisper API"]
        GEMINI["Google Gemini\ngemini-1.5-flash"]
    end

    UI -->|REST| AUTH_R
    UI -->|REST| INTERVIEW_R
    UI -->|REST| QUESTIONS_R
    UI -->|REST| ANALYTICS_R
    UI -->|REST| USERS_R
    UI -->|REST| SCHEDULE_R
    WS_CLIENT -->|WS| WS_R
    AUTH_HOOK -->|Bearer JWT| AUTH_R

    AUTH_R --> SECURITY
    AUTH_R --> USER_REPO
    SECURITY --> REDIS

    INTERVIEW_R --> INTERVIEW_REPO
    INTERVIEW_R --> SESSION_REPO
    INTERVIEW_R --> REPORTING

    QUESTIONS_R --> AI_SVC
    AI_SVC -->|LangChain chain| GEMINI

    ANALYTICS_R --> ANALYTICS_REPO

    WS_R --> STREAM_PROC
    STREAM_PROC -->|POST| VOICE_MS
    STREAM_PROC -->|POST| FACIAL_MS
    STREAM_PROC -->|API call| OPENAI
    STREAM_PROC --> QA_REPO

    REPORTING --> ANALYTICS_PROC
    REPORTING --> REDIS
    REPORTING --> PG

    USER_REPO --> PG
    INTERVIEW_REPO --> PG
    SESSION_REPO --> PG
    QA_REPO --> PG
    SCHEDULE_REPO --> PG
    ANALYTICS_REPO --> PG
```

---

## 4. OOD / Class Diagrams

### 4a. Service Layer

```mermaid
classDiagram
    class AIService {
        +llm : ChatGoogleGenerativeAI
        +question_parser : PydanticOutputParser
        +evaluation_parser : PydanticOutputParser
        +__init__(api_key, model_name)
        +generate_questions(resume_text, job_description, job_role, num_questions) QuestionList
        +evaluate_response(question, transcript) FeedbackModel
    }

    class InterviewService {
        +ai_service : AIService
        +interview_repo : InterviewRepository
        +session_repo : SessionRepository
        +qa_repo : QARecordRepository
        +__init__(ai_service, interview_repo, session_repo, qa_repo)
        +create_interview_from_resume(user_id, resume_text, interview_data) UUID
        +process_answer(session_id, record_id, transcript) dict
    }

    class StreamProcessor {
        +session_id : str
        -_http : AsyncClient
        +__init__(session_id)
        +handle_video_stream(frame_base64, metadata) dict
        +handle_audio_stream(audio_base64, metadata) dict
        +transcribe_audio(audio_base64) str
        +finalize() None
    }

    class AnalyticsProcessor {
        +weights : ScoringWeights
        +comm_rubric : CommunicationRubric
        +eng_rubric : EngagementRubric
        +__init__(weights, comm_rubric, eng_rubric)
        +score_communication(wpm, filler_word_count) float
        +score_engagement(dominant_emotion, emotion_intensity) float
        +score_substance(clarity_score, tech_depth_score, communication_score) float
        +compute_composite(comm, eng, sub) float
        +score_session(qa_records) dict
    }

    class RedisManager {
        -_url : str
        -_client : Redis
        +connect() None
        +disconnect() None
        +set_session_metadata(session_id, metadata) None
        +get_session_metadata(session_id) dict
        +publish_feedback(session_id, feedback) int
        +subscribe(session_id) AsyncIterator
        +broadcast_to_socket(session_id, event_type, payload) None
    }

    InterviewService --> AIService : constructor injection
    InterviewService --> AnalyticsProcessor : indirectly via reporting task
    AnalyticsProcessor ..> RedisManager : reporting task broadcasts via pub/sub
```

**Design notes:** `InterviewService` receives all its dependencies through constructor injection (Dependency Inversion Principle — `core/interview/service.py` lines 17–27). `AnalyticsProcessor` is a stateless **Strategy** — it holds configurable `ScoringWeights` / `CommunicationRubric` / `EngagementRubric` frozen dataclasses so the scoring algorithm can be tuned without subclassing (Open/Closed Principle). `StreamProcessor` is a per-session **Façade** that coordinates three external I/O operations (voice microservice, facial microservice, Whisper API) behind a single clean interface.

---

### 4b. Repository Layer

```mermaid
classDiagram
    class BaseRepositoryT {
        +model : Type
        +session : AsyncSession
        +__init__(model, session)
        +get(id) T
        +get_multi(skip, limit) List
        +create(obj_in) T
        +update(db_obj, obj_in) T
        +delete(id) T
    }

    class UserRepository {
        +__init__(session)
        +get_by_email(email) User
    }

    class InterviewRepository {
        +__init__(session)
        +get_active_by_user(user_id) List
    }

    class SessionRepository {
        +__init__(session)
    }

    class QARecordRepository {
        +__init__(session)
        +create_batch(obj_in_list) List
        +get_by_session_id(session_id) List
    }

    class ScheduleRepository {
        +__init__(session)
        +get_by_user_id(user_id) List
    }

    class AnalyticsRepository {
        -_session : AsyncSession
        +__init__(session)
        +get_session_summary(session_id) dict
        +get_user_trends(user_id) list
    }

    BaseRepositoryT <|-- UserRepository : T = User
    BaseRepositoryT <|-- InterviewRepository : T = Interview
    BaseRepositoryT <|-- SessionRepository : T = InterviewSession
    BaseRepositoryT <|-- QARecordRepository : T = QARecord
    BaseRepositoryT <|-- ScheduleRepository : T = ScheduledSession
```

**Design notes:** `BaseRepository[T]` (Generic Repository pattern, GoF) centralises the standard CRUD contract — all concrete repositories inherit consistent `get`, `get_multi`, `create`, `update`, `delete` methods (Single Responsibility / DRY). `AnalyticsRepository` deliberately does *not* extend `BaseRepository` because it performs multi-table JSONB aggregate SQL queries that have no ORM-model equivalent. This reflects Interface Segregation Principle — analytics callers should not be exposed to ORM lifecycle methods they don't need.

---

## 5. Database Schema

```mermaid
erDiagram
    users {
        UUID id PK
        VARCHAR255 email "UNIQUE NOT NULL indexed"
        VARCHAR255 hashed_password "NOT NULL"
        VARCHAR255 full_name "nullable"
        VARCHAR255 username "nullable"
        BOOLEAN is_active "NOT NULL default true"
        JSONB profile_data "nullable"
        TIMESTAMP created_at "NOT NULL server_default now()"
        TIMESTAMP updated_at "NOT NULL onupdate now()"
    }

    interviews {
        UUID id PK
        UUID user_id FK "NOT NULL CASCADE"
        VARCHAR255 title "NOT NULL"
        VARCHAR255 job_role "NOT NULL"
        JSONB resume_data "nullable"
        ENUM status "NOT NULL default pending"
        TIMESTAMP created_at "NOT NULL"
        TIMESTAMP updated_at "NOT NULL"
    }

    interview_sessions {
        UUID id PK
        UUID interview_id FK "NOT NULL CASCADE"
        NUMERIC52 overall_score "nullable"
        JSONB detailed_metrics "nullable"
        TIMESTAMP created_at "NOT NULL"
        TIMESTAMP updated_at "NOT NULL"
    }

    qa_records {
        UUID id PK
        UUID session_id FK "NOT NULL CASCADE"
        TEXT question "NOT NULL"
        TEXT transcript "nullable"
        JSONB ai_feedback "nullable"
        JSONB audio_metrics "nullable"
        JSONB video_metrics "nullable"
        TIMESTAMP created_at "NOT NULL"
        TIMESTAMP updated_at "NOT NULL"
    }

    scheduled_sessions {
        UUID id PK
        UUID user_id FK "NOT NULL CASCADE indexed"
        VARCHAR255 title "NOT NULL"
        VARCHAR50 type "NOT NULL"
        VARCHAR10 date "NOT NULL YYYY-MM-DD"
        VARCHAR5 time "NOT NULL HH-MM"
        INTEGER duration "NOT NULL default 30"
        TEXT description "nullable"
        VARCHAR50 location "NOT NULL default online"
        INTEGER participants "NOT NULL default 1"
        BOOLEAN reminder "NOT NULL default true"
        VARCHAR20 status "NOT NULL default scheduled"
        TIMESTAMP created_at "NOT NULL"
        TIMESTAMP updated_at "NOT NULL"
    }

    users ||--o{ interviews : "user_id"
    interviews ||--o{ interview_sessions : "interview_id"
    interview_sessions ||--o{ qa_records : "session_id"
    users ||--o{ scheduled_sessions : "user_id"
```

**JSONB shapes:**
- `users.profile_data`: `{name, phone, bio, experience, targetRole, industry, company, education, skills[], goals[], linkedinUrl, githubUrl, saved_sessions[]}`
- `interviews.resume_data`: `{text: "<plain text>"}`
- `interview_sessions.detailed_metrics`: `{report_url, scores:{communication, engagement, substance, overall}}` — populated by the reporting Celery task
- `qa_records.ai_feedback`: `{clarity_score, tech_depth_score, communication_score, detailed_feedback, suggested_answer_points[]}`
- `qa_records.audio_metrics`: `{wpm, fillerWords, volume, confidence, clarity}`
- `qa_records.video_metrics`: `{dominant_emotion, emotion_intensity, emotion:{happy, sad, angry, ...}}`
- `InterviewStatus` enum values: `pending | in_progress | completed | failed`

---

## 6. Key Flows

### 6a. Spoken Answer — WebSocket Audio Pipeline

```mermaid
sequenceDiagram
    participant FE as Browser
    participant WS as websocket.py
    participant SP as StreamProcessor
    participant VOICE as voice-analysis-service :8001
    participant WHISPER as OpenAI Whisper
    participant QA as QARecordRepository
    participant PG as PostgreSQL

    FE->>WS: WS frame {type:"audio_chunk", data:base64WAV, metadata:{record_id}}
    WS->>SP: handle_audio_stream(data, metadata)
    WS->>SP: transcribe_audio(data)
    Note over WS,SP: asyncio.gather() — both run in PARALLEL
    SP-->>VOICE: POST /analyze-voice (multipart audio bytes)
    SP-->>WHISPER: audio.transcriptions.create (16kHz mono WAV)
    VOICE-->>SP: {wpm, fillerWords, volume, confidence, clarity}
    WHISPER-->>SP: transcript string
    SP-->>WS: voice_result, transcript
    WS->>FE: {type:"voice_analysis_result", ...voice_result}
    WS->>FE: {type:"transcript_result", transcript, session_id}
    alt record_id in metadata AND transcript non-empty
        WS->>QA: get(UUID(record_id))
        QA->>PG: SELECT qa_records WHERE id=?
        PG-->>QA: QARecord
        WS->>QA: update(record, {transcript: existing + " " + transcript})
        QA->>PG: UPDATE qa_records SET transcript=?
        WS->>PG: db.commit()
    end
```

---

### 6b. Question Generation Flow

```mermaid
sequenceDiagram
    participant FE as Browser
    participant API as questions.py /behavioral
    participant AI as AIService
    participant LC as LangChain chain
    participant GEMINI as Gemini gemini-1.5-flash

    FE->>API: POST /api/v1/questions/behavioral {resume_text, job_description, job_role, num_questions}
    API->>AI: _get_ai_service() lazy singleton with GEMINI_API_KEY
    API->>AI: generate_questions(...)
    AI->>LC: question_prompt OR llm OR question_parser
    Note over AI,LC: System prompt = QUESTION_GENERATION_SYSTEM<br/>Human prompt = QUESTION_GENERATION_HUMAN<br/>with PydanticOutputParser(QuestionList) format_instructions
    LC->>GEMINI: ChatGoogleGenerativeAI.ainvoke(prompt_value)
    GEMINI-->>LC: JSON-structured LLM response
    LC-->>AI: PydanticOutputParser parses to QuestionList
    AI-->>API: QuestionList
    API-->>FE: 200 {success:true, questions:[{id, text, type}]}
```

---

## 7. Interview Session State Machine

The `useInterviewMachine` hook in [`components/interview/behavioral/useInterviewMachine.ts`](components/interview/behavioral/useInterviewMachine.ts) implements a finite-state machine with React `useReducer`.

```mermaid
stateDiagram-v2
    [*] --> idle

    idle --> setup : START_SETUP

    setup --> recording : START_INTERVIEW(totalQuestions)

    recording --> recording : AVATAR_SPEAK_START / AVATAR_SPEAK_END
    recording --> recording : USER_SPEAK_START / USER_SPEAK_END
    recording --> recording : SET_RESPONSE(index, transcript)
    recording --> recording : TOGGLE_AUDIO / TOGGLE_VIDEO / TOGGLE_SPEAKER
    recording --> recording : SET_AUDIO_LEVEL / SET_CONFIDENCE / TICK
    recording --> recording : NEXT_QUESTION [next < totalQuestions]
    recording --> evaluating : NEXT_QUESTION [next >= totalQuestions]

    evaluating --> completed : FINISH
```

States (`InterviewPhase` type): `idle | setup | recording | evaluating | completed`. The `recording` state also carries `currentQuestion`, `isAvatarSpeaking`, `isUserSpeaking`, `audioLevel`, and `confidenceScore` as sub-fields of the reducer state — they are not separate machine states. The `evaluating` phase is transient in the current UI: the reducer reaches it when the last question is answered, but the actual AI evaluation is triggered separately via `POST /api/v1/interviews/{id}/finish`, not inside the reducer.

---

## 8. Design Patterns Catalog

| Pattern | Where it is used | Why |
|---|---|---|
| **Generic Repository** | `BaseRepository[T]` — `repositories/base.py` | Single CRUD contract for all ORM models; concrete repos only add entity-specific queries |
| **Factory Method** | `create_app()` — `main.py` | Isolates app construction (middleware registration, router mounting) from module-level side effects |
| **Strategy** | `AnalyticsProcessor` with injected `ScoringWeights`, `CommunicationRubric`, `EngagementRubric` — `core/analytics/processor.py` | Scoring algorithm is fully configurable at construction time without subclassing |
| **Façade** | `StreamProcessor` — `core/media/stream_processor.py` | Hides three distinct async I/O calls (voice service, facial service, Whisper) behind a single per-session object |
| **Chain of Responsibility** | FastAPI middleware stack: `TrustedHostMiddleware` → `CORSMiddleware` → `PrometheusMiddleware` → `RequestIDMiddleware` → security-header function — `main.py` | Each middleware handles one concern and forwards to the next |
| **Singleton** | `redis_manager` in `infrastructure/redis_manager.py`; in-process `ConnectionManager` in `websocket.py`; lazy `_ai_service` in `questions.py` | One shared Redis client and one WebSocket registry per process |
| **Observer / Pub/Sub** | `RedisManager.publish_feedback` / `subscribe` — `infrastructure/redis_manager.py`; reporting task calls `broadcast_to_socket` after PDF upload | Decouples Celery worker (producer) from the WebSocket handler (consumer) |
| **Template Method** (partial) | LangChain `ChatPromptTemplate` pipe: `question_prompt \| llm \| question_parser` — `core/ai/service.py` | Skeleton algorithm (format → invoke → parse) with pluggable steps |
| **DTO / Value Object** | `InterviewCreateDTO`, `FeedbackModel`, `QuestionList`, `SkillBreakdown`, `SessionReport` (all Pydantic) | Typed, validated data carriers between layers with no identity semantics |
| **Idempotency lock** | Redis NX key in `generate_interview_report` — `core/tasks/reporting.py` | Prevents duplicate PDFs when a Celery task is retried after a crash |
| **Sliding-window rate limiter** | `SlidingWindowRateLimiter` + Lua script — `middleware/rate_limiter.py` | Atomic Redis Lua script guarantees correct counts under concurrent requests |

### Potential Future Improvements *(not yet implemented)*

- **Unit of Work** — DB commits are scattered across route handlers (`await db.commit()`). A UoW pattern would centralise transaction boundaries and make the service layer commit-agnostic.
- **CQRS** — `AnalyticsRepository` already separates read-heavy aggregation from ORM writes; a full Command/Query split would make adding read replicas straightforward.
- **Circuit Breaker** — `StreamProcessor` falls back to a neutral emotion dict on facial-service failure, but no circuit-breaker state machine stops hammering an unhealthy microservice.

---

## 9. API Reference

### REST Endpoints

| Method | Path | Auth | Request body | Response |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | None | `{email, password, full_name, username?}` | `{id, email, full_name, username}` 201 |
| `POST` | `/api/v1/auth/login` | None | `{email, password}` | `{access_token, refresh_token, token_type, expires_in}` + httpOnly `pp_refresh_token` cookie |
| `POST` | `/api/v1/auth/refresh` | `pp_refresh_token` cookie | — | New `TokenPair` + rotated cookie |
| `POST` | `/api/v1/auth/logout` | Bearer | `{access_jti?}` | `{message}` |
| `GET` | `/api/v1/auth/me` | Bearer | — | `{id, email, full_name, username, is_active, created_at}` |
| `POST` | `/api/v1/questions/behavioral` | None | `{resume_text, job_description?, job_role?, num_questions?}` | `{success, questions:[{id, text, type}]}` |
| `POST` | `/api/v1/questions/technical` | None | same as behavioral | same as behavioral |
| `POST` | `/api/v1/interviews/{interview_id}/finish` | Bearer | `{session_id}` | `{session_id, task_id, message}` 202 |
| `GET` | `/api/v1/interviews/tasks/{task_id}/status` | Bearer | — | `{task_id, status, result, ready}` |
| `GET` | `/api/v1/interviews/{interview_id}/sessions/{session_id}/report-url` | Bearer | — | `{session_id, report_url, overall_score}` |
| `GET` | `/api/v1/analytics/sessions` | Bearer | — | `{sessions:[{id, type, score, date, duration, category}]}` |
| `POST` | `/api/v1/analytics/sessions` | Bearer | `{type, score, date, duration, category}` | `SessionData` 201 |
| `GET` | `/api/v1/users/profile` | Bearer | — | `ProfileResponse` |
| `POST` | `/api/v1/users/profile` | Bearer | `ProfileData` | `ProfileResponse` 201 |
| `PATCH` | `/api/v1/users/profile` | Bearer | `ProfileData` (partial) | `ProfileResponse` |
| `GET` | `/api/v1/schedule` | Bearer | — | `{sessions:[ScheduleResponse]}` |
| `POST` | `/api/v1/schedule` | Bearer | `ScheduleCreate` | `ScheduleResponse` 201 |
| `DELETE` | `/api/v1/schedule/{id}` | Bearer | — | 204 No Content |
| `GET` | `/health` | None | — | `{status, version, checks:{postgres, redis, ai_service}, timestamp}` |
| `GET` | `/health/live` | None | — | `{status:"ok"}` |
| `GET` | `/health/ready` | None | — | `{status, latency_ms}` |
| `GET` | `/metrics` | `Bearer <METRICS_SECRET>` | — | Prometheus text format |

### WebSocket — `ws://<host>/ws/interview/{session_id}`

**Client → Server frames:**

| `type` | `data` | `metadata` | Server response |
|---|---|---|---|
| `audio_chunk` | base64 WAV | `{record_id?: string}` | `{type:"voice_analysis_result", ...}` + `{type:"transcript_result", transcript, session_id}` |
| `video_frame` | base64 JPEG | any | `{type:"analysis_result", dominant_emotion, emotion:{...}}` |
| `heartbeat` | — | — | `{type:"heartbeat_ack"}` |

**Server → Client async push (Celery → Redis Pub/Sub → WS):**

| `type` | Payload |
|---|---|
| `report_ready` | `{report_url, scores:{communication, engagement, substance, overall}}` |

---

## 10. Setup / Running Locally

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.11
- Docker + Docker Compose (for PostgreSQL and Redis)

### Environment variables

```bash
cp backend/.env.example backend/.env
# then fill in all required values
```

The **full** variable set required at runtime (derived from reading `main.py`, `dependencies.py`, `security.py`, `worker.py`, and `reporting.py`):

```env
# Required
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/pitchperfect
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=change-me-in-production
GEMINI_API_KEY=<Google AI Studio key>
OPENAI_API_KEY=<OpenAI key — Whisper STT>

# Optional (defaults shown)
LOG_LEVEL=INFO
ALLOWED_ORIGINS=http://localhost:3000
ACCESS_TOKEN_TTL_MIN=30
REFRESH_TOKEN_TTL_DAYS=7
METRICS_SECRET=                   # empty = no auth on /metrics (dev only)
FACIAL_API_URL=http://127.0.0.1:8002/analyze
VOICE_API_URL=http://127.0.0.1:8001/analyze-voice

# Required only for the Celery PDF-report worker
SYNC_DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/pitchperfect

# Optional — "s3" to upload reports to S3/MinIO
STORAGE_BACKEND=local
```

For production, create `.env.prod` (referenced by `docker-compose.prod.yml`):

```env
POSTGRES_DB=pitchperfect
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong>
REDIS_PASSWORD=<strong>
SECRET_KEY=<strong>
GEMINI_API_KEY=<key>
NEXT_PUBLIC_API_URL=https://api.pitchperfect.app
GITHUB_REPOSITORY=<owner/repo>
IMAGE_TAG=latest
```

### Development steps

```bash
# 1. Start PostgreSQL and Redis
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pitchperfect postgres:16-alpine
docker run -d -p 6379:6379 redis:7-alpine

# 2. Run Alembic migrations
cd backend
python -m alembic upgrade head
cd ..

# 3. Start FastAPI backend
cd backend
uvicorn app.main:app --reload --port 8000

# 4. Start voice-analysis microservice (port 8001)
cd python-voice-analysis-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001

# 5. Start facial-analysis microservice (port 8002)
cd python-analysis-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8002

# 6. Start Next.js frontend
npm install
npm run dev

# 7. (Optional) Start Celery worker for PDF report generation
cd backend
celery -A app.infrastructure.worker.celery_app worker -Q reporting,ai,default --loglevel=info
```

### Production

```bash
docker compose -f docker-compose.prod.yml up -d
```

The compose file expects Nginx config at `./nginx/nginx.conf` and TLS certificates at `./nginx/certs/` (neither is included in the repository). There is currently **no Celery worker service** in `docker-compose.prod.yml` — add one before deploying if PDF report generation is required.

---

## 11. Roadmap / Work in Progress

Based on TODO comments, partially-wired code paths, and implemented-but-unconnected modules found in the repository:

- **`AnalyticsRepository` endpoints missing** — `get_session_summary` and `get_user_trends` are fully implemented with JSONB aggregate SQL (`analytics_repo.py`) but no REST route calls them. Needs `GET /api/v1/analytics/sessions/{session_id}/summary` and `GET /api/v1/analytics/users/me/trends`.
- **`SYNC_DATABASE_URL` not in `.env.example`** — The Celery `generate_interview_report` task calls `_get_sync_session()` which requires a `psycopg2`-based sync URL. Missing at runtime silently breaks PDF generation. `psycopg2-binary` also needs to be added to `requirements.txt`.
- **`aioboto3` and `reportlab` not in `requirements.txt`** — Both are imported unconditionally in `core/tasks/reporting.py` but marked "optional" only in comments. The worker will raise `ImportError` on startup without them.
- **`MediaProcessor` (`core/media/processor.py`) is unused** — The live WebSocket path uses `StreamProcessor`; `MediaProcessor` (pydub/OpenCV normalisation) is never called. Should either be removed or wired as a pre-processing step before Whisper.
- **`RedisStateManager` (`infrastructure/redis_state.py`) is superseded** — Uses a different channel naming scheme from `RedisManager` and references `manager.broadcast_to_session` which does not exist on the current `ConnectionManager`. Should be removed or merged.
- **Voice microservice produces rough WPM approximations** — `python-voice-analysis-service/main.py` estimates WPM from raw audio energy, not real speech recognition. Accurate filler-word counting requires the commented-out Vosk integration or a cloud ASR replacement.
- **Badge / XP / streak system** — `useAuth.ts` defines `UserStats` and `UserBadge` types; `getDefaultStats()` always returns zeros. No backend write path exists to compute or persist these values.
- **`TrendData` / `TrendPoint` schemas** — Defined in `core/analytics/schemas.py`; not yet returned by any endpoint.
- **S3 report upload is untested** — The `STORAGE_BACKEND=s3` branch is implemented in `reporting.py` but `aioboto3` is absent from `requirements.txt` and no AWS credentials are documented.
- **No Celery worker in `docker-compose.prod.yml`** — Finishing an interview and triggering the `generate_interview_report` task will stall silently in production until a `worker` service is added.
- **`python-resume-service` directory** — Present at the repo root but entirely empty (no `main.py`, no `requirements.txt`). Intended purpose unclear.
