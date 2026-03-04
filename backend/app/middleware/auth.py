"""
Backward-compatible re-exports.

The canonical auth dependency chain now lives in ``app.api.dependencies``.
This module re-exports the key symbols so existing imports like
``from app.middleware.auth import CurrentUser`` continue to work.
"""
from __future__ import annotations

from ..api.dependencies import (
    CurrentUser,
    CurrentUserPayload,
    get_current_user,
    get_current_user_payload,
)

__all__ = [
    "CurrentUser",
    "CurrentUserPayload",
    "get_current_user",
    "get_current_user_payload",
]
