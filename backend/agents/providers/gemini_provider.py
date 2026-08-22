import os
import json
import requests
from typing import AsyncGenerator, List, Dict, Any, Optional
from backend.agents.providers.base import BaseProvider

class GeminiProvider(BaseProvider):
    @property
    def name(self) -> str:
        return "Gemini"

    @property
    def model(self) -> str:
        return os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")

    async def generate(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            return f"[{self.name} Response: GEMINI_API_KEY is missing in your .env file]."

        combined_text = ""
        if system_prompt:
            combined_text += f"System Instruction: {system_prompt}\n\n"
        combined_text += prompt

        payload = {
            "contents": [
                {
                    "parts": [{"text": combined_text}]
                }
            ]
        }

        # Try gemini-1.5-flash first
        for m in [self.model, "gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
            headers = {"Content-Type": "application/json"}

            try:
                res = requests.post(url, headers=headers, json=payload, timeout=15)
                if res.status_code == 200:
                    data = res.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                else:
                    last_err = f"Status {res.status_code}: {res.text}"
            except Exception as e:
                last_err = str(e)

        return f"[Gemini API Error - {last_err}]"

    async def stream(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            yield "GEMINI_API_KEY is missing in your .env file."
            return

        combined_text = ""
        if system_prompt:
            combined_text += f"System Instruction: {system_prompt}\n\n"
        combined_text += prompt

        payload = {
            "contents": [
                {
                    "parts": [{"text": combined_text}]
                }
            ]
        }

        for m in [self.model, "gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:streamGenerateContent?key={api_key}&alt=sse"
            headers = {"Content-Type": "application/json"}

            try:
                res = requests.post(url, headers=headers, json=payload, stream=True, timeout=30)
                if res.status_code == 200:
                    for line in res.iter_lines():
                        if line:
                            line_str = line.decode('utf-8')
                            if line_str.startswith("data: "):
                                data_json = line_str[6:].strip()
                                try:
                                    chunk = json.loads(data_json)
                                    text = chunk["candidates"][0]["content"]["parts"][0].get("text", "")
                                    if text:
                                        yield text
                                except Exception:
                                    pass
                    return
                else:
                    last_err = f"Status {res.status_code}: {res.text}"
            except Exception as e:
                last_err = str(e)

        yield f"[Gemini Stream Error - {last_err}]"
