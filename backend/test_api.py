import requests
import time

try:
    print("Testing /interview/start...")
    start = time.time()
    response = requests.post(
        'http://localhost:8000/interview/start',
        json={
            'profile': {'name': 'Test', 'skills': ['React'], 'target_role': 'Dev'},
            'resume': {'projects': [], 'education': '', 'experience': ''}
        },
        timeout=10
    )
    duration = time.time() - start
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print(f"Time taken: {duration:.2f}s")
except Exception as e:
    print(f"Error: {e}")
