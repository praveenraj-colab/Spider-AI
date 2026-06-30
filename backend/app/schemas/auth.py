from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field

from app.schemas.token import TokenPair
from app.schemas.user import UserCreate, UserRead


class RegisterRequest(UserCreate):
    pass


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=32, max_length=512)


class LogoutRequest(BaseModel):
    refresh_token: str = Field(min_length=32, max_length=512)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    accepted: bool
    message: str


class AuthResponse(BaseModel):
    user: UserRead
    tokens: TokenPair
