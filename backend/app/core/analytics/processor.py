from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Annotated, Any

# ---------------------------------------------------------------------------
# Rubric configuration
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class CommunicationRubric:
    """Thresholds for voice-based communication scoring."""
    ideal_wpm_low: float  = 120.0   # words/min floor for ideal cadence
    ideal_wpm_high: float = 160.0   # words/min ceiling for ideal cadence
    max_filler_penalty: float = 20.0  # max points deducted for filler overuse
    filler_penalty_per_word: float = 1.5


@dataclass(frozen=True)
class EngagementRubric:
    """Thresholds for facial engagement scoring."""
    positive_emotions: frozenset[str] = field(
        default_factory=lambda: frozenset({"happy", "surprise", "neutral"})
    )
    negative_emotions: frozenset[str] = field(
        default_factory=lambda: frozenset({"angry", "disgust", "fear", "sad"})
    )
    intensity_weight: float = 0.8    # high intensity positive ≈ high engagement


@dataclass(frozen=True)
class ScoringWeights:
    """Configurable weights that must sum to 1.0."""
    communication: float = 0.30
    engagement: float    = 0.20
    substance: float     = 0.50

    def __post_init__(self) -> None:
        total = self.communication + self.engagement + self.substance
        if not math.isclose(total, 1.0, abs_tol=1e-9):
            raise ValueError(f"ScoringWeights must sum to 1.0, got {total:.4f}")


# ---------------------------------------------------------------------------
# Default rubric singletons
# ---------------------------------------------------------------------------
DEFAULT_COMMUNICATION_RUBRIC = CommunicationRubric()
DEFAULT_ENGAGEMENT_RUBRIC     = EngagementRubric()
DEFAULT_WEIGHTS               = ScoringWeights()


# ---------------------------------------------------------------------------
# AnalyticsProcessor
# ---------------------------------------------------------------------------
class AnalyticsProcessor:
    """
    Stateless scoring engine.  All `score_*` methods return a value in [0, 100].
    """

    def __init__(
        self,
        weights: ScoringWeights            = DEFAULT_WEIGHTS,
        comm_rubric: CommunicationRubric   = DEFAULT_COMMUNICATION_RUBRIC,
        eng_rubric: EngagementRubric       = DEFAULT_ENGAGEMENT_RUBRIC,
    ) -> None:
        self.weights    = weights
        self.comm_rubric = comm_rubric
        self.eng_rubric  = eng_rubric

    # ------------------------------------------------------------------
    # Communication sub-score
    # ------------------------------------------------------------------
    def score_communication(
        self,
        wpm: float | None,
        filler_word_count: int | None,
    ) -> float:
        """
        Combines WPM cadence and filler word penalty.
        Returns a normalised [0, 100] value.
        """
        base = 100.0

        # WPM penalty: deviation from ideal band loses points proportionally
        if wpm is not None:
            low, high = self.comm_rubric.ideal_wpm_low, self.comm_rubric.ideal_wpm_high
            if wpm < low:
                base -= (low - wpm) / low * 40          # up to -40 for very slow
            elif wpm > high:
                base -= (wpm - high) / high * 30        # up to -30 for very fast

        # Filler word penalty
        if filler_word_count is not None and filler_word_count > 0:
            penalty = min(
                filler_word_count * self.comm_rubric.filler_penalty_per_word,
                self.comm_rubric.max_filler_penalty,
            )
            base -= penalty

        return self._clamp(base)

    # ------------------------------------------------------------------
    # Engagement sub-score
    # ------------------------------------------------------------------
    def score_engagement(
        self,
        dominant_emotion: str | None,
        emotion_intensity: float | None,
    ) -> float:
        """
        Maps facial emotion label + intensity to a [0, 100] engagement score.
        Positive emotions with high intensity yield high scores; negative emotions penalise.
        """
        if dominant_emotion is None or emotion_intensity is None:
            return 50.0   # Neutral fallback when no video data present

        intensity = max(0.0, min(1.0, emotion_intensity))

        if dominant_emotion in self.eng_rubric.positive_emotions:
            return self._clamp(
                50.0 + intensity * 50.0 * self.eng_rubric.intensity_weight
            )
        if dominant_emotion in self.eng_rubric.negative_emotions:
            return self._clamp(50.0 - intensity * 40.0)

        return 50.0   # Unknown emotion → neutral

    # ------------------------------------------------------------------
    # Substance sub-score
    # ------------------------------------------------------------------
    def score_substance(
        self,
        clarity_score: float | None,
        tech_depth_score: float | None,
        communication_score: float | None,
    ) -> float:
        """
        Average of the three AI rubric scores (originally on 1–10 scale),
        normalised to [0, 100].
        """
        raw_scores = [
            s for s in (clarity_score, tech_depth_score, communication_score)
            if s is not None
        ]
        if not raw_scores:
            return 0.0
        avg_10 = sum(raw_scores) / len(raw_scores)   # 1–10
        return self._clamp((avg_10 / 10.0) * 100.0)

    # ------------------------------------------------------------------
    # Composite weighted score
    # ------------------------------------------------------------------
    def compute_composite(
        self,
        communication_score: float,
        engagement_score: float,
        substance_score: float,
    ) -> float:
        return self._clamp(
            communication_score * self.weights.communication
            + engagement_score  * self.weights.engagement
            + substance_score   * self.weights.substance
        )

    # ------------------------------------------------------------------
    # Full session scorer (accepts a list of raw QA record dicts from DB)
    # ------------------------------------------------------------------
    def score_session(self, qa_records: list[dict[str, Any]]) -> dict[str, float]:
        """
        Accepts raw QA record dicts (as returned by the analytics repo).
        Returns a dict with per-dimension and composite scores.
        """
        comm_scores: list[float] = []
        eng_scores:  list[float] = []
        sub_scores:  list[float] = []

        for rec in qa_records:
            audio   = rec.get("audio_metrics") or {}
            video   = rec.get("video_metrics") or {}
            ai_fb   = rec.get("ai_feedback")   or {}

            comm_scores.append(
                self.score_communication(
                    wpm=audio.get("wpm"),
                    filler_word_count=audio.get("filler_word_count"),
                )
            )
            eng_scores.append(
                self.score_engagement(
                    dominant_emotion=video.get("dominant_emotion"),
                    emotion_intensity=video.get("emotion_intensity"),
                )
            )
            sub_scores.append(
                self.score_substance(
                    clarity_score=ai_fb.get("clarity_score"),
                    tech_depth_score=ai_fb.get("tech_depth_score"),
                    communication_score=ai_fb.get("communication_score"),
                )
            )

        def _avg(lst: list[float]) -> float:
            return round(sum(lst) / len(lst), 2) if lst else 0.0

        comm  = _avg(comm_scores)
        eng   = _avg(eng_scores)
        sub   = _avg(sub_scores)
        comp  = round(self.compute_composite(comm, eng, sub), 2)

        return {
            "communication": comm,
            "engagement":    eng,
            "substance":     sub,
            "overall":       comp,
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _clamp(value: float) -> float:
        return round(max(0.0, min(100.0, value)), 2)
