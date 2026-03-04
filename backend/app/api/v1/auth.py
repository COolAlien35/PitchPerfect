from __future__ import annotations

import logging
from typing import Annotated

from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    HTTPException,
    Response,
    status,
)

from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.security import (
    ACCESS_TOKEN_TTL,
    REFRESH_TOKEN_TTL,
    TokenPair,
    TokenPayload,
    blacklist_token,
    blacklist_token_pair,
    create_access_token,
    create_refresh_token,
    create_token_pair,
    decode_token,
    hash_password,
    is_blacklisted,
    verify_password,
)
from ...models.user import User
from ...repositories.user_repo import UserRepository
from ..dependencies import get_db, CurrentUser

logger = logging.getLogger("pitchperfect.auth")
router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

DB = Annotated[AsyncSession, Depends(get_db)]

# ---------------------------------------------------------------------------
# Pydantic v2 request / response schemas
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    username: str | None = None


class RegisterResponse(BaseModel):
    id: str
    email: str
    full_name: str
    username: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(TokenPair):
    pass


class MeResponse(BaseModel):
    id: str
    email: str
    full_name: str | None
    username: str | None
    is_active: bool
    created_at: str


class RefreshResponse(TokenPair):
    pass


class LogoutRequest(BaseModel):
    # Access token JTI is extracted from the header; optionally accept it
    # in the body for explicit revocation of a known token.
    access_jti: str | None = None


class LogoutResponse(BaseModel):
    message: str = "Successfully logged out."


# ---------------------------------------------------------------------------
# Refresh token cookie config
# ---------------------------------------------------------------------------
_REFRESH_COOKIE_NAME  = "pp_refresh_token"
_REFRESH_COOKIE_MAX_AGE = int(REFRESH_TOKEN_TTL.total_seconds())


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=_REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=_REFRESH_COOKIE_MAX_AGE,
        httponly=True,
        secure=True,                # HTTPS only in production
        samesite="strict",
        path="/api/v1/auth",        # scoped to auth endpoints only
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=_REFRESH_COOKIE_NAME,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/api/v1/auth",
    )


# ---------------------------------------------------------------------------
# POST /api/v1/auth/register
# ---------------------------------------------------------------------------
@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user account.",
)
async def register(body: RegisterRequest, db: DB) -> RegisterResponse:
    repo = UserRepository(db)

    existing = await repo.get_by_email(email=body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "EMAIL_EXISTS", "message": "An account with this email already exists."},
        )

    user = await repo.create(obj_in={
        "email":           body.email,
        "hashed_password": hash_password(body.password),
        "full_name":       body.full_name,
        "username":        body.username,
    })
    await db.commit()

    logger.info("User registered", extra={"user_id": str(user.id), "email": body.email})
    return RegisterResponse(id=str(user.id), email=user.email, full_name=user.full_name, username=user.username)


# ---------------------------------------------------------------------------
# POST /api/v1/auth/login
# ---------------------------------------------------------------------------
@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Authenticate and receive an access/refresh token pair.",
)
async def login(
    body: LoginRequest,
    response: Response,
    db: DB,
) -> LoginResponse:
    repo = UserRepository(db)
    user = await repo.get_by_email(email=body.email)

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Incorrect email or password."},
            headers={"WWW-Authenticate": "Bearer"},
        )

    pair = create_token_pair(str(user.id))

    # Set refresh token in httpOnly cookie
    _set_refresh_cookie(response, pair.refresh_token)

    logger.info("User logged in", extra={"user_id": str(user.id)})
    return LoginResponse(**pair.model_dump())


# ---------------------------------------------------------------------------
# POST /api/v1/auth/refresh  (Token rotation)
# ---------------------------------------------------------------------------
@router.post(
    "/refresh",
    response_model=RefreshResponse,
    summary="Rotate the token pair using the refresh token cookie.",
)
async def refresh(
    response: Response,
    pp_refresh_token: Annotated[str | None, Cookie()] = None,
) -> RefreshResponse:
    if not pp_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "MISSING_REFRESH", "message": "Refresh token cookie is missing."},
        )

    # 1. Decode + validate the refresh token
    try:
        payload = decode_token(pp_refresh_token)
    except Exception:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_REFRESH", "message": "Refresh token is invalid or expired."},
        )

    if payload.type != "refresh":
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_TOKEN_TYPE", "message": "Token is not a refresh token."},
        )

    # 2. Check blacklist
    if await is_blacklisted(payload.jti):
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_REVOKED", "message": "Refresh token has been revoked."},
        )

    # 3. Blacklist the old refresh token (rotation)
    await blacklist_token(
        payload.jti,
        ttl_seconds=int(REFRESH_TOKEN_TTL.total_seconds()),
    )

    # 4. Issue a new pair
    new_pair = create_token_pair(payload.sub)
    _set_refresh_cookie(response, new_pair.refresh_token)

    logger.info("Token rotated", extra={"user_id": payload.sub})
    return RefreshResponse(**new_pair.model_dump())


# ---------------------------------------------------------------------------
# POST /api/v1/auth/logout
# ---------------------------------------------------------------------------
@router.post(
    "/logout",
    response_model=LogoutResponse,
    summary="Revoke the current access and refresh tokens.",
)
async def logout(
    response: Response,
    pp_refresh_token: Annotated[str | None, Cookie()] = None,
    body: LogoutRequest | None = None,
) -> LogoutResponse:
    # Blacklist the refresh token from the cookie
    if pp_refresh_token:
        try:
            refresh_payload = decode_token(pp_refresh_token)
            await blacklist_token(
                refresh_payload.jti,
                ttl_seconds=int(REFRESH_TOKEN_TTL.total_seconds()),
            )
        except Exception:
            pass  # token was already invalid — still clear the cookie

    # Blacklist the access token if its JTI was provided in the body
    if body and body.access_jti:
        await blacklist_token(
            body.access_jti,
            ttl_seconds=int(ACCESS_TOKEN_TTL.total_seconds()),
        )

    _clear_refresh_cookie(response)
    logger.info("User logged out")
    return LogoutResponse()


# ---------------------------------------------------------------------------
# GET /api/v1/auth/me
# ---------------------------------------------------------------------------
@router.get(
    "/me",
    response_model=MeResponse,
    summary="Return the currently authenticated user.",
)
async def me(current_user: CurrentUser) -> MeResponse:
    return MeResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        username=current_user.username,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat(),
    )
