import ollama

print("Sending request to Ollama...")

response = ollama.chat(
    model="phi3",
    messages=[
        {"role": "user", "content": "Generate one interview question about REST API"}
    ]
)

print("Raw Response:")
print(response)

print("\nExtracted Content:")

if isinstance(response, dict):
    message = response.get("message", {})
    print(message.get("content", "NO CONTENT FOUND"))
else:
    print("Unexpected response format")