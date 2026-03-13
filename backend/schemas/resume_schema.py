from pydantic import BaseModel


class ResumeUploadResponse(BaseModel):
    message: str
    skills_found: list[str]