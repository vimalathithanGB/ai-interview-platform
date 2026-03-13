import re

from database.database import SessionLocal
from database.models import CandidateProfile


def save_or_update_profile(profile):
    db = SessionLocal()

    existing = db.query(CandidateProfile).first()

    if existing:
        existing.name = profile.get("name")
        existing.skills = ",".join(profile.get("skills", []))
        existing.projects = ",".join(profile.get("projects", []))
        existing.experience = profile.get("experience", "")
        existing.education = profile.get("education", "")
        existing.email = profile.get("email", "")
        existing.phone = profile.get("phone", "")
    else:
        new_profile = CandidateProfile(
            name=profile.get("name"),
            skills=",".join(profile.get("skills", [])),
            projects=",".join(profile.get("projects", [])),
            experience=profile.get("experience", ""),
            education=profile.get("education", ""),
            email=profile.get("email", ""),
            phone=profile.get("phone", ""),
        )
        db.add(new_profile)

    db.commit()
    db.close()


def get_profile():
    db = SessionLocal()
    profile = db.query(CandidateProfile).first()
    db.close()
    return profile


def extract_contact_details(other_details):
    email_match = re.search(r"Email:\s*([^\s]+)", other_details or "")
    phone_match = re.search(r"Phone:\s*(.+)$", other_details or "")

    return {
        "email": email_match.group(1).strip() if email_match else "",
        "phone": phone_match.group(1).strip() if phone_match else "",
    }