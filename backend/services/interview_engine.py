from __future__ import annotations

import datetime
import os
import random
import uuid
from typing import Any

from gtts import gTTS

from .ai_service import AIQuestionGenerator
from .evaluation_service import EvaluationService

# Pool of behavioral / soft-skill interview topics.
# Used when interview_type is 'non_technical' or on behavioral turns in 'mixed'.
BEHAVIORAL_TOPICS = [
    "teamwork",
    "leadership",
    "conflict resolution",
    "time management",
    "problem-solving",
    "communication skills",
    "adaptability",
    "initiative & ownership",
    "critical thinking",
    "decision making under pressure",
    "handling failure",
    "working under tight deadlines",
    "collaboration across teams",
    "goal setting & prioritisation",
    "giving & receiving feedback",
]

class InterviewEngine:

    def __init__(self) -> None:
        self.ai_generator = AIQuestionGenerator()
        self.interview_context: dict[str, Any] = {}

        self.interview_context = {
            "candidate_profile": {},
            "resume_data": {},
            "company": "Generic Tech Company",
            "interview_type": "mixed",
            "mode": "text",
            "question_history": [],
            "answers": [],
            "analysis_history": [],
            "skill_index": 0,   # round-robin pointer
        }

    def configure_interview(self, company, interview_type, mode="text"):

        if not company:
            company = "Generic Tech Company"

        if interview_type not in ["technical", "non_technical", "mixed"]:
            interview_type = "mixed"

        self.interview_context["company"] = company
        self.interview_context["interview_type"] = interview_type
        self.interview_context["mode"] = mode

        return {
            "status": "configured",
            "company": company,
            "interview_type": interview_type,
            "mode": mode,
        }

    def start_interview(self, profile, resume):

        company = self.interview_context.get("company", "Generic Tech Company")
        interview_type = self.interview_context.get("interview_type", "mixed")
        mode = self.interview_context.get("mode", "text")

        self.interview_context = {
            "candidate_profile": profile or {},
            "resume_data": resume or {},
            "company": company,
            "interview_type": interview_type,
            "mode": mode,
            "question_history": [],
            "answers": [],
            "analysis_history": [],
            "skill_index": 0,           # round-robin pointer
            "started_at": datetime.datetime.utcnow().isoformat(),  # for duration
        }

        return self.generate_next_question()

    def generate_next_question(self):

        # _determine_topic returns both the topic label and the effective
        # interview type so the AI knows whether to ask a technical or
        # behavioural question, regardless of the global interview_type.
        topic, effective_type = self._determine_topic()
        company = self.interview_context.get("company", "Generic Tech Company")

        question_text = self.ai_generator.generate_question(
            topic,
            resume_data=self.interview_context.get("resume_data"),
            company_pattern=company,
            interview_type=effective_type,
        )

        question_number = len(self.interview_context["question_history"]) + 1

        question_payload = {
            "topic": topic,
            "question": question_text,
            "question_number": question_number,
            "question_type": "primary",
            "effective_type": effective_type,   # stored for follow-up use
        }

        if self.interview_context.get("mode") == "voice":
            question_payload["audio_url"] = self._generate_audio(question_text)

        self.interview_context["question_history"].append(question_payload)

        return question_payload

    def process_candidate_answer(self, answer):

        question_history = self.interview_context["question_history"]
        answers = self.interview_context["answers"]
        analysis_history = self.interview_context["analysis_history"]

        if not question_history:
            return {
                "status": "error",
                "message": "No active question to answer.",
            }

        current_question = question_history[-1]

        question_text  = current_question["question"]
        topic          = current_question.get("topic", "general")
        # Inherit effective question type so follow-ups stay in the same interview mode
        effective_type = current_question.get("effective_type",
                         self.interview_context.get("interview_type", "mixed"))

        raw_analysis = self.ai_generator.analyze_answer(
            question_text,
            answer or ""
        )

        analysis = self._normalize_analysis(raw_analysis)

        answers.append({
            "topic": topic,
            "question": question_text,
            "answer": answer
        })

        analysis_history.append({
            "topic": topic,
            "question": question_text,
            "answer": answer,
            "analysis": analysis,
        })

        understanding = analysis["understanding"]

        if understanding in {"low", "partial"}:

            followup_question = self.ai_generator.generate_followup(
                topic,
                question_text,
                answer or ""
            )

            followup_payload = {
                "topic": topic,
                "question": followup_question,
                "question_number": len(question_history) + 1,
                "question_type": "followup",
                "effective_type": effective_type,
            }

            if self.interview_context.get("mode") == "voice":
                followup_payload["audio_url"] = self._generate_audio(followup_question)

            question_history.append(followup_payload)

            if len(question_history) >= 5:
                # End interview after sending followup response
                return {
                    "status": "completed",
                    "analysis": analysis,
                    "next_question": followup_payload,
                }

            return {
                "status": "followup_required",
                "analysis": analysis,
                "next_question": followup_payload,
            }

        if len(question_history) >= 5:
            # Reached exact limit (e.g. they answered question 5 well)
            return {
                "status": "completed",
                "analysis": analysis,
            }

        next_question = self.generate_next_question()

        return {
            "status": "next_topic",
            "analysis": analysis,
            "next_question": next_question,
        }

    def end_interview(self, user_email: str = ""):

        # Calculate how long the interview took
        started_at_str = self.interview_context.get("started_at")
        duration_seconds = 0
        if started_at_str:
            try:
                started_at = datetime.datetime.fromisoformat(started_at_str)
                duration_seconds = int(
                    (datetime.datetime.utcnow() - started_at).total_seconds()
                )
            except Exception:
                pass

        self.interview_context["duration_seconds"] = duration_seconds
        self.interview_context["user_email"] = user_email

        evaluation_service = EvaluationService()
        return evaluation_service.generate_report(self.interview_context)

    def _generate_audio(self, text: str) -> str:
        if not text:
            return ""
        filename = f"{uuid.uuid4().hex}.mp3"
        filepath = os.path.join("static", filename)
        tts = gTTS(text=text, lang='en')
        tts.save(filepath)
        return f"/static/{filename}"

    def _determine_topic(self) -> tuple[str, str]:
        """Return (topic_label, effective_interview_type) for the next question.

        Rules by interview_type
        -----------------------
        technical    → round-robin through the candidate's skills.
                        effective_type = 'technical'
        non_technical → random pick from BEHAVIORAL_TOPICS pool.
                        effective_type = 'non_technical'
        mixed        → alternates every primary question:
                          even turns  → technical skill (round-robin)
                          odd  turns  → behavioral topic (random)
        """
        profile       = self.interview_context.get("candidate_profile", {})
        resume        = self.interview_context.get("resume_data", {})
        interview_type = self.interview_context.get("interview_type", "mixed")

        skills = profile.get("skills") or resume.get("skills") or []
        has_skills = isinstance(skills, list) and bool(skills)

        # ── helpers ──────────────────────────────────────────────────────────
        def next_skill() -> str:
            idx   = self.interview_context.get("skill_index", 0)
            topic = skills[idx % len(skills)]
            self.interview_context["skill_index"] = idx + 1
            return topic

        def random_behavioral() -> str:
            return random.choice(BEHAVIORAL_TOPICS)

        # ── routing ──────────────────────────────────────────────────────────
        if interview_type == "technical":
            topic = next_skill() if has_skills else "general programming"
            return topic, "technical"

        if interview_type == "non_technical":
            return random_behavioral(), "non_technical"

        # mixed — alternate: technical on even primary counts, behavioral on odd
        primary_count = sum(
            1 for q in self.interview_context["question_history"]
            if q.get("question_type") == "primary"
        )
        if primary_count % 2 == 0:
            # Technical turn
            topic = next_skill() if has_skills else random_behavioral()
            return topic, "technical"
        else:
            # Behavioral turn
            return random_behavioral(), "non_technical"

    def _normalize_analysis(self, raw_analysis):

        default = {
            "understanding": "partial",
            "confidence": "medium",
            "followup_needed": True,
        }

        if isinstance(raw_analysis, dict):

            analysis = raw_analysis.get("analysis", raw_analysis)

            if not isinstance(analysis, dict):
                return default

            understanding = str(
                analysis.get("understanding", "partial")
            ).lower()

            confidence = str(
                analysis.get("confidence", "medium")
            ).lower()

            if understanding not in {"low", "partial", "good"}:
                understanding = "partial"

            if confidence not in {"low", "medium", "high"}:
                confidence = "medium"

            return {
                "understanding": understanding,
                "confidence": confidence,
                "followup_needed": understanding in {"low", "partial"},
            }

        return default
