from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import UserSession
from app.repositories.base import BaseRepository


class UserSessionRepository(BaseRepository[UserSession]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, UserSession)

    async def get_active(self, session_id: uuid.UUID) -> UserSession | None:
        result = await self.session.execute(
            select(UserSession).where(
                UserSession.id == session_id,
                UserSession.revoked_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def revoke(self, session: UserSession, revoked_at: datetime) -> UserSession:
        session.revoked_at = revoked_at
        await self.session.flush()
        await self.session.refresh(session)
        return session
