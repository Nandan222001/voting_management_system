from pathlib import Path
import re
import time

from fastapi import HTTPException, UploadFile, status


BACKEND_ROOT = Path(__file__).resolve().parents[2]
STATIC_ROOT = BACKEND_ROOT / "static"
UPLOADS_ROOT = STATIC_ROOT / "uploads"
ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
ALLOWED_DOCUMENT_TYPES = {*ALLOWED_IMAGE_TYPES, "application/pdf"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024
PROJECT_ROOT = BACKEND_ROOT.parent
MOBILE_ASSETS_IMAGES_ROOT = PROJECT_ROOT / "mobile" / "assets" / "images"


import logging

logger = logging.getLogger(__name__)

async def save_uploaded_image(
    upload: UploadFile,
    subdir: str,
    filename_prefix: str,
) -> str:
    """
    Saves an uploaded image to the local disk and returns the relative URL.
    """
    content_type = getattr(upload, "content_type", "") or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        logger.error(f"Invalid content type: {content_type}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PNG, JPEG, or WEBP images are allowed.",
        )

    original_name = Path(upload.filename or "image.jpg").name
    safe_name = re.sub(r"[^a-zA-Z0-9_.-]", "_", original_name)
    timestamp = int(time.time() * 1000)
    
    # Ensure directory exists
    target_dir = UPLOADS_ROOT / subdir if subdir else UPLOADS_ROOT
    target_dir.mkdir(parents=True, exist_ok=True)
    
    filename = f"{filename_prefix}_{timestamp}_{safe_name}"
    dest_path = target_dir / filename

    total = 0
    try:
        with dest_path.open("wb") as buffer:
            while True:
                # Use async read
                chunk = await upload.read(1024 * 64)
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_IMAGE_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Image exceeds 10 MB size limit.",
                    )
                buffer.write(chunk)
        
        logger.info(f"Saved file to {dest_path} (Size: {total} bytes)")
    except Exception as e:
        if dest_path.exists():
            dest_path.unlink()
        if isinstance(e, HTTPException):
            raise e
        logger.exception("Failed to save upload")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error saving file.",
        )

    rel_parts = ["static", "uploads"]
    if subdir:
        rel_parts.append(subdir)
    rel_parts.append(filename)
    return "/" + "/".join(rel_parts)


async def save_uploaded_file(
    upload: UploadFile,
    subdir: str,
    filename_prefix: str,
) -> str:
    content_type = getattr(upload, "content_type", "") or ""
    if content_type not in ALLOWED_DOCUMENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PNG, JPEG, or PDF files are allowed.",
        )

    original_name = Path(upload.filename or "file").name
    safe_name = re.sub(r"[^a-zA-Z0-9_.-]", "_", original_name)
    timestamp = int(time.time() * 1000)
    target_dir = UPLOADS_ROOT / subdir if subdir else UPLOADS_ROOT
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{filename_prefix}_{timestamp}_{safe_name}"
    dest_path = target_dir / filename

    total = 0
    try:
        with dest_path.open("wb") as buffer:
            while True:
                chunk = await upload.read(1024 * 64)
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_DOCUMENT_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="File exceeds 10 MB size limit.",
                    )
                buffer.write(chunk)
    except Exception as e:
        if dest_path.exists():
            dest_path.unlink()
        if isinstance(e, HTTPException):
            raise e
        logger.exception("Failed to save file")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error saving file.",
        )

    rel_parts = ["static", "uploads"]
    if subdir:
        rel_parts.extend(subdir.split("/"))
    rel_parts.append(filename)
    return "/" + "/".join(rel_parts)


def delete_uploaded_file(served_path: str | None) -> None:
    if not served_path or not served_path.startswith("/static/uploads/"):
        return
    relative = served_path.removeprefix("/static/")
    target = STATIC_ROOT / relative
    try:
        target.relative_to(UPLOADS_ROOT)
    except ValueError:
        return
    target.unlink(missing_ok=True)


async def save_uploaded_document_to_mobile_assets(
    upload: UploadFile,
    filename_prefix: str,
) -> str:
    """
    Save an uploaded nomination document under mobile/assets/images.

    Returns the backend-served path mounted at /mobile-assets/images/<file>.
    """
    content_type = getattr(upload, "content_type", "") or ""
    if content_type not in ALLOWED_DOCUMENT_TYPES:
        logger.error(f"Invalid document content type: {content_type}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PNG, JPEG, or PDF files are allowed.",
        )

    original_name = Path(upload.filename or "document").name
    safe_name = re.sub(r"[^a-zA-Z0-9_.-]", "_", original_name)
    timestamp = int(time.time() * 1000)

    MOBILE_ASSETS_IMAGES_ROOT.mkdir(parents=True, exist_ok=True)
    filename = f"{filename_prefix}_{timestamp}_{safe_name}"
    dest_path = MOBILE_ASSETS_IMAGES_ROOT / filename

    total = 0
    try:
        with dest_path.open("wb") as buffer:
            while True:
                chunk = await upload.read(1024 * 64)
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_DOCUMENT_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Document exceeds 10 MB size limit.",
                    )
                buffer.write(chunk)

        logger.info(f"Saved nomination document to {dest_path} (Size: {total} bytes)")
    except Exception as e:
        if dest_path.exists():
            dest_path.unlink()
        if isinstance(e, HTTPException):
            raise e
        logger.exception("Failed to save nomination document")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error saving document.",
        )

    return f"/mobile-assets/images/{filename}"
