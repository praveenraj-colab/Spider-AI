from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole
from app.schemas.common import ORMModel
from app.utils.sanitize import clean_text


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)

    @field_validator("full_name")
    @classmethod
    def normalize_full_name(cls, value: str) -> str:
        cleaned = clean_text(value, max_length=160)
        if len(cleaned) < 2:
            raise ValueError("Full name must contain at least 2 characters.")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_strong_password(cls, value: str) -> str:
        if not any(character.islower() for character in value):
            raise ValueError("Password must include at least one lowercase letter.")
        if not any(character.isupper() for character in value):
            raise ValueError("Password must include at least one uppercase letter.")
        if not any(character.isdigit() for character in value):
            raise ValueError("Password must include at least one number.")
        if not any(not character.isalnum() for character in value):
            raise ValueError("Password must include at least one special character.")
        return value


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=160)

    @field_validator("full_name")
    @classmethod
    def normalize_full_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = clean_text(value, max_length=160)
        if len(cleaned) < 2:
            raise ValueError("Full name must contain at least 2 characters.")
        return cleaned


class UserResponse(ORMModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: UserRole
    created_at: datetime


class UserRead(UserResponse):
    is_active: bool
    is_verified: bool
    is_superuser: bool
    updated_at: datetime
    last_login_at: datetime | None = None
