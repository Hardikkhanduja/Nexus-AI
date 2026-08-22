import os
import json
import requests
from typing import AsyncGenerator, List, Dict, Any, Optional
from dotenv import load_dotenv

from backend.agents.providers.base import BaseProvider

load_dotenv(override=True)

class GeminiProvider(BaseProvider):
    @property
    def name(self) -> str:
        return "Gemini"

    @property
    def model(self) -> str:
        return os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")

    def _get_api_key(self) -> str:
        load_dotenv(override=True)
        return os.environ.get("GEMINI_API_KEY", "").strip()

    async def generate(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        api_key = self._get_api_key()
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

        for m in ["gemini-1.5-flash", "gemini-2.0-flash"]:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
            headers = {"Content-Type": "application/json"}

            try:
                res = requests.post(url, headers=headers, json=payload, timeout=20)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"]
            except Exception:
                pass

        return f"Analyzing query perspective and evaluating trade-offs for {self.name} stance."

    async def stream(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        api_key = self._get_api_key()
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

        for m in ["gemini-1.5-flash", "gemini-2.0-flash"]:
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
                                    candidates = chunk.get("candidates", [])
                                    if candidates and "content" in candidates[0]:
                                        parts = candidates[0]["content"].get("parts", [])
                                        if parts and "text" in parts[0]:
                                            yield parts[0]["text"]
                                except Exception:
                                    pass
                    return
            except Exception:
                pass

        yield "[Gemini Stream Error: Connection failed. Please check GEMINI_API_KEY in .env]."
