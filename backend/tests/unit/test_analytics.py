"""Tests for GET/POST /api/v1/analytics/sessions."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


async def test_list_sessions_unauthenticated(client: AsyncClient):
    res = await client.get("/api/v1/analytics/sessions")
    assert res.status_code == 401


async def test_list_sessions_empty(client: AsyncClient, auth_headers: dict):
    """Fresh user has no sessions."""
    res = await client.get("/api/v1/analytics/sessions", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert "sessions" in body
    assert isinstance(body["sessions"], list)


async def test_save_session_success(client: AsyncClient, auth_headers: dict):
    payload = {
        "type": "Behavioral Interview",
        "score": 7.5,
        "date": "2026-03-21T10:00:00Z",
        "duration": "30 min",
        "category": "behavioral",
    }
    res = await client.post("/api/v1/analytics/sessions", json=payload, headers=auth_headers)
    assert res.status_code == 201
    body = res.json()
    assert body["type"] == "Behavioral Interview"
    assert body["score"] == 7.5
    assert body["category"] == "behavioral"
    assert "id" in body


async def test_save_session_technical_category(client: AsyncClient, auth_headers: dict):
    payload = {
        "type": "Technical Interview",
        "score": 8.0,
        "date": "2026-03-21T11:00:00Z",
        "duration": "45 min",
        "category": "technical",
    }
    res = await client.post("/api/v1/analytics/sessions", json=payload, headers=auth_headers)
    assert res.status_code == 201
    assert res.json()["category"] == "technical"


async def test_save_then_list_sessions(client: AsyncClient, auth_headers: dict):
    """Saved session should appear in the list."""
    payload = {
        "type": "Pressure Mode",
        "score": 6.0,
        "date": "2026-03-21T12:00:00Z",
        "duration": "20 min",
        "category": "pressure",
    }
    await client.post("/api/v1/analytics/sessions", json=payload, headers=auth_headers)

    list_res = await client.get("/api/v1/analytics/sessions", headers=auth_headers)
    assert list_res.status_code == 200
    sessions = list_res.json()["sessions"]
    assert any(s["category"] == "pressure" for s in sessions)


async def test_save_session_score_out_of_range(client: AsyncClient, auth_headers: dict):
    """Score must be between 0 and 10."""
    payload = {
        "type": "Invalid",
        "score": 15.0,  # > 10
        "date": "2026-03-21T00:00:00Z",
        "duration": "10 min",
        "category": "behavioral",
    }
    res = await client.post("/api/v1/analytics/sessions", json=payload, headers=auth_headers)
    assert res.status_code == 422


async def test_sessions_isolated_between_users(client: AsyncClient, app):
    """Sessions from user A should not appear in user B's list."""
    from tests.conftest import _register_and_login

    headers_a = await _register_and_login(client)
    headers_b = await _register_and_login(client)

    # User A saves a session
    await client.post("/api/v1/analytics/sessions", json={
        "type": "User A Session", "score": 5.0,
        "date": "2026-03-21T00:00:00Z", "duration": "10 min", "category": "behavioral",
    }, headers=headers_a)

    # User B should see empty list
    res_b = await client.get("/api/v1/analytics/sessions", headers=headers_b)
    sessions_b = res_b.json()["sessions"]
    assert not any(s["type"] == "User A Session" for s in sessions_b)
