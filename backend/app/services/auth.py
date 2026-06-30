from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, NoReturn

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import (
    create_access_token as security_create_access_token,
    create_refresh_token as security_create_refresh_token,
    decode_token,
    hash_password as security_hash_password,
    hash_refresh_token,
    utc_now,
    verify_password as security_verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.session import UserSession
from app.models.user import User, UserRole
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.session import UserSessionRepository
from app.repositories.user import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, UserLogin
from app.schemas.token import TokenPair
from app.schemas.user import UserCreate


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ClientContext:
    ip_address: str | None
    user_agent: str | None


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.settings = get_settings()
        self.users = UserRepository(session)
        self.sessions = UserSessionRepository(session)
        self.refresh_tokens = RefreshTokenRepository(session)

    async def register(
        self,
        payload: RegisterRequest,
        client: ClientContext,
    ) -> tuple[User, TokenPair]:
        try:
            user = await self._create_user(payload)
            tokens = await self._issue_tokens(user, client)
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            self._log_registration_failure(payload.email, "duplicate_email")
            self._raise_conflict("An account with this email already exists.")

        await self.session.refresh(user)
        self._log_registration_success(user)
        return user, tokens

    async def register_user(self, payload: UserCreate) -> User:
        """Create a user account with a bcrypt password hash."""
        try:
            user = await self._create_user(payload)
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            self._log_registration_failure(payload.email, "duplicate_email")
            self._raise_conflict("An account with this email already exists.")

        await self.session.refresh(user)
        self._log_registration_success(user)
        return user

    async def login(
        self,
        payload: LoginRequest | UserLogin,
        client: ClientContext,
    ) -> tuple[User, TokenPair]:
        user = await self.authenticate_user(payload)
        tokens = await self._issue_tokens(user, client)
        await self.session.commit()
        await self.session.refresh(user)
        logger.info("User logged in.", extra={"user_id": str(user.id), "email": user.email})
        return user, tokens

    async def authenticate_user(self, payload: UserLogin) -> User:
        """Validate user credentials and return the active user."""
        email = self._normalize_email(payload.email)
        user = await self.users.get_user_by_email(email)
        if user is None:
            self._log_authentication_failure(email, "unknown_email")
            self._raise_unauthorized("Invalid email or password.")

        if not self.verify_password(payload.password, user.password_hash):
            self._log_authentication_failure(email, "invalid_password")
            self._raise_unauthorized("Invalid email or password.")

        if not user.is_active:
            self._log_authentication_failure(email, "inactive_user")
            self._raise_unauthorized("User account is inactive.")

        user.last_login_at = utc_now()
        return user

    async def refresh(self, refresh_token: str) -> tuple[User, TokenPair]:
        payload = self._decode_refresh_payload(refresh_token)
        token_id = self._uuid_from_payload(payload, "jti")
        subject = self._uuid_from_payload(payload, "sub")
        token_hash = hash_refresh_token(refresh_token)
        existing = await self.refresh_tokens.get_by_hash(token_hash)
        now = utc_now()

        if existing is None:
            logger.warning("Refresh token rejected.", extra={"reason": "token_not_found"})
            self._raise_unauthorized("Invalid refresh token.")
        if existing.id != token_id or existing.user_id != subject:
            logger.warning(
                "Refresh token rejected.",
                extra={"reason": "token_payload_mismatch", "user_id": str(existing.user_id)},
            )
            self._raise_unauthorized("Invalid refresh token.")
        if existing.revoked_at is not None:
            await self._revoke_reused_token_family(existing, now)
            logger.warning(
                "Refresh token reuse detected.",
                extra={"user_id": str(existing.user_id), "session_id": str(existing.session_id)},
            )
            self._raise_unauthorized("Refresh token has been revoked.")
        if existing.expires_at <= now or existing.session.revoked_at is not None:
            self._raise_unauthorized("Refresh token has expired.")
        if not existing.user.is_active:
            self._raise_unauthorized("User account is inactive.")

        new_refresh_token_id = uuid.uuid4()
        raw_refresh_token = self.create_refresh_token(
            existing.user_id,
            token_id=new_refresh_token_id,
        )
        new_refresh_token = RefreshToken(
            id=new_refresh_token_id,
            user_id=existing.user_id,
            session_id=existing.session_id,
            token_hash=hash_refresh_token(raw_refresh_token),
            expires_at=now + timedelta(days=self.settings.refresh_token_expire_days),
        )
        await self.refresh_tokens.add(new_refresh_token)
        existing.revoked_at = now
        existing.replaced_by_token_id = new_refresh_token.id

        access_token = self.create_access_token(existing.user_id)
        await self.session.commit()
        await self.session.refresh(existing.user)
        return existing.user, self._token_pair(access_token, raw_refresh_token)

    async def logout(self, refresh_token: str) -> None:
        token_hash = hash_refresh_token(refresh_token)
        existing = await self.refresh_tokens.get_by_hash(token_hash)
        if existing is None:
            return

        now = utc_now()
        await self.refresh_tokens.revoke_all_for_session(existing.session_id, now)
        if existing.session.revoked_at is None:
            await self.sessions.revoke(existing.session, now)
        await self.session.commit()
        logger.info(
            "User logged out.",
            extra={"user_id": str(existing.user_id), "session_id": str(existing.session_id)},
        )

    async def _issue_tokens(self, user: User, client: ClientContext) -> TokenPair:
        now = utc_now()
        session = UserSession(
            user_id=user.id,
            user_agent=client.user_agent,
            ip_address=client.ip_address,
            expires_at=now + timedelta(days=self.settings.refresh_token_expire_days),
        )
        await self.sessions.add(session)

        refresh_token_id = uuid.uuid4()
        raw_refresh_token = self.create_refresh_token(user.id, token_id=refresh_token_id)
        refresh_token = RefreshToken(
            id=refresh_token_id,
            user_id=user.id,
            session_id=session.id,
            token_hash=hash_refresh_token(raw_refresh_token),
            expires_at=session.expires_at,
        )
        await self.refresh_tokens.add(refresh_token)
        access_token = self.create_access_token(user.id)
        return self._token_pair(access_token, raw_refresh_token)

    def hash_password(self, password: str) -> str:
        return security_hash_password(password)

    def verify_password(self, password: str, password_hash: str) -> bool:
        return security_verify_password(password, password_hash)

    def create_access_token(self, user_id: uuid.UUID) -> str:
        return security_create_access_token(user_id)

    def create_refresh_token(
        self,
        user_id: uuid.UUID,
        *,
        token_id: uuid.UUID | None = None,
    ) -> str:
        return security_create_refresh_token(user_id, token_id=token_id)

    async def _create_user(self, payload: UserCreate) -> User:
        email = self._normalize_email(payload.email)
        existing = await self.users.get_user_by_email(email)
        if existing is not None:
            self._log_registration_failure(email, "duplicate_email")
            self._raise_conflict("An account with this email already exists.")

        return await self.users.create_user(
            full_name=payload.full_name,
            email=email,
            password_hash=self.hash_password(payload.password),
            role=UserRole.USER,
        )

    async def _revoke_reused_token_family(self, token: RefreshToken, now: datetime) -> None:
        await self.refresh_tokens.revoke_all_for_session(token.session_id, now)
        if token.session.revoked_at is None:
            await self.sessions.revoke(token.session, now)
        await self.session.commit()

    def _token_pair(self, access_token: str, refresh_token: str) -> TokenPair:
        return TokenPair(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=self.settings.access_token_expire_minutes * 60,
        )

    def _decode_refresh_payload(self, refresh_token: str) -> dict[str, Any]:
        try:
            payload = decode_token(refresh_token)
        except ValueError:
            logger.warning("Refresh token rejected.", extra={"reason": "invalid_jwt"})
            self._raise_unauthorized("Invalid refresh token.")

        if payload.get("type") != "refresh":
            logger.warning("Refresh token rejected.", extra={"reason": "invalid_token_type"})
            self._raise_unauthorized("Invalid refresh token.")
        return payload

    def _uuid_from_payload(self, payload: dict[str, Any], key: str) -> uuid.UUID:
        try:
            return uuid.UUID(str(payload[key]))
        except (KeyError, TypeError, ValueError):
            logger.warning("Token rejected.", extra={"reason": f"invalid_{key}"})
            self._raise_unauthorized("Invalid refresh token.")

    @staticmethod
    def _normalize_email(email: object) -> str:
        return str(email).lower()

    def _log_registration_success(self, user: User) -> None:
        logger.info("User registered.", extra={"user_id": str(user.id), "email": user.email})

    def _log_registration_failure(self, email: object, reason: str) -> None:
        logger.warning(
            "User registration failed.",
            extra={"email": self._normalize_email(email), "reason": reason},
        )

    @staticmethod
    def _log_authentication_failure(email: str, reason: str) -> None:
        logger.warning(
            "Authentication failed.",
            extra={"email": email, "reason": reason},
        )

    def _raise_unauthorized(self, message: str) -> NoReturn:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message,
            headers={"WWW-Authenticate": "Bearer"},
        )

    def _raise_conflict(self, message: str) -> NoReturn:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=message)
