from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
from typing import NoReturn

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    utc_now,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.session import UserSession
from app.models.user import User
from app.repositories.refresh_token import RefreshTokenRepository
from app.repositories.session import UserSessionRepository
from app.repositories.user import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.token import TokenPair


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
        existing = await self.users.get_by_email(payload.email)
        if existing is not None:
            self._raise_conflict("An account with this email already exists.")

        user = User(
            email=str(payload.email).lower(),
            full_name=payload.full_name,
            password_hash=hash_password(payload.password),
        )
        await self.users.add(user)
        tokens = await self._issue_tokens(user, client)
        await self.session.commit()
        return user, tokens

    async def login(self, payload: LoginRequest, client: ClientContext) -> tuple[User, TokenPair]:
        user = await self.users.get_by_email(payload.email)
        if user is None or not verify_password(payload.password, user.password_hash):
            self._raise_unauthorized("Invalid email or password.")
        if not user.is_active:
            self._raise_unauthorized("User account is inactive.")

        user.last_login_at = utc_now()
        tokens = await self._issue_tokens(user, client)
        await self.session.commit()
        await self.session.refresh(user)
        return user, tokens

    async def refresh(self, refresh_token: str) -> tuple[User, TokenPair]:
        token_hash = hash_refresh_token(refresh_token)
        existing = await self.refresh_tokens.get_by_hash(token_hash)
        now = utc_now()

        if existing is None:
            self._raise_unauthorized("Invalid refresh token.")
        if existing.revoked_at is not None:
            await self._revoke_reused_token_family(existing, now)
            self._raise_unauthorized("Refresh token has been revoked.")
        if existing.expires_at <= now or existing.session.revoked_at is not None:
            self._raise_unauthorized("Refresh token has expired.")
        if not existing.user.is_active:
            self._raise_unauthorized("User account is inactive.")

        raw_refresh_token = generate_refresh_token()
        new_refresh_token = RefreshToken(
            user_id=existing.user_id,
            session_id=existing.session_id,
            token_hash=hash_refresh_token(raw_refresh_token),
            expires_at=now + timedelta(days=self.settings.refresh_token_expire_days),
        )
        await self.refresh_tokens.add(new_refresh_token)
        existing.revoked_at = now
        existing.replaced_by_token_id = new_refresh_token.id

        access_token = create_access_token(existing.user_id)
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

    async def _issue_tokens(self, user: User, client: ClientContext) -> TokenPair:
        now = utc_now()
        session = UserSession(
            user_id=user.id,
            user_agent=client.user_agent,
            ip_address=client.ip_address,
            expires_at=now + timedelta(days=self.settings.refresh_token_expire_days),
        )
        await self.sessions.add(session)

        raw_refresh_token = generate_refresh_token()
        refresh_token = RefreshToken(
            user_id=user.id,
            session_id=session.id,
            token_hash=hash_refresh_token(raw_refresh_token),
            expires_at=session.expires_at,
        )
        await self.refresh_tokens.add(refresh_token)
        access_token = create_access_token(user.id)
        return self._token_pair(access_token, raw_refresh_token)

    async def _revoke_reused_token_family(self, token: RefreshToken, now) -> None:
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

    def _raise_unauthorized(self, message: str) -> NoReturn:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=message)

    def _raise_conflict(self, message: str) -> NoReturn:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=message)
