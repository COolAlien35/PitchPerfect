"""Tests for GET/POST/DELETE /api/v1/schedule."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


SAMPLE_SESSION = {
    "title": "Google SWE Prep",
    "type": "technical",
    "date": "2026-04-01",
    "time": "10:00",
    "duration": 60,
    "description": "Prepare for coding round",
    "location": "online",
    "participants": 1,
    "reminder": True,
}


async def test_list_schedule_unauthenticated(client: AsyncClient):
    res = await client.get("/api/v1/schedule")
    assert res.status_code == 401


async def test_list_schedule_empty(client: AsyncClient, auth_headers: dict):
    res = await client.get("/api/v1/schedule", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["sessions"] == []


async def test_create_schedule(client: AsyncClient, auth_headers: dict):
    res = await client.post("/api/v1/schedule", json=SAMPLE_SESSION, headers=auth_headers)
    assert res.status_code == 201
    body = res.json()
    assert body["title"] == "Google SWE Prep"
    assert body["type"] == "technical"
    assert body["date"] == "2026-04-01"
    assert body["time"] == "10:00"
    assert body["status"] == "scheduled"
    assert "id" in body
    assert "createdAt" in body


async def test_create_then_list_schedule(client: AsyncClient, auth_headers: dict):
    await client.post("/api/v1/schedule", json=SAMPLE_SESSION, headers=auth_headers)
    res = await client.get("/api/v1/schedule", headers=auth_headers)
    sessions = res.json()["sessions"]
    assert len(sessions) >= 1
    assert any(s["title"] == "Google SWE Prep" for s in sessions)


async def test_delete_schedule_success(client: AsyncClient, auth_headers: dict):
    created = await client.post("/api/v1/schedule", json=SAMPLE_SESSION, headers=auth_headers)
    session_id = created.json()["id"]

    res = await client.delete(f"/api/v1/schedule/{session_id}", headers=auth_headers)
    assert res.status_code == 204

    # Confirm deletion
    list_res = await client.get("/api/v1/schedule", headers=auth_headers)
    sessions = list_res.json()["sessions"]
    assert not any(s["id"] == session_id for s in sessions)


async def test_delete_nonexistent_schedule(client: AsyncClient, auth_headers: dict):
    fake_id = "00000000-0000-0000-0000-000000000000"
    res = await client.delete(f"/api/v1/schedule/{fake_id}", headers=auth_headers)
    assert res.status_code == 404


async def test_delete_schedule_wrong_owner(client: AsyncClient, app):
    """User B cannot delete User A's session — must get 403."""
    from tests.conftest import _register_and_login

    headers_a = await _register_and_login(client)
    headers_b = await _register_and_login(client)

    # User A creates a session
    created = await client.post("/api/v1/schedule", json=SAMPLE_SESSION, headers=headers_a)
    session_id = created.json()["id"]

    # User B tries to delete it
    res = await client.delete(f"/api/v1/schedule/{session_id}", headers=headers_b)
    assert res.status_code == 403


async def test_schedule_isolated_between_users(client: AsyncClient, app):
    """User B should not see User A's schedule."""
    from tests.conftest import _register_and_login

    headers_a = await _register_and_login(client)
    headers_b = await _register_and_login(client)

    await client.post("/api/v1/schedule", json=SAMPLE_SESSION, headers=headers_a)

    res_b = await client.get("/api/v1/schedule", headers=headers_b)
    assert res_b.json()["sessions"] == []


async def test_create_schedule_missing_required_field(client: AsyncClient, auth_headers: dict):
    """title is required — omit it."""
    payload = {k: v for k, v in SAMPLE_SESSION.items() if k != "title"}
    res = await client.post("/api/v1/schedule", json=payload, headers=auth_headers)
    assert res.status_code == 422
