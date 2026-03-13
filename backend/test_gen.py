from services.ai_service import AIQuestionGenerator

gen = AIQuestionGenerator()
try:
    q = gen.generate_question(topic="Python", resume_data="Experience with Python and FastAPI")
    print(f"Generated Question: {q}")
except Exception as e:
    print(f"Error: {e}")
