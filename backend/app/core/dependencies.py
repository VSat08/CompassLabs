from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Annotated

from app.core.database import get_db
from app.services.auth_service import get_current_user
from app.models.user import User

security = HTTPBearer(auto_error=False)


def get_authenticated_user(
    request: Request,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(security)
    ] = None,
    db: Session = Depends(get_db),
) -> User:
    """
    Reusable auth dependency for all protected routes.
    Priority:
    1. HTTP-only cookie (production)
    2. Bearer token header (Swagger dev)
    """
    access_token = request.cookies.get("access_token")

    if not access_token and credentials:
        access_token = credentials.credentials

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    return get_current_user(access_token, db)
