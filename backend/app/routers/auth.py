from fastapi import APIRouter, Depends, HTTPException, status, Cookie
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Annotated
from app.core.config import settings
from app.core.database import get_db
from app.schemas.auth import SignUpRequest, SignInRequest, AuthResponse, UserResponse
from app.services.auth_service import (
    signup_user,
    signin_user,
    signout_user,
    refresh_access_token,
)

from app.core.dependencies import get_authenticated_user
from app.models.user import User

from fastapi.security import HTTPBearer

# This is NOT used for actual auth (get_authenticated_user handles that)
swagger_security = HTTPBearer(auto_error=False)

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Cookie Helper ─────────────────────────────────────────────────


def _set_auth_cookies(
    response: JSONResponse, access_token: str, refresh_token: str
) -> None:
    """Set HTTP-only cookies for both tokens."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,  # True in production (HTTPS)
        samesite="lax",
        max_age=15 * 60,  # 15 minutes in seconds
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,  # True in production (HTTPS)
        samesite="lax",
        max_age=7 * 24 * 60 * 60,  # 7 days in seconds
    )


# ── Routes ────────────────────────────────────────────────────────


@router.post(
    "/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED
)
def signup(request: SignUpRequest, db: Session = Depends(get_db)):
    user, access_token, refresh_token = signup_user(request, db)

    response = JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "plan": user.plan.value,
                "is_verified": user.is_verified,
                "created_at": user.created_at.isoformat(),
            },
            "message": "Account created successfully",
        },
    )
    _set_auth_cookies(response, access_token, refresh_token)
    return response


@router.post("/signin", response_model=AuthResponse)
def signin(request: SignInRequest, db: Session = Depends(get_db)):
    user, access_token, refresh_token = signin_user(request, db)

    response = JSONResponse(
        content={
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "plan": user.plan.value,
                "is_verified": user.is_verified,
                "created_at": user.created_at.isoformat(),
            },
            "message": "Signed in successfully",
        },
    )
    _set_auth_cookies(response, access_token, refresh_token)
    return response


@router.post("/signout")
def signout(
    refresh_token: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db),
):
    if refresh_token:
        signout_user(refresh_token, db)

    response = JSONResponse(content={"message": "Signed out successfully"})
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return response


@router.post("/refresh")
def refresh(
    refresh_token: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided",
        )

    user, new_access_token = refresh_access_token(refresh_token, db)

    response = JSONResponse(
        content={
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "plan": user.plan.value,
                "is_verified": user.is_verified,
                "created_at": user.created_at.isoformat(),
            },
            "message": "Token refreshed successfully",
        },
    )
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=15 * 60,
    )
    return response


@router.get("/me", response_model=UserResponse)
def me(
    current_user: User = Depends(get_authenticated_user),
    _=Depends(swagger_security),  # Swagger UI: sends Authorization header
):
    return UserResponse.model_validate(current_user)


# ── Debug Routes (Development Only) ──────────────────────────────

@router.post("/dev/tokens")
def get_dev_tokens(request: SignInRequest, db: Session = Depends(get_db)):
    """
    DEBUG ONLY — returns tokens in response body for Swagger testing.
    Returns 404 in staging/production — safe to leave in codebase.
    """
    if settings.APP_ENV != "development":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    user, access_token, refresh_token = signin_user(request, db)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "note": "DEV ONLY — never exists in production",
    }
