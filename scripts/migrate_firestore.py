#!/usr/bin/env python3
"""
migrate_firestore.py – One-shot Firestore → PostgreSQL migration.

Usage:
    python scripts/migrate_firestore.py \
        --firebase-cred /path/to/serviceAccountKey.json \
        --database-url "postgresql+asyncpg://user:pass@host:5432/pitchperfect"

Re-running is safe:  UUID v5 determinism + ON CONFLICT DO NOTHING ensures
idempotency without duplicate rows.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import UUID

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import AsyncClient as AsyncFirestoreClient
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

# Local imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.models.base import Base
from app.models.user import User
from app.models.interview import Interview, InterviewSession
from app.models.qa_record import QARecord

from data_mapper import (
    MigratedInterview,
    MigratedQARecord,
    MigratedSession,
    MigratedUser,
    firestore_uid_to_uuid,
    map_interview_doc,
    map_qa_record,
    map_user_doc,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOG_DIR    = Path(__file__).resolve().parent / "migration_logs"
LOG_DIR.mkdir(exist_ok=True)

_ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
_log_file = LOG_DIR / f"migration_{_ts}.log"
_audit_file = LOG_DIR / f"migration_audit_{_ts}.jsonl"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(_log_file, encoding="utf-8"),
    ],
)
logger = logging.getLogger("migration")


def _audit(record_type: str, doc_id: str, status: str, detail: str = "") -> None:
    """Append one JSONL line to the audit log."""
    entry = {
        "timestamp":   datetime.now(timezone.utc).isoformat(),
        "record_type": record_type,
        "doc_id":      doc_id,
        "status":      status,
        "detail":      detail,
    }
    with open(_audit_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, default=str) + "\n")


# ---------------------------------------------------------------------------
# Counters
# ---------------------------------------------------------------------------
class _Stats:
    users_ok = 0;       users_fail = 0
    interviews_ok = 0;  interviews_fail = 0
    sessions_ok = 0;    sessions_fail = 0
    qa_ok = 0;          qa_fail = 0

stats = _Stats()

BATCH_SIZE = 100

# ---------------------------------------------------------------------------
# Firebase initialisation
# ---------------------------------------------------------------------------
def init_firebase(cred_path: str) -> AsyncFirestoreClient:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    return firestore.async_client()


# ---------------------------------------------------------------------------
# PostgreSQL engine
# ---------------------------------------------------------------------------
async def init_postgres(db_url: str) -> async_sessionmaker[AsyncSession]:
    engine = create_async_engine(db_url, echo=False, pool_pre_ping=True)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("PostgreSQL schema ensured.")

    return async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


# ---------------------------------------------------------------------------
# migrate_users
# ---------------------------------------------------------------------------
async def migrate_users(
    fs_client: AsyncFirestoreClient,
    session_factory: async_sessionmaker[AsyncSession],
) -> dict[str, UUID]:
    """
    Returns a mapping of Firestore UID → PostgreSQL UUID for FK resolution.
    """
    logger.info("═══ Migrating users ═══")
    uid_map: dict[str, UUID] = {}

    docs = fs_client.collection("users").stream()
    batch: list[MigratedUser] = []

    async for doc in docs:
        doc_id = doc.id
        data   = doc.to_dict() or {}

        try:
            user = map_user_doc(doc_id, data)
            batch.append(user)
            uid_map[doc_id] = user.id
        except Exception as exc:
            stats.users_fail += 1
            _audit("user", doc_id, "FAILED", str(exc))
            logger.warning("User mapping failed: %s – %s", doc_id, exc)
            continue

        if len(batch) >= BATCH_SIZE:
            await _flush_users(batch, session_factory)
            batch.clear()

    if batch:
        await _flush_users(batch, session_factory)

    logger.info("Users migrated: %d OK, %d FAILED", stats.users_ok, stats.users_fail)
    return uid_map


async def _flush_users(
    batch: list[MigratedUser],
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with session_factory() as session:
        async with session.begin():
            for user in batch:
                stmt = (
                    pg_insert(User)
                    .values(
                        id=user.id,
                        email=user.email,
                        hashed_password=user.hashed_password,
                        full_name=user.full_name,
                    )
                    .on_conflict_do_nothing(index_elements=["id"])
                )
                await session.execute(stmt)
                stats.users_ok += 1
                _audit("user", user.firestore_uid, "OK")


# ---------------------------------------------------------------------------
# migrate_sessions (interviews + sessions + qa_records)
# ---------------------------------------------------------------------------
async def migrate_sessions(
    fs_client: AsyncFirestoreClient,
    session_factory: async_sessionmaker[AsyncSession],
    uid_map: dict[str, UUID],
) -> None:
    """
    Reads Firestore `interviews` collection (top-level), with nested
    `sessions` sub-collections.

    Insertion order enforces referential integrity:
        interviews → interview_sessions → qa_records
    """
    logger.info("═══ Migrating interviews & sessions ═══")

    docs = fs_client.collection("interviews").stream()
    batch: list[MigratedInterview] = []

    async for doc in docs:
        doc_id = doc.id
        data   = doc.to_dict() or {}
        owner_uid = data.get("userId") or data.get("user_id", "")

        if owner_uid not in uid_map:
            stats.interviews_fail += 1
            _audit("interview", doc_id, "FAILED", f"Owner UID '{owner_uid}' not in uid_map")
            logger.warning("Interview %s skipped – owner UID %s not migrated", doc_id, owner_uid)
            continue

        try:
            interview = map_interview_doc(doc_id, data, uid_map[owner_uid])

            # If sessions live in a sub-collection, fetch them now
            if not interview.sessions:
                interview.sessions = await _fetch_subcollection_sessions(
                    fs_client, doc_id, interview.id
                )

            batch.append(interview)
        except Exception as exc:
            stats.interviews_fail += 1
            _audit("interview", doc_id, "FAILED", str(exc))
            logger.warning("Interview mapping failed: %s – %s", doc_id, exc)
            continue

        if len(batch) >= BATCH_SIZE:
            await _flush_interviews(batch, session_factory)
            batch.clear()

    if batch:
        await _flush_interviews(batch, session_factory)

    logger.info(
        "Interviews: %d OK, %d FAILED | Sessions: %d OK, %d FAILED | QA: %d OK, %d FAILED",
        stats.interviews_ok, stats.interviews_fail,
        stats.sessions_ok,   stats.sessions_fail,
        stats.qa_ok,          stats.qa_fail,
    )


async def _fetch_subcollection_sessions(
    fs_client: AsyncFirestoreClient,
    interview_doc_id: str,
    interview_uuid: UUID,
) -> list[MigratedSession]:
    """Read the 'sessions' sub-collection if sessions are stored there."""
    import uuid as _uuid
    from data_mapper import map_qa_record, MigratedSession, safe_float, firestore_ts_to_utc

    sessions: list[MigratedSession] = []
    sub_docs = fs_client.collection("interviews").document(interview_doc_id).collection("sessions").stream()

    async for sdoc in sub_docs:
        sdata = sdoc.to_dict() or {}
        session_id = _uuid.uuid4()

        raw_qa = sdata.get("qaRecords") or sdata.get("qa_records") or []
        qa_records = [map_qa_record(r, session_id) for r in raw_qa]

        # QA records in a further sub-collection
        if not qa_records:
            qa_sub = fs_client.collection("interviews").document(interview_doc_id) \
                        .collection("sessions").document(sdoc.id) \
                        .collection("qaRecords").stream()
            async for qdoc in qa_sub:
                qdata = qdoc.to_dict() or {}
                qa_records.append(map_qa_record(qdata, session_id))

        sessions.append(MigratedSession(
            id=session_id,
            interview_id=interview_uuid,
            overall_score=safe_float(sdata.get("overallScore") or sdata.get("overall_score"), default=None),
            detailed_metrics=sdata.get("detailedMetrics") or sdata.get("detailed_metrics") or {},
            qa_records=qa_records,
            created_at=firestore_ts_to_utc(sdata.get("createdAt") or sdata.get("created_at")),
            updated_at=firestore_ts_to_utc(sdata.get("updatedAt") or sdata.get("updated_at")),
        ))

    return sessions


async def _flush_interviews(
    batch: list[MigratedInterview],
    session_factory: async_sessionmaker[AsyncSession],
) -> None:
    """
    Inserts interviews → sessions → qa_records in FK order within a
    single transaction.  ON CONFLICT DO NOTHING guarantees idempotency.
    """
    async with session_factory() as session:
        async with session.begin():
            for iv in batch:
                try:
                    # 1. Insert interview
                    await session.execute(
                        pg_insert(Interview)
                        .values(
                            id=iv.id,
                            user_id=iv.user_id,
                            title=iv.title,
                            job_role=iv.job_role,
                            resume_data=iv.resume_data,
                            status=iv.status,
                        )
                        .on_conflict_do_nothing(index_elements=["id"])
                    )
                    stats.interviews_ok += 1
                    _audit("interview", iv.firestore_id, "OK")

                    # 2. Insert sessions
                    for s in iv.sessions:
                        try:
                            await session.execute(
                                pg_insert(InterviewSession)
                                .values(
                                    id=s.id,
                                    interview_id=s.interview_id,
                                    overall_score=s.overall_score,
                                    detailed_metrics=s.detailed_metrics,
                                )
                                .on_conflict_do_nothing(index_elements=["id"])
                            )
                            stats.sessions_ok += 1
                            _audit("session", str(s.id), "OK")

                            # 3. Insert QA records
                            for qa in s.qa_records:
                                try:
                                    await session.execute(
                                        pg_insert(QARecord)
                                        .values(
                                            id=qa.id,
                                            session_id=qa.session_id,
                                            question=qa.question,
                                            transcript=qa.transcript,
                                            ai_feedback=qa.ai_feedback.model_dump(),
                                            audio_metrics=qa.audio_metrics.model_dump(),
                                            video_metrics=qa.video_metrics.model_dump(),
                                        )
                                        .on_conflict_do_nothing(index_elements=["id"])
                                    )
                                    stats.qa_ok += 1
                                except Exception as exc:
                                    stats.qa_fail += 1
                                    _audit("qa_record", str(qa.id), "FAILED", str(exc))
                                    logger.warning("QA insert failed: %s – %s", qa.id, exc)

                        except Exception as exc:
                            stats.sessions_fail += 1
                            _audit("session", str(s.id), "FAILED", str(exc))
                            logger.warning("Session insert failed: %s – %s", s.id, exc)

                except Exception as exc:
                    stats.interviews_fail += 1
                    _audit("interview", iv.firestore_id, "FAILED", str(exc))
                    logger.warning("Interview insert failed: %s – %s", iv.firestore_id, exc)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
async def main(firebase_cred: str, database_url: str) -> None:
    logger.info("╔══════════════════════════════════════════════════════════╗")
    logger.info("║  PitchPerfect – Firestore → PostgreSQL Migration       ║")
    logger.info("╚══════════════════════════════════════════════════════════╝")
    logger.info("Audit log: %s", _audit_file)

    t0 = time.perf_counter()

    # Initialise
    fs_client = init_firebase(firebase_cred)
    session_factory = await init_postgres(database_url)

    # Phase 1 – Users (must complete before interviews for FK resolution)
    uid_map = await migrate_users(fs_client, session_factory)
    logger.info("UID map built: %d entries", len(uid_map))

    # Phase 2 – Interviews → Sessions → QA Records
    await migrate_sessions(fs_client, session_factory, uid_map)

    elapsed = time.perf_counter() - t0

    logger.info("╔══════════════════════════════════════════════════════════╗")
    logger.info("║  Migration complete in %.2fs                           ║", elapsed)
    logger.info("║  Users:      %5d OK  %5d FAIL                     ║", stats.users_ok, stats.users_fail)
    logger.info("║  Interviews: %5d OK  %5d FAIL                     ║", stats.interviews_ok, stats.interviews_fail)
    logger.info("║  Sessions:   %5d OK  %5d FAIL                     ║", stats.sessions_ok, stats.sessions_fail)
    logger.info("║  QA Records: %5d OK  %5d FAIL                     ║", stats.qa_ok, stats.qa_fail)
    logger.info("╚══════════════════════════════════════════════════════════╝")

    total_fail = stats.users_fail + stats.interviews_fail + stats.sessions_fail + stats.qa_fail
    if total_fail:
        logger.warning("Review audit log for %d failed records: %s", total_fail, _audit_file)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def cli() -> None:
    parser = argparse.ArgumentParser(
        description="Migrate PitchPerfect data from Firestore to PostgreSQL."
    )
    parser.add_argument(
        "--firebase-cred",
        required=True,
        help="Path to Firebase service account JSON key.",
    )
    parser.add_argument(
        "--database-url",
        default=os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://postgres:postgres@localhost:5432/pitchperfect",
        ),
        help="PostgreSQL async connection string.",
    )
    args = parser.parse_args()
    asyncio.run(main(args.firebase_cred, args.database_url))


if __name__ == "__main__":
    cli()
