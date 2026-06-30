from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.chat import Chat
from app.models.message import Message
from app.models.user import User
from app.repositories.message import MessageRepository
from app.schemas.chat import ChatCreate, ChatDetail, ChatRead, ChatUpdate
from app.schemas.common import DeleteResponse
from app.schemas.message import MessageCreate, MessageRead
from app.services.chat import ChatService


router = APIRouter()


@router.get("/", response_model=list[ChatRead])
async def list_chats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Chat]:
    return await ChatService(db).list_chats(current_user)


@router.post("/", response_model=ChatRead, status_code=status.HTTP_201_CREATED)
async def create_chat(
    payload: ChatCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Chat:
    return await ChatService(db).create_chat(current_user, payload)


@router.get("/{chat_id}", response_model=ChatDetail)
async def read_chat(
    chat_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Chat:
    return await ChatService(db).get_chat(current_user, chat_id)


@router.patch("/{chat_id}", response_model=ChatRead)
async def rename_chat(
    chat_id: uuid.UUID,
    payload: ChatUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Chat:
    return await ChatService(db).rename_chat(current_user, chat_id, payload)


@router.delete("/{chat_id}", response_model=DeleteResponse)
async def delete_chat(
    chat_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DeleteResponse:
    await ChatService(db).delete_chat(current_user, chat_id)
    return DeleteResponse(deleted=True)


@router.get("/{chat_id}/messages", response_model=list[MessageRead])
async def list_messages(
    chat_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Message]:
    await ChatService(db).get_chat(current_user, chat_id)
    return await MessageRepository(db).list_for_chat(chat_id)


@router.post("/{chat_id}/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
async def create_message(
    chat_id: uuid.UUID,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Message:
    return await ChatService(db).create_user_message(current_user, chat_id, payload)
