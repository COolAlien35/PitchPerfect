# ============================================================
# Stage 1: dependency resolver
# ============================================================
FROM python:3.12-slim AS deps

WORKDIR /build

# System deps for psycopg2 / pydub / opencv compile
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        libffi-dev \
        libssl-dev \
        ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip wheel --no-cache-dir --wheel-dir /build/wheels -r requirements.txt

# ============================================================
# Stage 2: production runner
# ============================================================
FROM python:3.12-slim AS runner

LABEL org.opencontainers.image.source="https://github.com/your-org/pitchperfect"
LABEL org.opencontainers.image.description="PitchPerfect FastAPI Backend"

# Minimal runtime system libs
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
        ffmpeg \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN groupadd --system appgroup && \
    useradd  --system --no-create-home --gid appgroup appuser

WORKDIR /app

# Copy pre-built wheels and install without build tools
COPY --from=deps /build/wheels /tmp/wheels
RUN pip install --no-cache-dir --no-index --find-links /tmp/wheels /tmp/wheels/*.whl && \
    rm -rf /tmp/wheels

# Copy application source
COPY --chown=appuser:appgroup . .

# Drop privileges
USER appuser

EXPOSE 8000

# Healthcheck – calls the /health liveness endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fs http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "4", \
     "--loop", "uvloop", \
     "--http", "httptools", \
     "--no-access-log"]
