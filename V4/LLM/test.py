import requests

response = requests.post(
    "http://localhost:11434/api/generate",
    json={
        "model": "llama3",
        "prompt": "Suggest a healthy meal with bananas, eggs, and milk for someone with peanut allergy",
        "stream": False
    }
)

print(response.json()["response"])
