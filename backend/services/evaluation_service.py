import datetime
import json
import os
import uuid
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from database.database import SessionLocal
from database.models import InterviewHistory

class EvaluationService:

    def generate_report(self, interview_context):

        context = interview_context or {}

        candidate_profile = context.get("candidate_profile") or {}
        resume_data = context.get("resume_data") or {}
        question_history = context.get("question_history") or []
        answers = context.get("answers") or []
        analysis_history = context.get("analysis_history") or []

        candidate_name = (
            candidate_profile.get("name")
            or resume_data.get("name")
            or resume_data.get("candidate_name")
            or ""
        )

        role = (
            candidate_profile.get("role")
            or candidate_profile.get("target_role")
            or resume_data.get("role")
            or resume_data.get("target_role")
            or ""
        )

        total_questions = len(question_history) if isinstance(question_history, list) else 0
        answered_questions = 0
        total_points = 0

        strengths = []
        weaknesses = []
        topics_covered = []

        seen_strengths = set()
        seen_weaknesses = set()
        seen_topics = set()

        score_map = {
            "good": 2,
            "partial": 1,
            "low": 0,
        }

        # Collect topics
        if isinstance(question_history, list):
            for item in question_history:

                topic = ""

                if isinstance(item, dict):
                    topic = item.get("topic") or ""
                elif isinstance(item, str):
                    topic = item

                if topic and topic not in seen_topics:
                    seen_topics.add(topic)
                    topics_covered.append(topic)

        # Process analysis history
        if isinstance(analysis_history, list):

            for item in analysis_history:

                if not isinstance(item, dict):
                    continue

                answer = item.get("answer")

                if answer not in (None, ""):
                    answered_questions += 1

                topic = item.get("topic") or ""

                if topic and topic not in seen_topics:
                    seen_topics.add(topic)
                    topics_covered.append(topic)

                analysis = item.get("analysis") or {}

                if not isinstance(analysis, dict):
                    analysis = {}

                understanding = str(
                    analysis.get("understanding") or ""
                ).strip().lower()

                total_points += score_map.get(understanding, 0)

                if understanding == "good" and topic and topic not in seen_strengths:
                    seen_strengths.add(topic)
                    strengths.append(topic)

                if understanding == "low" and topic and topic not in seen_weaknesses:
                    seen_weaknesses.add(topic)
                    weaknesses.append(topic)

        # fallback count
        if answered_questions == 0 and isinstance(answers, list):

            answered_questions = sum(
                1 for answer in answers if answer not in (None, "")
            )

        average_score = (
            total_points / answered_questions if answered_questions > 0 else 0.0
        )

        if average_score >= 1.5:
            recommendation = "Strong Hire"
        elif average_score >= 1.0:
            recommendation = "Hire"
        elif average_score >= 0.5:
            recommendation = "Consider"
        else:
            recommendation = "Reject"

        report = {
            "candidate_name": candidate_name,
            "role": role,
            "total_questions": total_questions,
            "answered_questions": answered_questions,
            "average_score": average_score,
            "recommendation": recommendation,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "topics_covered": topics_covered,
        }
        
        try:
            report_url = self._generate_pdf(report, context)
            report["report_url"] = report_url
        except Exception as e:
            print(f"Failed to generate PDF: {e}")

        # Persist to interview_history table (only when a user_email is present)
        self._save_to_history(report, context)

        return report

    def _save_to_history(self, report: dict, context: dict) -> None:
        """Write the finished interview to the DB. Silent on errors."""
        user_email = (context.get("user_email") or "").strip()
        if not user_email:
            return
        try:
            db = SessionLocal()
            entry = InterviewHistory(
                user_email         = user_email,
                candidate_name     = report.get("candidate_name", ""),
                date_taken         = datetime.datetime.utcnow(),
                duration_seconds   = context.get("duration_seconds", 0),
                total_questions    = report.get("total_questions", 0),
                answered_questions = report.get("answered_questions", 0),
                average_score      = report.get("average_score", 0.0),
                recommendation     = report.get("recommendation", ""),
                strengths          = json.dumps(report.get("strengths", [])),
                improvements       = json.dumps(report.get("weaknesses", [])),
                topics_covered     = json.dumps(report.get("topics_covered", [])),
                interview_type     = context.get("interview_type", "mixed"),
                company            = context.get("company", ""),
            )
            db.add(entry)
            db.commit()
            db.close()
        except Exception as exc:
            print(f"[history] Failed to save interview history: {exc}")

    def _generate_pdf(self, report, context):
        filename = f"report_{uuid.uuid4().hex}.pdf"
        filepath = os.path.join("static", filename)
        
        c = canvas.Canvas(filepath, pagesize=letter)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, 750, "Interview Evaluation Report")
        
        c.setFont("Helvetica", 12)
        y = 710
        
        c.drawString(50, y, f"Candidate Name: {report.get('candidate_name', 'N/A')}")
        y -= 20
        c.drawString(50, y, f"Role: {report.get('role', 'N/A')}")
        y -= 20
        c.drawString(50, y, f"Recommendation: {report.get('recommendation', 'N/A')}")
        y -= 20
        c.drawString(50, y, f"Questions Answered: {report.get('answered_questions', 0)} / {report.get('total_questions', 0)}")
        y -= 20
        c.drawString(50, y, f"Strengths: {', '.join(report.get('strengths', []))}")
        y -= 20
        c.drawString(50, y, f"Weaknesses: {', '.join(report.get('weaknesses', []))}")
        y -= 40
        
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y, "Interview Q&A")
        y -= 20
        
        c.setFont("Helvetica", 10)
        
        history = context.get("analysis_history", [])
        for item in history:
            if y < 100:
                c.showPage()
                c.setFont("Helvetica", 10)
                y = 750
                
            q = item.get("question", "")
            a = item.get("answer", "")
            analysis = item.get("analysis", {})
            understanding = analysis.get("understanding", "")
            
            c.drawString(50, y, f"Q: {q[:90]}" + ("..." if len(q) > 90 else ""))
            y -= 15
            c.drawString(50, y, f"A: {a[:90]}" + ("..." if len(a) > 90 else ""))
            y -= 15
            c.drawString(50, y, f"Eval -> Understanding: {understanding}")
            y -= 25
            
        c.save()
        return f"/static/{filename}"