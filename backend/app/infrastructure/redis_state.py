import json
import logging
from typing import Dict, Optional
from redis import asyncio as aioredis

from ..api.v1.websocket import manager


logger = logging.getLogger(__name__)


class RedisStateManager:
    """
    Manages session state and Pub/Sub for PitchPerfect real-time components.
    Tracks active socket metadata and broadcasts AI evaluation results.
    """
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = aioredis.from_url(redis_url, decode_responses=True)
        self.pubsub = self.redis.pubsub()

    async def set_session_metadata(self, session_id: str, metadata: Dict):
        """
        Stores interview session metadata in Redis with expiration (e.g., 1 hour).
        """
        key = f"interview_session:{session_id}"
        await self.redis.set(key, json.dumps(metadata), ex=3600)

    async def get_session_metadata(self, session_id: str) -> Optional[Dict]:
        """
        Retrieves interview session metadata from Redis.
        """
        key = f"interview_session:{session_id}"
        data = await self.redis.get(key)
        return json.loads(data) if data else None

    async def update_session_status(self, session_id: str, status: str):
        """
        Updates session status (e.g., 'active', 'finished', 'failed').
        """
        metadata = await self.get_session_metadata(session_id) or {}
        metadata['status'] = status
        await self.set_session_metadata(session_id, metadata)

    async def publish_evaluation(self, session_id: str, result: Dict):
        """
        Publishes AI evaluation results to Redis Pub/Sub channel for the session.
        """
        channel = f"interview_updates:{session_id}"
        await self.redis.publish(channel, json.dumps(result))

    async def subscribe_to_evaluations(self, session_id: str):
        """
        Subscribes to AI results for a session and broadcasts via WebSocket.
        Usually called within an async task when a socket connects.
        """
        channel = f"interview_updates:{session_id}"
        await self.pubsub.subscribe(channel)

        async for message in self.pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                # Broadcast back to the connected WebSocket via the global manager
                await manager.broadcast_to_session(session_id, data)

    async def delete_session(self, session_id: str):
        """
        Cleans up session data from Redis.
        """
        key = f"interview_session:{session_id}"
        await self.redis.delete(key)
        await self.pubsub.unsubscribe(f"interview_updates:{session_id}")


# Global Redis State singleton (for dependency injection)
redis_state = RedisStateManager()
