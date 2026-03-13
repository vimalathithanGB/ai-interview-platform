import logging
import re
from typing import Iterable

from pdfminer.high_level import extract_text

logger = logging.getLogger(__name__)

SKILL_KEYWORDS = {
    "python",
    "java",
    "c",
    "c++",
    "c#",
    "sql",
    "mysql",
    "postgresql",
    "mongodb",
    "fastapi",
    "django",
    "flask",
    "react",
    "node.js",
    "nodejs",
    "javascript",
    "typescript",
    "html",
    "css",
    "git",
    "github",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "machine learning",
    "deep learning",
    "nlp",
    "tensorflow",
    "pytorch",
    "pandas",
    "numpy",
    "scikit-learn",
    "rest api",
}

PROJECT_SECTION_HEADERS = {"projects", "project experience", "academic projects"}
EDUCATION_HEADERS = {"education", "academic background", "qualification", "qualifications"}
EXPERIENCE_HEADERS = {"experience", "work experience", "professional experience", "employment"}
SECTION_HEADERS = PROJECT_SECTION_HEADERS | EDUCATION_HEADERS | EXPERIENCE_HEADERS | {
    "skills",
    "technical skills",
    "summary",
    "profile",
    "certifications",
    "achievements",
}

EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
PHONE_REGEX = re.compile(
    r"(?:(?:\+?\d{1,3}[\s\-]?)?(?:\(?\d{2,5}\)?[\s\-]?)?\d[\d\s\-]{7,}\d)"
)
NAME_REGEX = re.compile(r"^[A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+){1,3}$")
EXPERIENCE_REGEX = re.compile(
    r"\b(\d+(?:\.\d+)?)\+?\s+(years?|yrs?)\b|\b(intern(ship)?|engineer|developer|analyst)\b",
    re.IGNORECASE,
)

_NLP = None
_SPACY_LOAD_ATTEMPTED = False


def extract_text_from_pdf(file_path: str) -> str:
    logger.debug("Extracting text from PDF: %s", file_path)
    text = extract_text(file_path)
    logger.debug("Extracted %s characters from %s", len(text or ""), file_path)
    return text or ""


def normalize_text(text: str) -> str:
    normalized = text.replace("\x0c", "\n")
    normalized = normalized.replace("\r", "\n")
    normalized = re.sub(r"[ \t]+", " ", normalized)
    normalized = re.sub(r"\n{2,}", "\n\n", normalized)
    return normalized.strip()


def parse_resume(file_path: str) -> dict:
    raw_text = extract_text_from_pdf(file_path)
    normalized_text = normalize_text(raw_text)

    if not normalized_text:
        logger.warning("No text extracted from resume PDF: %s", file_path)
        return _empty_resume_response()

    lines = _get_clean_lines(normalized_text)
    logger.debug("Normalized resume into %s non-empty lines", len(lines))

    email = extract_email(normalized_text)
    phone = extract_phone(normalized_text)
    name = extract_name(normalized_text, lines, email)
    skills = extract_skills(normalized_text)
    projects = extract_projects(lines)
    education = extract_education(lines)
    experience = extract_experience(lines)

    parsed = {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": skills,
        "experience": experience,
        "project_name": projects,
        "education": education,
        "other_details": _build_other_details(email, phone),
    }

    logger.debug("Parsed resume fields: %s", _summarize_parsed_fields(parsed))
    return parsed


def extract_name(text: str, lines: list[str], email: str) -> str:
    nlp = _get_spacy_nlp()
    if nlp:
        try:
            doc = nlp("\n".join(lines[:10]))
            for ent in doc.ents:
                candidate = ent.text.strip()
                if ent.label_ == "PERSON" and _is_reasonable_name(candidate, email):
                    logger.debug("Detected candidate name using spaCy: %s", candidate)
                    return candidate
        except Exception as exc:
            logger.exception("spaCy name extraction failed: %s", exc)

    for line in lines[:8]:
        candidate = _normalize_name_candidate(line)
        if _is_reasonable_name(candidate, email):
            logger.debug("Detected candidate name heuristically: %s", candidate)
            return candidate

    logger.debug("Could not detect candidate name")
    return ""


def extract_email(text: str) -> str:
    match = EMAIL_REGEX.search(text)
    email = match.group(0) if match else ""
    logger.debug("Extracted email: %s", email)
    return email


def extract_phone(text: str) -> str:
    match = PHONE_REGEX.search(text)
    if not match:
        logger.debug("No phone number detected")
        return ""

    phone = re.sub(r"\s+", " ", match.group(0)).strip(" ,.;")
    logger.debug("Extracted phone: %s", phone)
    return phone


def extract_skills(text: str) -> list[str]:
    lowered = f" {text.lower()} "
    found_skills: list[str] = []

    for skill in sorted(SKILL_KEYWORDS, key=len, reverse=True):
        pattern = rf"(?<!\w){re.escape(skill.lower())}(?!\w)"
        if re.search(pattern, lowered):
            found_skills.append(skill)

    logger.debug("Extracted %s skills", len(found_skills))
    return found_skills


def extract_projects(lines: list[str]) -> list[str]:
    project_lines = _extract_section_lines(lines, PROJECT_SECTION_HEADERS)
    if not project_lines:
        project_lines = [line for line in lines if _looks_like_project_line(line)]

    projects = _deduplicate(_clean_bullet_prefix(line) for line in project_lines)
    logger.debug("Extracted %s project entries", len(projects))
    return projects[:6]


def extract_education(lines: list[str]) -> str:
    education_lines = _extract_section_lines(lines, EDUCATION_HEADERS)
    if not education_lines:
        education_lines = [
            line
            for line in lines
            if any(
                keyword in line.lower()
                for keyword in ("b.tech", "b.e", "m.tech", "bsc", "msc", "degree", "university", "college")
            )
        ]

    education = " | ".join(_deduplicate(_clean_bullet_prefix(line) for line in education_lines))
    logger.debug("Extracted education text length: %s", len(education))
    return education


def extract_experience(lines: list[str]) -> str:
    experience_lines = _extract_section_lines(lines, EXPERIENCE_HEADERS)
    if not experience_lines:
        experience_lines = [line for line in lines if EXPERIENCE_REGEX.search(line)]

    experience = " | ".join(_deduplicate(_clean_bullet_prefix(line) for line in experience_lines))
    logger.debug("Extracted experience text length: %s", len(experience))
    return experience


def _get_clean_lines(text: str) -> list[str]:
    return [line.strip() for line in text.splitlines() if line.strip()]


def _get_spacy_nlp():
    global _NLP
    global _SPACY_LOAD_ATTEMPTED

    if _SPACY_LOAD_ATTEMPTED:
        return _NLP

    _SPACY_LOAD_ATTEMPTED = True
    try:
        import spacy

        _NLP = spacy.load("en_core_web_sm")
        logger.debug("Loaded spaCy model en_core_web_sm")
    except OSError as exc:
        logger.warning("spaCy model en_core_web_sm is unavailable: %s", exc)
        _NLP = None
    except ImportError as exc:
        logger.warning("spaCy is unavailable: %s", exc)
        _NLP = None

    return _NLP


def _extract_section_lines(lines: list[str], headers: set[str]) -> list[str]:
    capture = False
    collected: list[str] = []

    for line in lines:
        lowered = line.lower().strip(":").strip()
        if lowered in headers:
            capture = True
            continue
        if capture and lowered in SECTION_HEADERS:
            break
        if capture:
            cleaned = _clean_bullet_prefix(line)
            if cleaned:
                collected.append(cleaned)

    return collected


def _looks_like_project_line(line: str) -> bool:
    lowered = line.lower()
    if any(token in lowered for token in ("project", "developed", "built", "implemented", "created")):
        return True
    return bool(re.search(r"\b(app|system|portal|website|dashboard|platform)\b", lowered))


def _clean_bullet_prefix(line: str) -> str:
    return re.sub(r"^[\-\*\u2022\s]+", "", line).strip(" .")


def _normalize_name_candidate(line: str) -> str:
    line = _clean_bullet_prefix(line)
    line = re.sub(r"\b(email|phone|mobile|linkedin|github)\b.*$", "", line, flags=re.IGNORECASE).strip()
    return line


def _is_reasonable_name(value: str, email: str) -> bool:
    if not value or len(value) < 5 or len(value) > 60:
        return False
    if email and email.lower() in value.lower():
        return False
    lowered = value.lower()
    if any(token in lowered for token in ("resume", "curriculum", "vitae", "profile", "@", "http")):
        return False
    return bool(NAME_REGEX.match(value))


def _deduplicate(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        cleaned = value.strip()
        if not cleaned:
            continue
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        ordered.append(cleaned)
    return ordered


def _build_other_details(email: str, phone: str) -> str:
    details = []
    if email:
        details.append(f"Email: {email}")
    if phone:
        details.append(f"Phone: {phone}")
    return " ".join(details)


def _empty_resume_response() -> dict:
    return {
        "name": "",
        "email": "",
        "phone": "",
        "skills": [],
        "experience": "",
        "project_name": [],
        "education": "",
        "other_details": "",
    }


def _summarize_parsed_fields(parsed: dict) -> dict:
    return {
        "name": bool(parsed.get("name")),
        "email": bool(parsed.get("email")),
        "phone": bool(parsed.get("phone")),
        "skills_count": len(parsed.get("skills", [])),
        "project_count": len(parsed.get("project_name", [])),
        "has_experience": bool(parsed.get("experience")),
        "has_education": bool(parsed.get("education")),
    }