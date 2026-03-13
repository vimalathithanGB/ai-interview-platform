try:
    from services.ai_service import AIQuestionGenerator
except ModuleNotFoundError:
    from ai_service import AIQuestionGenerator


def run_test():
    ai = AIQuestionGenerator()

    topic = "REST API"
    question = ai.generate_question(topic)

    print("\nQUESTION:")
    print(question)

    answer = "REST APIs use HTTP methods like GET and POST."
    analysis = ai.analyze_answer(question, answer)

    print("\nANALYSIS:")
    print(analysis)

    if analysis.get("followup_needed"):
        followup = ai.generate_followup(topic, question, answer)
        print("\nFOLLOW UP:")
        print(followup)


if __name__ == "__main__":
    run_test()