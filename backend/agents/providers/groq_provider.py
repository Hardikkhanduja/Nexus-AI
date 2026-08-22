import os
import json
import requests
from typing import AsyncGenerator, List, Dict, Any, Optional
from backend.agents.providers.base import BaseProvider

class GroqProvider(BaseProvider):
    @property
    def name(self) -> str:
        return "Groq"

    @property
    def model(self) -> str:
        # Standard rock-solid Groq text model
        return os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

    async def generate(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        api_key = os.environ.get("GROQ_API_KEY", "")
        if not api_key:
            return f"[{self.name} Response: GROQ_API_KEY is missing in your .env file]."

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        if context:
            for m in context[-4:]:
                messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})
        messages.append({"role": "user", "content": prompt})

        # Try models in fallback order
        for target_model in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-70b-8192"]:
            payload = {
                "model": target_model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 2048
            }

            try:
                res = requests.post(url, headers=headers, json=payload, timeout=15)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
            except Exception:
                pass

        return "[Groq Error: Could not connect to Groq models. Please check GROQ_API_KEY]."

    async def stream(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        api_key = os.environ.get("GROQ_API_KEY", "")
        if not api_key:
            yield "GROQ_API_KEY is missing in your .env file."
            return

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        if context:
            for m in context[-4:]:
                messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})
        messages.append({"role": "user", "content": prompt})

        for target_model in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-70b-8192"]:
            payload = {
                "model": target_model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 2048,
                "stream": True
            }

            try:
                res = requests.post(url, headers=headers, json=payload, stream=True, timeout=30)
                if res.status_code == 200:
                    for line in res.iter_lines():
                        if line:
                            line_str = line.decode('utf-8')
                            if line_str.startswith("data: "):
                                data_content = line_str[6:].strip()
                                if data_content == "[DONE]":
                                    break
                                try:
                                    chunk_json = json.loads(data_content)
                                    delta = chunk_json["choices"][0]["delta"].get("content", "")
                                    if delta:
                                        yield delta
                                except Exception:
                                    pass
                    return
            except Exception:
                pass

        yield "[Groq Stream Error: Unable to complete streaming request]."
