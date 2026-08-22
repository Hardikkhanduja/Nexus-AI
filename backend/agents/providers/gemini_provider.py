import os
import json
import logging
import httpx
from typing import AsyncGenerator, List, Dict, Any, Optional
from dotenv import load_dotenv

from backend.agents.providers.base import BaseProvider

load_dotenv(override=True)
logger = logging.getLogger(__name__)

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
            raise ValueError(f"[{self.name}] GEMINI_API_KEY is missing in environment.")

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

        async with httpx.AsyncClient(timeout=20.0) as client:
            for m in ["gemini-1.5-flash", "gemini-2.0-flash"]:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
                headers = {"Content-Type": "application/json"}

                try:
                    res = await client.post(url, headers=headers, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                return parts[0]["text"].strip()
                except Exception as e:
                    logger.warning(f"Gemini model {m} generate error: {e}")
                    continue

        raise RuntimeError(f"Gemini API generation failed.")

    async def stream(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        api_key = self._get_api_key()
        if not api_key:
            yield f"[{self.name} Stream Error: GEMINI_API_KEY missing]."
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

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                for m in ["gemini-1.5-flash", "gemini-2.0-flash"]:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:streamGenerateContent?key={api_key}&alt=sse"
                    headers = {"Content-Type": "application/json"}

                    try:
                        async with client.stream("POST", url, headers=headers, json=payload) as response:
                            if response.status_code == 200:
                                async for line in response.aiter_lines():
                                    if line.startswith("data: "):
                                        data_json = line[6:].strip()
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
                    except Exception as e:
                        logger.warning(f"Gemini streaming error for {m}: {e}")
                        continue
        except Exception as e:
            logger.error(f"Gemini stream exception: {e}")

        yield "[Gemini Stream Error: Connection failed. Please check GEMINI_API_KEY]."
