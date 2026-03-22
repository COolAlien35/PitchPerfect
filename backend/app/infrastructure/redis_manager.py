import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator, Dict, Optional

from redis.asyncio import Redis, from_url

logger = logging.getLogger(__name__)

_CHANNEL_PREFIX = "pitchperfect:session"
_SESSION_KEY_PREFIX = "pitchperfect:meta"
_SESSION_TTL_SEC = 3600  # 1 hour


class RedisManager:
    """
    Central Redis adapter: session metadata store + Pub/Sub feedback broadcaster.
    A single instance should be shared across the application lifetime via
    FastAPI's dependency injection or lifespan context.
    """

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self._url = redis_url
        self._client: Optional[Redis] = None

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------
    async def connect(self) -> None:
        self._client = from_url(self._url, decode_responses=True)
        logger.info("RedisManager connected to %s", self._url)

    async def disconnect(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    @property
    def client(self) -> Redis:
        if not self._client:
            raise RuntimeError("RedisManager is not connected. Call connect() first.")
        return self._client

    # ------------------------------------------------------------------
    # Session Metadata
    # ------------------------------------------------------------------
    async def set_session_metadata(self, session_id: str, metadata: Dict[str, Any]) -> None:
        key = f"{_SESSION_KEY_PREFIX}:{session_id}"
        await self.client.set(key, json.dumps(metadata), ex=_SESSION_TTL_SEC)

    async def get_session_metadata(self, session_id: str) -> Optional[Dict[str, Any]]:
        key = f"{_SESSION_KEY_PREFIX}:{session_id}"
        raw = await self.client.get(key)
        return json.loads(raw) if raw else None

    async def patch_session_metadata(self, session_id: str, updates: Dict[str, Any]) -> None:
        existing = await self.get_session_metadata(session_id) or {}
        existing.update(updates)
        await self.set_session_metadata(session_id, existing)

    async def delete_session_metadata(self, session_id: str) -> None:
        key = f"{_SESSION_KEY_PREFIX}:{session_id}"
        await self.client.delete(key)

    # ------------------------------------------------------------------
    # Pub/Sub – Publishing
    # ------------------------------------------------------------------
    async def publish_feedback(self, session_id: str, feedback: Dict[str, Any]) -> int:
        """
        Broadcast a structured AI feedback event to a session channel.
        Returns the number of subscribers that received the message.
        """
        channel = f"{_CHANNEL_PREFIX}:{session_id}"
        payload = json.dumps(feedback)
        return await self.client.publish(channel, payload)

    # ------------------------------------------------------------------
    # Pub/Sub – Subscribing
    # ------------------------------------------------------------------
    @asynccontextmanager
    async def subscribe(self, session_id: str) -> AsyncIterator[asyncio.Queue]:
        """
        Async context manager that subscribes to a session channel and
        yields a Queue populated with incoming messages.

        Usage:
            async with redis_manager.subscribe(session_id) as queue:
                msg = await queue.get()
        """
        channel = f"{_CHANNEL_PREFIX}:{session_id}"
        pubsub = self.client.pubsub()
        queue: asyncio.Queue[Dict[str, Any]] = asyncio.Queue()

        async def _listener():
            async with pubsub as ps:
                await ps.subscribe(channel)
                async for raw_msg in ps.listen():
                    if raw_msg["type"] != "message":
                        continue
                    try:
                        data = json.loads(raw_msg["data"])
                        await queue.put(data)
                    except (json.JSONDecodeError, TypeError) as exc:
                        logger.warning("Channel %s – bad payload: %s", channel, exc)

        listener_task = asyncio.create_task(_listener())
        try:
            yield queue
        finally:
            listener_task.cancel()
            try:
                await listener_task
            except asyncio.CancelledError:
                pass

    async def broadcast_to_socket(self, session_id: str, event_type: str, payload: Dict[str, Any]) -> None:
        """
        Convenience method: publish a typed feedback event that the WebSocket
        gateway will forward to the client.

        event_type examples: "pacing_alert", "emotion_detected", "transcript_ready"
        """
        await self.publish_feedback(
            session_id,
            {"event": event_type, "session_id": session_id, "data": payload}
        )


# ------------------------------------------------------------------
# Application-scoped singleton
# ------------------------------------------------------------------
def _make_redis_manager() -> "RedisManager":
    # Lazy import to avoid circular dependency:
    # redis_manager ← security ← config ← redis_manager
    from ..config import settings  # noqa: PLC0415
    return RedisManager(redis_url=settings.REDIS_URL)


redis_manager: RedisManager = _make_redis_manager()
