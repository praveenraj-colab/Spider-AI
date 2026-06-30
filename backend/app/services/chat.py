from __future__ import annotations

import uuid
from typing import NoReturn

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import Chat
from app.models.message import Message
from app.models.user import User
from app.repositories.chat import ChatRepository
from app.repositories.message import MessageRepository
from app.schemas.chat import ChatCreate, ChatUpdate
from app.schemas.message import MessageCreate


class ChatService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.chats = ChatRepository(session)
        self.messages = MessageRepository(session)

    async def list_chats(self, user: User) -> list[Chat]:
        return await self.chats.list_by_user(user.id)

    async def create_chat(self, user: User, payload: ChatCreate) -> Chat:
        chat = Chat(user_id=user.id, title=payload.title)
        await self.chats.add(chat)
        await self.session.commit()
        await self.session.refresh(chat)
        return chat

    async def get_chat(self, user: User, chat_id: uuid.UUID) -> Chat:
        chat = await self.chats.get_detail_for_user(chat_id, user.id)
        if chat is None:
            self._not_found()
        return chat

    async def rename_chat(self, user: User, chat_id: uuid.UUID, payload: ChatUpdate) -> Chat:
        chat = await self.chats.get_for_user(chat_id, user.id)
        if chat is None:
            self._not_found()
        chat.title = payload.title
        await self.session.commit()
        await self.session.refresh(chat)
        return chat

    async def delete_chat(self, user: User, chat_id: uuid.UUID) -> None:
        chat = await self.chats.get_for_user(chat_id, user.id)
        if chat is None:
            self._not_found()
        await self.chats.delete(chat)
        await self.session.commit()

    async def create_user_message(
        self,
        user: User,
        chat_id: uuid.UUID,
        payload: MessageCreate,
    ) -> Message:
        chat = await self.chats.get_for_user(chat_id, user.id)
        if chat is None:
            self._not_found()

        message = Message(
            chat_id=chat.id,
            role="user",
            status="completed",
            content=payload.content,
        )
        await self.messages.add(message)

        if chat.title.lower() == "new chat":
            chat.title = self._title_from_message(payload.content)

        await self.session.commit()
        await self.session.refresh(message)
        return message

    @staticmethod
    def _title_from_message(content: str) -> str:
        title = " ".join(content.split())
        return title[:60] or "New chat"

    def _not_found(self) -> NoReturn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found.")
