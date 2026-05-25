from pathlib import Path
import re
import time

from fastapi import HTTPException, UploadFile, status


BACKEND_ROOT = Path(__file__).resolve().parents[2]
STATIC_ROOT = BACKEND_ROOT / "static"
UPLOADS_ROOT = STATIC_ROOT / "uploads"
ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg"}
MAX_IMAGE_SIZE = 2 * 1024 * 1024


def save_uploaded_image(
    upload: UploadFile,
    subdir: str,
    filename_prefix: str,
) -> str:
    content_type = getattr(upload, "content_type", "") or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PNG/JPEG images are allowed.",
        )

    original_name = Path(upload.filename or "image").name
    safe_name = re.sub(r"[^a-zA-Z0-9_.-]", "_", original_name)
    timestamp = int(time.time() * 1000)
    target_dir = UPLOADS_ROOT / subdir if subdir else UPLOADS_ROOT
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{filename_prefix}_{timestamp}_{safe_name}"
    dest_path = target_dir / filename

    total = 0
    with dest_path.open("wb") as buffer:
        while True:
            chunk = upload.file.read(1024 * 64)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_IMAGE_SIZE:
                buffer.close()
                dest_path.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Image exceeds 2 MB size limit.",
                )
            buffer.write(chunk)

    rel_parts = ["static", "uploads"]
    if subdir:
        rel_parts.append(subdir)
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
