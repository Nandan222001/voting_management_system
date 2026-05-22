"""
Standardised HTTP response helpers.

Single Responsibility: Every function here is exclusively responsible for
shaping the JSON envelope that the API returns to clients.
"""

from typing import Any

from fastapi import status
from fastapi.responses import JSONResponse


def success_response(
    data: Any = None,
    message: str = "Success",
    status_code: int = status.HTTP_200_OK,
) -> JSONResponse:
    """
    Build a successful JSON response.

    Args:
        data:        Payload to include under the ``"data"`` key.
        message:     Human-readable description of the outcome.
        status_code: HTTP status code (default 200).

    Returns:
        A :class:`fastapi.responses.JSONResponse` with the envelope::

            {
                "success": true,
                "message": "<message>",
                "data": <data>
            }
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "message": message,
            "data": data,
        },
    )


def error_response(
    message: str = "An error occurred",
    status_code: int = status.HTTP_400_BAD_REQUEST,
    errors: Any = None,
) -> JSONResponse:
    """
    Build an error JSON response.

    Args:
        message:     Human-readable error description.
        status_code: HTTP status code (default 400).
        errors:      Optional structured error details (field errors, etc.).

    Returns:
        A :class:`fastapi.responses.JSONResponse` with the envelope::

            {
                "success": false,
                "message": "<message>",
                "errors": <errors>
            }
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "errors": errors,
        },
    )


def paginated_response(
    data: list[Any],
    total: int,
    page: int,
    per_page: int,
    message: str = "Success",
) -> JSONResponse:
    """
    Build a paginated success response.

    Args:
        data:     The current page of items.
        total:    Total number of items across all pages.
        page:     Current page number (1-indexed).
        per_page: Number of items per page.
        message:  Human-readable description.

    Returns:
        A :class:`fastapi.responses.JSONResponse` with the envelope::

            {
                "success": true,
                "message": "<message>",
                "data": [...],
                "pagination": {
                    "total": <total>,
                    "page": <page>,
                    "per_page": <per_page>,
                    "total_pages": <ceil(total/per_page)>,
                    "has_next": <bool>,
                    "has_prev": <bool>
                }
            }
    """
    import math

    total_pages = math.ceil(total / per_page) if per_page > 0 else 0

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": message,
            "data": data,
            "pagination": {
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1,
            },
        },
    )
