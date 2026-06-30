from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message
from app.repositories.base import BaseRepository


class MessageRepository(BaseRepository[Message]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Message)

    async def list_for_chat(self, chat_id: uuid.UUID) -> list[Message]:
        result = await self.session.execute(
            select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at.asc())
        )
        return list(result.scalars().all())
