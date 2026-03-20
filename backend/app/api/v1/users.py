"""Users profile endpoints."""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from ...models.user import User
from ...repositories.user_repo import UserRepository
from ..dependencies import CurrentUser, DB

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/users", tags=["Users"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class ProfileData(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    experience: Optional[str] = None
    targetRole: Optional[str] = None
    industry: Optional[str] = None
    company: Optional[str] = None
    education: Optional[str] = None
    skills: Optional[List[str]] = None
    goals: Optional[List[str]] = None
    linkedinUrl: Optional[str] = None
    githubUrl: Optional[str] = None


class ProfileResponse(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    experience: Optional[str] = None
    targetRole: Optional[str] = None
    industry: Optional[str] = None
    company: Optional[str] = None
    education: Optional[str] = None
    skills: List[str] = []
    goals: List[str] = []
    linkedinUrl: Optional[str] = None
    githubUrl: Optional[str] = None
    createdAt: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _build_profile_response(user: User) -> ProfileResponse:
    pd = user.profile_data or {}
    return ProfileResponse(
        name=pd.get("name") or user.full_name or user.username or "User",
        email=user.email,
        phone=pd.get("phone"),
        bio=pd.get("bio"),
        experience=pd.get("experience"),
        targetRole=pd.get("targetRole"),
        industry=pd.get("industry"),
        company=pd.get("company"),
        education=pd.get("education"),
        skills=pd.get("skills", []),
        goals=pd.get("goals", []),
        linkedinUrl=pd.get("linkedinUrl"),
        githubUrl=pd.get("githubUrl"),
        createdAt=user.created_at.isoformat() if user.created_at else None,
    )


# ---------------------------------------------------------------------------
# GET /api/v1/users/profile
# ---------------------------------------------------------------------------
@router.get("/profile", response_model=ProfileResponse)
async def get_profile(current_user: CurrentUser) -> ProfileResponse:
    return _build_profile_response(current_user)


# ---------------------------------------------------------------------------
# POST /api/v1/users/profile  (onboarding — full write)
# ---------------------------------------------------------------------------
@router.post("/profile", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    body: ProfileData,
    current_user: CurrentUser,
    db: DB,
) -> ProfileResponse:
    repo = UserRepository(db)

    profile_dict = body.model_dump(exclude_none=False)

    # Also update full_name if provided
    update_data: Dict[str, Any] = {"profile_data": profile_dict}
    if body.name:
        update_data["full_name"] = body.name

    await repo.update(db_obj=current_user, obj_in=update_data)
    await db.commit()
    await db.refresh(current_user)

    logger.info("Profile created for user %s", current_user.id)
    return _build_profile_response(current_user)


# ---------------------------------------------------------------------------
# PATCH /api/v1/users/profile  (partial update)
# ---------------------------------------------------------------------------
@router.patch("/profile", response_model=ProfileResponse)
async def update_profile(
    body: ProfileData,
    current_user: CurrentUser,
    db: DB,
) -> ProfileResponse:
    repo = UserRepository(db)

    # Merge with existing profile_data
    existing = current_user.profile_data or {}
    updates = body.model_dump(exclude_none=True)
    merged = {**existing, **updates}

    update_data: Dict[str, Any] = {"profile_data": merged}
    if "name" in updates:
        update_data["full_name"] = updates["name"]

    await repo.update(db_obj=current_user, obj_in=update_data)
    await db.commit()
    await db.refresh(current_user)

    logger.info("Profile updated for user %s", current_user.id)
    return _build_profile_response(current_user)
