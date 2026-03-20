"""Tests for GET/POST/PATCH /api/v1/users/profile."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


async def test_get_profile_unauthenticated(client: AsyncClient):
    res = await client.get("/api/v1/users/profile")
    assert res.status_code == 401


async def test_get_profile_authenticated(client: AsyncClient, auth_headers: dict):
    res = await client.get("/api/v1/users/profile", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert "email" in body
    assert "name" in body
    # Skills and goals default to empty lists
    assert body["skills"] == []
    assert body["goals"] == []


async def test_post_profile_saves_data(client: AsyncClient, auth_headers: dict):
    payload = {
        "name": "Jane Doe",
        "phone": "+1-555-1234",
        "bio": "Senior engineer",
        "experience": "5+ years",
        "targetRole": "Engineering Manager",
        "industry": "Technology",
        "company": "Acme Corp",
        "education": "BS Computer Science",
        "skills": ["Python", "FastAPI", "PostgreSQL"],
        "goals": ["Get promoted", "Lead a team"],
        "linkedinUrl": "https://linkedin.com/in/jane",
        "githubUrl": "https://github.com/jane",
    }
    res = await client.post("/api/v1/users/profile", json=payload, headers=auth_headers)
    assert res.status_code == 201
    body = res.json()
    assert body["name"] == "Jane Doe"
    assert body["phone"] == "+1-555-1234"
    assert body["skills"] == ["Python", "FastAPI", "PostgreSQL"]
    assert body["goals"] == ["Get promoted", "Lead a team"]
    assert body["targetRole"] == "Engineering Manager"


async def test_post_profile_partial_fields(client: AsyncClient, auth_headers: dict):
    """POST profile with only some fields — should succeed."""
    res = await client.post(
        "/api/v1/users/profile",
        json={"name": "Partial User", "bio": "Just bio"},
        headers=auth_headers,
    )
    assert res.status_code == 201
    body = res.json()
    assert body["name"] == "Partial User"
    assert body["bio"] == "Just bio"


async def test_patch_profile_merges_correctly(client: AsyncClient, auth_headers: dict):
    """PATCH should merge new fields without erasing existing ones."""
    # Create initial profile
    await client.post(
        "/api/v1/users/profile",
        json={"name": "Merge Test", "skills": ["Python"], "bio": "Initial bio"},
        headers=auth_headers,
    )

    # Patch only the bio
    patch_res = await client.patch(
        "/api/v1/users/profile",
        json={"bio": "Updated bio"},
        headers=auth_headers,
    )
    assert patch_res.status_code == 200
    body = patch_res.json()
    # name and skills should be untouched
    assert body["name"] == "Merge Test"
    assert "Python" in body["skills"]
    assert body["bio"] == "Updated bio"


async def test_patch_profile_adds_new_field(client: AsyncClient, auth_headers: dict):
    res = await client.patch(
        "/api/v1/users/profile",
        json={"company": "Startup Inc"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["company"] == "Startup Inc"
