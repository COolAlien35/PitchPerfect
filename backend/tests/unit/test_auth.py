"""Tests for POST /api/v1/auth/register, /login, /refresh, /logout."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------
async def test_register_success(client: AsyncClient):
    res = await client.post("/api/v1/auth/register", json={
        "email": "newuser@example.com",
        "password": "Password123!",
        "full_name": "New User",
    })
    assert res.status_code == 201
    body = res.json()
    assert body["email"] == "newuser@example.com"
    assert body["full_name"] == "New User"
    assert "id" in body


async def test_register_duplicate_email(client: AsyncClient):
    payload = {"email": "dup@example.com", "password": "Password123!", "full_name": "Dup"}
    await client.post("/api/v1/auth/register", json=payload)
    res = await client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 409
    assert res.json()["detail"]["code"] == "EMAIL_EXISTS"


async def test_register_invalid_email(client: AsyncClient):
    res = await client.post("/api/v1/auth/register", json={
        "email": "not-an-email",
        "password": "Password123!",
        "full_name": "Bad Email",
    })
    assert res.status_code == 422


async def test_register_short_password(client: AsyncClient):
    res = await client.post("/api/v1/auth/register", json={
        "email": "short@example.com",
        "password": "abc",
        "full_name": "Short Password",
    })
    assert res.status_code == 422


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------
async def test_login_success(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "email": "loginok@example.com", "password": "Password123!", "full_name": "Login OK",
    })
    res = await client.post("/api/v1/auth/login", json={
        "email": "loginok@example.com", "password": "Password123!",
    })
    assert res.status_code == 200
    body = res.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "email": "wrongpw@example.com", "password": "Password123!", "full_name": "Wrong PW",
    })
    res = await client.post("/api/v1/auth/login", json={
        "email": "wrongpw@example.com", "password": "BadPassword!",
    })
    assert res.status_code == 401
    assert res.json()["detail"]["code"] == "INVALID_CREDENTIALS"


async def test_login_nonexistent_user(client: AsyncClient):
    res = await client.post("/api/v1/auth/login", json={
        "email": "nobody@example.com", "password": "Password123!",
    })
    assert res.status_code == 401


# ---------------------------------------------------------------------------
# /me — verify token works
# ---------------------------------------------------------------------------
async def test_me_authenticated(client: AsyncClient, auth_headers: dict):
    res = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert "email" in body
    assert body["is_active"] is True


async def test_me_unauthenticated(client: AsyncClient):
    res = await client.get("/api/v1/auth/me")
    assert res.status_code == 401


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------
async def test_logout(client: AsyncClient, auth_headers: dict):
    res = await client.post("/api/v1/auth/logout", headers=auth_headers)
    assert res.status_code == 200
    assert "logged out" in res.json()["message"].lower()
