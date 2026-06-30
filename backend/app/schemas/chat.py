from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import ORMModel
from app.schemas.message import MessageRead
from app.utils.sanitize import clean_text


class ChatCreate(BaseModel):
    title: str = Field(default="New chat", min_length=1, max_length=120)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        return clean_text(value, max_length=120) or "New chat"


class ChatUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=120)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        return clean_text(value, max_length=120)


class ChatRead(ORMModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime


class ChatDetail(ChatRead):
    messages: list[MessageRead]
