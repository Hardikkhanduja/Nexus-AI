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
        key = os.environ.get("GEMINI_API_KEY", "").strip()
        if key:
            prefix = key[:4]
            suffix = key[-4:] if len(key) >= 8 else key
            logger.info(f"GEMINI_API_KEY found: {prefix}...{suffix}")
        else:
            logger.error("GEMINI_API_KEY: NOT SET")
        return key

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

        # Confirmed live Gemini model IDs
        live_gemini_models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-lite"]

        async with httpx.AsyncClient(timeout=20.0) as client:
            for m in live_gemini_models:
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
                    else:
                        logger.error(
                            f"[DIAGNOSTIC ERROR] Gemini generate failed on model '{m}'. "
                            f"HTTP Status: {res.status_code}, Response Body: {res.text}"
                        )
                except Exception as e:
                    logger.error(
                        f"[DIAGNOSTIC EXCEPTION] Gemini generate exception on model '{m}': "
                        f"Type: {type(e).__name__}, Message: {str(e)}",
                        exc_info=True
                    )
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

        live_gemini_models = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-lite"]

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                for m in live_gemini_models:
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
                            else:
                                error_body = await response.aread()
                                logger.error(
                                    f"[DIAGNOSTIC ERROR] Gemini stream failed on model '{m}'. "
                                    f"HTTP Status: {response.status_code}, Response Body: {error_body.decode('utf-8', errors='ignore')}"
                                )
                    except Exception as e:
                        logger.error(
                            f"[DIAGNOSTIC EXCEPTION] Gemini stream error for model '{m}': "
                            f"Type: {type(e).__name__}, Message: {str(e)}",
                            exc_info=True
                        )
                        continue
        except Exception as e:
            logger.error(f"[DIAGNOSTIC EXCEPTION] Gemini outer stream exception: Type: {type(e).__name__}, Message: {str(e)}", exc_info=True)

        yield "[Gemini Stream Error: Connection failed. Please check GEMINI_API_KEY]."
