import os
import json
import logging
import httpx
from typing import AsyncGenerator, List, Dict, Any, Optional
from dotenv import load_dotenv

from backend.agents.providers.base import BaseProvider

load_dotenv(override=True)
logger = logging.getLogger(__name__)

class GroqProvider(BaseProvider):
    @property
    def name(self) -> str:
        return "Groq"

    @property
    def model(self) -> str:
        return os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

    def _get_api_key(self) -> str:
        load_dotenv(override=True)
        return os.environ.get("GROQ_API_KEY", "").strip()

    async def generate(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        api_key = self._get_api_key()
        if not api_key:
            raise ValueError(f"[{self.name}] GROQ_API_KEY is missing in environment.")

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

        async with httpx.AsyncClient(timeout=20.0) as client:
            for target_model in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-70b-8192"]:
                payload = {
                    "model": target_model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 2048
                }

                try:
                    res = await client.post(url, headers=headers, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        return data["choices"][0]["message"]["content"].strip()
                except Exception as e:
                    logger.warning(f"Groq generate error on {target_model}: {e}")
                    continue

        raise RuntimeError("Groq API generation failed.")

    async def stream(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        api_key = self._get_api_key()
        if not api_key:
            yield f"[{self.name} Stream Error: GROQ_API_KEY missing]."
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

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                for target_model in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-70b-8192"]:
                    payload = {
                        "model": target_model,
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 2048,
                        "stream": True
                    }

                    try:
                        async with client.stream("POST", url, headers=headers, json=payload) as response:
                            if response.status_code == 200:
                                async for line in response.aiter_lines():
                                    if line.startswith("data: "):
                                        data_content = line[6:].strip()
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
                    except Exception as e:
                        logger.warning(f"Groq stream error on {target_model}: {e}")
                        continue
        except Exception as e:
            logger.error(f"Groq stream exception: {e}")

        yield "[Groq Stream: Completing multi-agent synthesis.]"
