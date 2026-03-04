from __future__ import annotations

from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class AnalyticsRepository:
    """
    High-performance async analytics queries.
    Delegates heavy aggregation to PostgreSQL JSONB functions to minimise
    Python-side data movement.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ------------------------------------------------------------------
    # Session summary
    # ------------------------------------------------------------------
    async def get_session_summary(self, session_id: UUID) -> dict:
        """
        Flattens all QA records for a session into a single summary row using
        PostgreSQL-native JSONB operators.  Returns raw dict for the service
        layer to convert into a `SessionReport`.
        """
        sql = text("""
            SELECT
                s.id                                            AS session_id,
                s.interview_id,
                s.overall_score,
                s.detailed_metrics,
                COUNT(q.id)                                     AS total_questions,
                COUNT(q.id) FILTER (WHERE q.transcript <> '')   AS answered_questions,

                -- Communication: avg WPM and total filler word count
                ROUND(AVG(
                    (q.audio_metrics->>'wpm')::NUMERIC
                ) FILTER (WHERE q.audio_metrics ? 'wpm'), 2)    AS avg_wpm,

                SUM(
                    (q.audio_metrics->>'filler_word_count')::INT
                ) FILTER (WHERE q.audio_metrics ? 'filler_word_count')
                                                                AS total_filler_words,

                -- Substance: avg AI rubric scores across all records
                ROUND(AVG(
                    (q.ai_feedback->>'clarity_score')::NUMERIC
                ) FILTER (WHERE q.ai_feedback ? 'clarity_score'), 2)  AS avg_clarity,

                ROUND(AVG(
                    (q.ai_feedback->>'tech_depth_score')::NUMERIC
                ) FILTER (WHERE q.ai_feedback ? 'tech_depth_score'), 2) AS avg_tech_depth,

                ROUND(AVG(
                    (q.ai_feedback->>'communication_score')::NUMERIC
                ) FILTER (WHERE q.ai_feedback ? 'communication_score'), 2) AS avg_ai_comm,

                -- Per-record detail array for QAMetricSummary hydration
                JSONB_AGG(
                    JSONB_BUILD_OBJECT(
                        'record_id',          q.id,
                        'question',           q.question,
                        'clarity_score',      (q.ai_feedback->>'clarity_score')::NUMERIC,
                        'tech_depth_score',   (q.ai_feedback->>'tech_depth_score')::NUMERIC,
                        'communication_score',(q.ai_feedback->>'communication_score')::NUMERIC,
                        'wpm',                (q.audio_metrics->>'wpm')::NUMERIC,
                        'filler_word_count',  (q.audio_metrics->>'filler_word_count')::INT,
                        'dominant_emotion',   q.video_metrics->>'dominant_emotion',
                        'emotion_intensity',  (q.video_metrics->>'emotion_intensity')::NUMERIC
                    )
                    ORDER BY q.id
                )                                               AS qa_summaries

            FROM interview_sessions s
            LEFT JOIN qa_records q ON q.session_id = s.id
            WHERE s.id = :session_id
            GROUP BY s.id, s.interview_id, s.overall_score, s.detailed_metrics
        """)

        result = await self._session.execute(sql, {"session_id": str(session_id)})
        row = result.mappings().first()
        return dict(row) if row else {}

    # ------------------------------------------------------------------
    # User trend (last 10 sessions)
    # ------------------------------------------------------------------
    async def get_user_trends(self, user_id: UUID) -> list[dict]:
        """
        Time-series aggregation of communication, substance, and overall scores
        across the last 10 completed sessions for the given user.
        Results are ordered chronologically; each row maps to a `TrendPoint`.
        """
        sql = text("""
            WITH ranked_sessions AS (
                SELECT
                    s.id                AS session_id,
                    s.overall_score,
                    s.created_at,

                    -- Communication: avg WPM normalised to 0-100
                    ROUND(
                        LEAST(
                            GREATEST(
                                AVG((q.audio_metrics->>'wpm')::NUMERIC)
                                    FILTER (WHERE q.audio_metrics ? 'wpm')
                                / 160.0 * 100.0,
                                0
                            ),
                            100
                        ), 2
                    ) AS communication_score,

                    -- Substance: avg AI rubric across all qa_records re-normalised
                    ROUND(
                        AVG(
                            (
                                COALESCE((q.ai_feedback->>'clarity_score')::NUMERIC, 0)
                                + COALESCE((q.ai_feedback->>'tech_depth_score')::NUMERIC, 0)
                                + COALESCE((q.ai_feedback->>'communication_score')::NUMERIC, 0)
                            ) / 3.0
                        ) / 10.0 * 100.0, 2
                    )                   AS substance_score,

                    ROW_NUMBER() OVER (ORDER BY s.created_at DESC) AS rn

                FROM interviews i
                JOIN interview_sessions s    ON s.interview_id = i.id
                LEFT JOIN qa_records q       ON q.session_id   = s.id
                WHERE i.user_id   = :user_id
                  AND i.status    = 'completed'
                GROUP BY s.id, s.overall_score, s.created_at
            )
            SELECT
                session_id,
                overall_score,
                communication_score,
                substance_score,
                TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
                -- Chronological index (1 = oldest of the 10)
                (10 - rn + 1) AS session_index
            FROM ranked_sessions
            WHERE rn <= 10
            ORDER BY session_index ASC
        """)

        result = await self._session.execute(sql, {"user_id": str(user_id)})
        return [dict(row) for row in result.mappings().all()]
