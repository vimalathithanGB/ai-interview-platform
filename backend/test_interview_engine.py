from services.interview_engine import InterviewEngine

# sample candidate profile
profile = {
    "name": "Arun Prakash",
    "skills": ["python", "django", "sql"],
    "target_role": "Software Engineer"
}

# sample resume data
resume = {
    "projects": ["Online Learning Platform", "E-Commerce Recommendation System"],
    "education": "B.E Computer Science",
    "experience": "Software Developer Intern"
}

# create controller
engine = InterviewEngine()

# start interview
engine.start_interview(profile, resume)

# generate first question
question = engine.generate_next_question()

print("\nQUESTION:")
print(question)

# simulate candidate answer
answer = "REST API uses HTTP methods like GET and POST"

# process answer
result = engine.process_candidate_answer(answer)

print("\nCONTROLLER RESULT:")
print(result)