import ollama
import json

print("Sending request to Ollama...")

response = ollama.chat(
    model="phi3",
    messages=[{"role": "user", "content": "Generate one interview question about REST API"}]
)

print("\nFULL RESPONSE:")
print(response)

print("\nRESPONSE TYPE:")
print(type(response))

try:
    print("\nMESSAGE FIELD:")
    print(response.get("message"))
except Exception as e:
    print("Error reading message:", e)

try:
    print("\nRESPONSE FIELD:")
    print(response.get("response"))
except Exception as e:
    print("Error reading response:", e)