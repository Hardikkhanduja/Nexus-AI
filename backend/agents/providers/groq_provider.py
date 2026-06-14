import os
import requests
import json

response = requests.post(
  url="https://openrouter.ai/api/v1/chat/completions",
  headers={
    "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
    "Content-Type": "application/json",
  },
  data=json.dumps({
    "model": "x-ai/grok-imagine-image-quality",
    "messages": [
        {
          "role": "user",
          "content": "Generate a beautiful sunset over mountains"
        }
      ],
    "modalities": ["image"]
  })
)

result = response.json()

# The generated image will be in the assistant message
if result.get("choices"):
  message = result["choices"][0]["message"]
  if message.get("images"):
    for image in message["images"]:
      image_url = image["image_url"]["url"]  # Base64 data URL
      print(f"Generated image: {image_url[:50]}...")