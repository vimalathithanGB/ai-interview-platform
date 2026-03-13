import logging
import os
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile

from services.candidate_profile_builder import build_candidate_profile
from services.profile_service import extract_contact_details, save_or_update_profile
from services.resume_parser import parse_resume

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_FOLDER = "uploads"
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = {".pdf"}
ALLOWED_CONTENT_TYPES = {"application/pdf", "application/x-pdf"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...)):
    original_name = os.path.basename(file.filename or "")
    extension = os.path.splitext(original_name)[1].lower()
    if not extension:
        extension = ".pdf"

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    if file.content_type and file.content_type.lower() not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file content type")

    file_bytes = await file.read()
    await file.close()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 5 MB limit")

    # Basic signature check for PDF files.
    if not file_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid PDF")

    safe_filename = f"{uuid4().hex}{extension}"
    file_path = os.path.join(UPLOAD_FOLDER, safe_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(file_bytes)

    try:
        parsed = parse_resume(file_path)
        profile = build_candidate_profile(parsed)
        contact_details = extract_contact_details(parsed.get("other_details", ""))

        profile.update(
            {
                "experience": parsed.get("experience", ""),
                "education": parsed.get("education", ""),
                "email": contact_details.get("email", ""),
                "phone": contact_details.get("phone", ""),
            }
        )

        save_or_update_profile(profile)
    except Exception as exc:
        logger.exception("Failed to process uploaded resume: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to process resume") from exc

    return {
        "message": "Resume uploaded and profile stored",
        "profile": profile,
    }