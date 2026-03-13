import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from database.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True, index=True)
    name = Column(String)
    skills = Column(String)
    experience = Column(String)
    project_name = Column(String)
    education = Column(String)
    other_details = Column(String)


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    skills = Column(Text)
    projects = Column(Text)
    experience = Column(Text)
    education = Column(Text)
    email = Column(String)
    phone = Column(String)


class InterviewHistory(Base):
    """One row per completed interview session, keyed by user_email."""
    __tablename__ = "interview_history"

    id                 = Column(Integer, primary_key=True, index=True)
    user_email         = Column(String, index=True, nullable=False)
    candidate_name     = Column(String, default="")
    date_taken         = Column(DateTime, default=datetime.datetime.utcnow)
    duration_seconds   = Column(Integer, default=0)
    total_questions    = Column(Integer, default=0)
    answered_questions = Column(Integer, default=0)
    average_score      = Column(Float, default=0.0)
    recommendation     = Column(String, default="")
    strengths          = Column(Text, default="[]")   # JSON list
    improvements       = Column(Text, default="[]")   # JSON list
    topics_covered     = Column(Text, default="[]")   # JSON list
    interview_type     = Column(String, default="mixed")
    company            = Column(String, default="")