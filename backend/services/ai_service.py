import json
import logging
import ollama

MODEL = "phi3"
FALLBACK_TEXT = "Unable to generate question right now. (Ollama is not running — please start Ollama and try again.)"
logger = logging.getLogger(__name__)


def check_ollama_running():
    """Check if Ollama is accessible. Logs a clear warning at startup if not."""
    try:
        ollama.chat(
            model=MODEL,
            messages=[{"role": "user", "content": "ping"}],
            options={"num_predict": 1},
        )
        logger.info("✅ Ollama is running and model '%s' is accessible.", MODEL)
        return True
    except Exception as exc:
        logger.warning(
            "⚠️  Ollama is NOT running or model '%s' is not available. "
            "AI features will be disabled until Ollama is started.\n"
            "  → Download & start Ollama from https://ollama.com/download\n"
            "  → Then run: ollama pull %s\n"
            "  Error: %s",
            MODEL, MODEL, exc,
        )
        return False


# Run health check once at import time so you know immediately on startup.
_ollama_available = check_ollama_running()


def safe_ollama_chat(prompt):
    """Safely call Ollama and retry once if the first attempt fails."""
    last_error = None

    for attempt in range(2):
        try:
            response = ollama.chat(
                model=MODEL,
                messages=[{"role": "user", "content": prompt}],
                options={"num_predict": 120},
            )

            content = _extract_response_content(response)

            if content:
                return content, None

            last_error = ValueError("Empty response content from Ollama")

            if attempt == 0:
                continue

        except ConnectionError as exc:
            last_error = exc
            logger.error(
                "❌ Ollama connection failed (attempt %d/2). "
                "Make sure Ollama is running: https://ollama.com/download",
                attempt + 1,
            )
            if attempt == 0:
                continue

        except Exception as exc:
            last_error = exc
            logger.exception("Ollama request failed (attempt %d/2): %s", attempt + 1, exc)
            if attempt == 0:
                continue

    error_type = _classify_ollama_error(last_error)
    logger.error("All Ollama attempts exhausted. Reason: %s", error_type)
    return FALLBACK_TEXT, error_type


class AIQuestionGenerator:

    def generate_question(self, topic, resume_data=None, company_pattern=None, interview_type="mixed"):

        company_name = company_pattern or "Generic Tech Company"
        normalized_type = (interview_type or "mixed").lower()

        if normalized_type not in {"technical", "non_technical", "mixed"}:
            normalized_type = "mixed"

        prompt_instruction = self._build_question_instruction(topic, normalized_type)

        prompt = f"""
You are an interviewer for {company_name}.

Interview type: {normalized_type}

Candidate resume:
{resume_data}

{prompt_instruction}
Return only the question. Keep it concise, under 25 words.
""".strip()

        text, _ = self._chat_text(prompt)

        return text

    def analyze_answer(self, question, answer):

        prompt = (
            "Evaluate this interview answer.\n"
            f"Question: {question}\n"
            f"Answer: {answer}\n\n"
            "Return JSON only:\n"
            '{"understanding":"low|partial|good","confidence":"low|medium|high","followup_needed":true|false}'
        )

        text, error = self._chat_text(prompt)

        if error:
            return {
                "understanding": "partial",
                "confidence": "medium",
                "followup_needed": True,
                "error": error,
            }

        try:

            clean_text = text.strip()

            start = clean_text.find("{")
            end = clean_text.rfind("}")

            if start != -1 and end != -1:
                clean_text = clean_text[start:end + 1]

            parsed = json.loads(clean_text)

            return parsed

        except Exception:

            return {
                "understanding": "partial",
                "confidence": "medium",
                "followup_needed": True,
                "error": "Invalid JSON returned by AI model",
            }

    def generate_followup(self, topic, question, answer):

        prompt = (
            f"Ask one concise follow-up interview question about {topic}. "
            f"Original question: {question}. Answer: {answer}. "
            "Return only the follow-up question. Keep it under 25 words."
        )

        text, _ = self._chat_text(prompt)

        return text

    def _build_question_instruction(self, topic, interview_type):

        if interview_type == "technical":
            return f"Generate one technical interview question about {topic}."

        if interview_type == "non_technical":
            return "Generate one behavioral interview question."

        return "Generate an interview question mixing technical and behavioral concepts."

    def _chat_text(self, prompt):

        return safe_ollama_chat(prompt)


def _extract_response_content(response):
    """Extract content from Ollama response."""

    # Handle ChatResponse object
    if hasattr(response, "message"):

        message = getattr(response, "message", None)

        if message and hasattr(message, "content"):
            return message.content.strip()

    # Handle dict responses
    if isinstance(response, dict):

        message = response.get("message")

        if isinstance(message, dict):

            content = message.get("content")

            if content:
                return content.strip()

        if response.get("response"):
            return response["response"].strip()

        if response.get("content"):
            return response["content"].strip()

    return ""


def _classify_ollama_error(exc):

    text = str(exc).lower() if exc else ""

    if "connection" in text:
        return "Ollama server is not running"

    if "model" in text:
        return "Model not found"

    if "timeout" in text:
        return "Network timeout"

    return "AI service unavailable"
