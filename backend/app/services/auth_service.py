import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from jose import JWTError

from app.core.logger import logger
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.auth import SignUpRequest, SignInRequest
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.config import settings

# ── Helpers ──────────────────────────────────────────────────────


def _hash_jti(jti: str) -> str:
    """Hash a JTI using SHA-256 for secure DB storage."""
    return hashlib.sha256(jti.encode()).hexdigest()


def _create_tokens(user_id: str, db: Session) -> tuple[str, str]:
    """
    Create access + refresh tokens and store refresh token in DB.
    Returns: (access_token, refresh_token JWT)
    """
    # 1. Generate unique JTI for refresh token
    jti = secrets.token_hex(16)

    # 2. Create both tokens
    access_token = create_access_token(data={"sub": user_id})
    refresh_token = create_refresh_token(data={"sub": user_id, "jti": jti})

    # 3. Store hashed JTI in DB
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    db_token = RefreshToken(
        user_id=user_id,
        token_hash=_hash_jti(jti),
        expires_at=expires_at,
    )
    db.add(db_token)

    return access_token, refresh_token


# ── Auth Operations ───────────────────────────────────────────────


def signup_user(request: SignUpRequest, db: Session) -> tuple[User, str, str]:
    """
    Register a new user.
    Returns: (user, access_token, refresh_token)
    """
    # 1. Check if email already exists
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        logger.warning(
            "Signup failed - email already exists", extra={"email": request.email}
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # 2. Create user
    user = User(
        name=request.name,
        email=request.email,
        password_hash=hash_password(request.password),
    )
    db.add(user)
    db.flush()  # get user.id without committing

    # 3. Create tokens + store in DB
    access_token, refresh_token = _create_tokens(str(user.id), db)

    db.commit()
    db.refresh(user)

    logger.info("User signed up successfully", extra={"user_id": str(user.id)})
    return user, access_token, refresh_token


def signin_user(request: SignInRequest, db: Session) -> tuple[User, str, str]:
    """
    Authenticate existing user.
    Returns: (user, access_token, refresh_token)
    """
    # 1. Find user — same error for wrong email OR password (security)
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        logger.warning(
            "Signin failed - invalid credentials", extra={"email": request.email}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # 2. Create tokens + store in DB
    access_token, refresh_token = _create_tokens(str(user.id), db)

    db.commit()
    db.refresh(user)

    logger.info("User signed in successfully", extra={"user_id": str(user.id)})

    return user, access_token, refresh_token


def signout_user(refresh_token: str, db: Session) -> None:
    """
    Revoke refresh token on logout.
    """
    try:
        payload = decode_token(refresh_token)
        jti = payload.get("jti")
        if not jti:
            return

        token_hash = _hash_jti(jti)
        db_token = (
            db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
        )

        if db_token:
            db_token.is_revoked = True
            db.commit()
            logger.info(
                "User signed out - token revoked",
                extra={"user_id": str(db_token.user_id)},
            )

    except JWTError:
        pass  # token already invalid, nothing to revoke


def refresh_access_token(refresh_token: str, db: Session) -> tuple[User, str]:
    """
    Issue new access token using valid refresh token.
    Returns: (user, new_access_token)
    """
    # 1. Verify JWT signature first (fast, no DB)
    try:
        payload = decode_token(refresh_token)
        user_id = payload.get("sub")
        jti = payload.get("jti")
        token_type = payload.get("type")

        if not user_id or not jti or token_type != "refresh":
            logger.warning("Token refresh failed - invalid token structure")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
    except JWTError:
        logger.warning("Token refresh failed - JWT error")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # 2. Check DB — is it revoked? (security layer)
    token_hash = _hash_jti(jti)
    db_token = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked == False,
        )
        .first()
    )

    if not db_token:
        logger.warning(
            "Token refresh failed - revoked or not found", extra={"user_id": user_id}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token revoked or not found",
        )

    # 3. Check expiry
    if db_token.expires_at < datetime.now(timezone.utc):
        logger.warning("Token refresh failed - expired", extra={"user_id": user_id})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
        )

    # 4. Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.error(
            "Token refresh failed - user not found", extra={"user_id": user_id}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # 5. Issue new access token
    new_access_token = create_access_token(data={"sub": str(user.id)})
    logger.info("Access token refreshed", extra={"user_id": str(user.id)})
    return user, new_access_token


def get_current_user(access_token: str, db: Session) -> User:
    """
    Validate access token and return current user.
    """
    try:
        payload = decode_token(access_token)
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")

        if not user_id or token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user
