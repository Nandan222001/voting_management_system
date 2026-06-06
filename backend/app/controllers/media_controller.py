from fastapi import APIRouter, Depends, UploadFile, File, status
from fastapi.responses import JSONResponse
from app.utils.uploads import save_uploaded_document_to_mobile_assets, save_uploaded_file, save_uploaded_image
from app.utils.response import success_response

router = APIRouter(prefix="/media", tags=["Media / Uploads"])

@router.post("/upload", summary="Upload a file and get its public URL")
async def upload_file(
    file: UploadFile = File(...),
) -> JSONResponse:
    """
    General purpose upload endpoint. Currently supports images.
    Returns the public URL of the uploaded file.
    """
    # For now, we use save_uploaded_image. 
    # We can expand this to handle PDFs etc.
    url = await save_uploaded_image(file, subdir="kyc", filename_prefix="kyc_doc")
    return success_response(data={"url": url}, message="File uploaded successfully.")


@router.post("/upload-nomination-document", summary="Upload nomination image/PDF document")
async def upload_nomination_document(
    file: UploadFile = File(...),
) -> JSONResponse:
    """
    Stores nomination documents in mobile/assets/images and returns a served path.
    """
    url = await save_uploaded_document_to_mobile_assets(
        file,
        filename_prefix="nomination_doc",
    )
    return success_response(data={"url": url}, message="Nomination document uploaded successfully.")


@router.post("/upload-announcement-image", summary="Upload announcement image")
async def upload_announcement_image(
    file: UploadFile = File(...),
) -> JSONResponse:
    url = await save_uploaded_image(file, subdir="announcements", filename_prefix="announcement")
    return success_response(data={"url": url}, message="Announcement image uploaded successfully.")


@router.post("/upload-announcement-attachment", summary="Upload announcement attachment")
async def upload_announcement_attachment(
    file: UploadFile = File(...),
) -> JSONResponse:
    url = await save_uploaded_file(file, subdir="announcements/attachments", filename_prefix="announcement_attachment")
    return success_response(data={"url": url}, message="Announcement attachment uploaded successfully.")
