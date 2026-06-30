from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import ORMModel
from app.utils.sanitize import clean_text


MessageRole = Literal["user", "assistant", "system"]
MessageStatus = Literal["created", "streaming", "completed", "failed"]


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=12000)

    @field_validator("content")
    @classmethod
    def normalize_content(cls, value: str) -> str:
        return clean_text(value, max_length=12000)


class MessageRead(ORMModel):
    id: uuid.UUID
    chat_id: uuid.UUID
    role: MessageRole
    status: MessageStatus
    content: str
    created_at: datetime
    updated_at: datetime
