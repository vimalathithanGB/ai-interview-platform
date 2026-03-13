import ollama

def _extract_response_content(response):
    """Extract content from Ollama response."""

    # Handle ChatResponse object
    if hasattr(response, "message"):
        print("Has message attribute")
        message = getattr(response, "message", None)
        print(f"Message type: {type(message)}")

        if message and hasattr(message, "content"):
            print("Message has content attribute")
            return message.content.strip()
        else:
            print("Message does NOT have content attribute")

    # Handle dict responses
    if isinstance(response, dict):
        print("Is dict")
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

try:
    response = ollama.chat(model='phi3', messages=[{'role': 'user', 'content': 'hi'}])
    print(f"Response type: {type(response)}")
    content = _extract_response_content(response)
    print(f"Extracted content: '{content}'")
except Exception as e:
    print(f"Error: {e}")