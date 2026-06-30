from __future__ import annotations

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.db import get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LogoutRequest,
    RefreshRequest,
    UserLogin,
)
from app.schemas.token import TokenResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.auth import AuthService, ClientContext


router = APIRouter()


def client_context(request: Request) -> ClientContext:
    return ClientContext(
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> User:
    return await AuthService(db).register_user(payload)


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: UserLogin,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    _, tokens = await AuthService(db).login(payload, client_context(request))
    return tokens


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    _, tokens = await AuthService(db).refresh(payload.refresh_token)
    return tokens


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(payload: LogoutRequest, db: AsyncSession = Depends(get_db)) -> None:
    await AuthService(db).logout(payload.refresh_token)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(_: ForgotPasswordRequest) -> ForgotPasswordResponse:
    return ForgotPasswordResponse(
        accepted=True,
        message="Password reset delivery is reserved for a later production integration.",
    )
