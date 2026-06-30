from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, User)

    async def create_user(
        self,
        *,
        full_name: str,
        email: str,
        password_hash: str,
        role: UserRole = UserRole.USER,
    ) -> User:
        user = User(
            email=email.lower(),
            full_name=full_name,
            password_hash=password_hash,
            role=role,
        )
        return await self.add(user)

    async def get_user_by_email(self, email: str) -> User | None:
        return await self.get_by_email(email)

    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        return await self.get(user_id)

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User).where(func.lower(User.email) == email.lower())
        )
        return result.scalar_one_or_none()

    async def get_active(self, user_id: uuid.UUID) -> User | None:
        result = await self.session.execute(
            select(User).where(User.id == user_id, User.is_active.is_(True))
        )
        return result.scalar_one_or_none()

    async def list_users(self, *, limit: int = 50, offset: int = 0) -> list[User]:
        result = await self.session.execute(
            select(User).order_by(User.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all())
