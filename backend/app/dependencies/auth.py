from __future__ import annotations

import logging
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import decode_token
from app.dependencies.db import get_db
from app.models.user import User
from app.repositories.user import UserRepository


settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/login")
logger = logging.getLogger(__name__)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise ValueError("Invalid token type.")
        user_id = uuid.UUID(str(payload.get("sub")))
    except (TypeError, ValueError):
        logger.warning("Access token authentication failed.", extra={"reason": "invalid_token"})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await UserRepository(db).get_active(user_id)
    if user is None:
        logger.warning(
            "Access token authentication failed.",
            extra={"reason": "inactive_or_missing_user", "user_id": str(user_id)},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive or does not exist.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
