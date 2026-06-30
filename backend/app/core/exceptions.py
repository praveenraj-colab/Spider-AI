from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError


logger = logging.getLogger(__name__)


def error_payload(message: str, code: str, request_id: str | None = None) -> dict[str, object]:
    return {
        "error": {
            "message": message,
            "code": code,
            "request_id": request_id,
        }
    }


def validation_error_payload(exc: RequestValidationError) -> dict[str, object]:
    return {
        "success": False,
        "message": "Validation failed",
        "errors": [_format_validation_error(error) for error in exc.errors()],
    }


def _format_validation_error(error: dict[str, object]) -> dict[str, str]:
    loc = error.get("loc")
    location = loc if isinstance(loc, (list, tuple)) else []
    field_parts = [str(part) for part in location if part not in {"body", "query", "path"}]
    field = ".".join(field_parts) or "request"

    message = str(error.get("msg") or "Invalid value.")
    context = error.get("ctx")
    if isinstance(context, dict) and "error" in context:
        message = str(context["error"])
    elif message.startswith("Value error, "):
        message = message.removeprefix("Value error, ")

    return {"field": field, "message": message}


def install_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        detail = exc.detail if isinstance(exc.detail, str) else "Request failed."
        return JSONResponse(
            status_code=exc.status_code,
            content=error_payload(detail, "http_error", request_id),
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=validation_error_payload(exc),
        )

    @app.exception_handler(SQLAlchemyError)
    async def database_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        logger.exception(
            "Database operation failed.",
            extra={"request_id": request_id},
            exc_info=(type(exc), exc, exc.__traceback__),
        )
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=error_payload("Database operation failed.", "database_error", request_id),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        logger.exception(
            "Unhandled server error.",
            extra={"request_id": request_id},
            exc_info=(type(exc), exc, exc.__traceback__),
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_payload("Internal server error.", "server_error", request_id),
        )
