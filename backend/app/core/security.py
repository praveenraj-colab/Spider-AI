from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def _create_jwt_token(
    *,
    subject: uuid.UUID,
    token_type: str,
    expires_delta: timedelta,
    token_id: uuid.UUID | None = None,
) -> str:
    settings = get_settings()
    issued_at = utc_now()
    expires_at = issued_at + expires_delta
    payload: dict[str, Any] = {
        "sub": str(subject),
        "exp": expires_at,
        "iat": issued_at,
        "type": token_type,
        "jti": str(token_id or uuid.uuid4()),
    }
    return jwt.encode(
        payload,
        settings.secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )


def create_access_token(subject: uuid.UUID, expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    return _create_jwt_token(
        subject=subject,
        token_type="access",
        expires_delta=expires_delta or timedelta(minutes=settings.access_token_expire_minutes),
    )


def create_refresh_token(
    subject: uuid.UUID,
    *,
    token_id: uuid.UUID | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    settings = get_settings()
    return _create_jwt_token(
        subject=subject,
        token_type="refresh",
        token_id=token_id,
        expires_delta=expires_delta or timedelta(days=settings.refresh_token_expire_days),
    )


def decode_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        return jwt.decode(
            token,
            settings.secret_key.get_secret_value(),
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as exc:
        raise ValueError("Invalid token.") from exc


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
