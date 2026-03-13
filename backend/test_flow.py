import requests
import time

BASE_URL = "http://localhost:8000/interview"

def run_test():
    print("1. Configuring interview for 'voice' mode...")
    requests.post(f"{BASE_URL}/configure", json={
        "company": "TestCorp",
        "interview_type": "mixed",
        "mode": "voice"
    })

    print("2. Starting interview...")
    start_time = time.time()
    res = requests.post(f"{BASE_URL}/start", json={
        "profile": {"name": "Alice", "skills": ["Python"], "target_role": "Backend Dev"},
        "resume": {"projects": [], "education": "BSc", "experience": "2 years"}
    }).json()
    duration = time.time() - start_time
    
    print(f"Gen Time: {duration:.2f}s")
    print(f"Question 1: {res.get('question')}")
    print(f"Audio URL: {res.get('audio_url')}")
    assert "audio_url" in res, "No audio URL for first question"
    assert res.get("question_number") == 1, "Question number mismatch"

    # Answer questions until completed
    for i in range(2, 7):
        print(f"\nSubmitting Answer to Q{i-1}...")
        answer_res = requests.post(f"{BASE_URL}/answer", params={"answer": "This is a good, complete answer."}).json()
        
        status = answer_res.get("status")
        print(f"Status: {status}")
        
        if status == "completed":
            print("Interview correctly completed!")
            assert i == 6, f"Interview stopped at question {i-1} instead of after 5 questions"
            break
            
        next_q = answer_res.get("next_question", {})
        print(f"Question {next_q.get('question_number')}: {next_q.get('question')}")
        print(f"Audio URL: {next_q.get('audio_url')}")
        assert "audio_url" in next_q, "No audio URL for next question"

    print("\n3. Ending interview and getting report...")
    report = requests.post(f"{BASE_URL}/end").json()
    print(f"Report URL: {report.get('report_url')}")
    assert "report_url" in report, "No PDF report URL generated"

    print("VERIFICATION COMPLETED SUCCESSFULLY.")

if __name__ == "__main__":
    run_test()
