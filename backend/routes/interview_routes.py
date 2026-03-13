import json
from typing import List, Literal

from fastapi import APIRouter
from pydantic import BaseModel
from services.interview_engine import InterviewEngine
from database.database import SessionLocal
from database.models import InterviewHistory


router = APIRouter(prefix="/interview", tags=["Interview"])

engine = InterviewEngine()


class ProfileRequest(BaseModel):
    name: str
    skills: List[str]
    target_role: str


class ResumeRequest(BaseModel):
    projects: List[str]
    education: str
    experience: str


class InterviewConfigRequest(BaseModel):
    company: str
    interview_type: Literal["technical", "non_technical", "mixed"]
    mode: Literal["text", "voice"] = "text"

class StartInterviewRequest(BaseModel):
    profile: ProfileRequest
    resume: ResumeRequest


@router.get("/health")
def health():
    return {"status": "Interview service running"}


@router.post("/configure")
def configure_interview(request: InterviewConfigRequest):
    return engine.configure_interview(
        request.company,
        request.interview_type,
        request.mode,
    )


@router.post("/start")
def start_interview(request: StartInterviewRequest):
    return engine.start_interview(
        request.profile.dict(),
        request.resume.dict(),
    )


@router.post("/answer")
def answer_question(answer: str):
    return engine.process_candidate_answer(answer)


@router.post("/end")
def end_interview(user_email: str = ""):
    """End interview and save to history if user_email is provided."""
    return engine.end_interview(user_email=user_email)


@router.get("/history")
def get_interview_history(email: str):
    """Return all past interview sessions for a given user email."""
    db = SessionLocal()
    try:
        records = (
            db.query(InterviewHistory)
            .filter(InterviewHistory.user_email == email)
            .order_by(InterviewHistory.date_taken.desc())
            .all()
        )
        result = []
        for r in records:
            result.append({
                "id": r.id,
                "candidate_name": r.candidate_name,
                "date_taken": r.date_taken.isoformat() if r.date_taken else None,
                "duration_seconds": r.duration_seconds or 0,
                "total_questions": r.total_questions or 0,
                "answered_questions": r.answered_questions or 0,
                "average_score": r.average_score or 0.0,
                "recommendation": r.recommendation or "",
                "strengths": json.loads(r.strengths or "[]"),
                "improvements": json.loads(r.improvements or "[]"),
                "topics_covered": json.loads(r.topics_covered or "[]"),
                "interview_type": r.interview_type or "mixed",
                "company": r.company or "",
            })
        return result
    finally:
        db.close()


@router.delete("/history")
def clear_interview_history(email: str):
    """Clear all interview history for a user (used when they want a fresh start)."""
    db = SessionLocal()
    try:
        db.query(InterviewHistory).filter(InterviewHistory.user_email == email).delete()
        db.commit()
        return {"status": "cleared"}
    finally:
        db.close()
