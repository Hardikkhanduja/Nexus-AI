import os
import json
import logging
import httpx
from typing import AsyncGenerator, List, Dict, Any, Optional
from dotenv import load_dotenv

from backend.agents.providers.base import BaseProvider

load_dotenv(override=True)
logger = logging.getLogger(__name__)

class AnthropicProvider(BaseProvider):
    @property
    def name(self) -> str:
        return "Anthropic Claude"

    @property
    def model(self) -> str:
        return os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")

    def _get_api_key(self) -> str:
        load_dotenv(override=True)
        return os.environ.get("ANTHROPIC_API_KEY", "").strip()

    async def generate(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        api_key = self._get_api_key()
        if not api_key:
            raise ValueError(f"[{self.name}] ANTHROPIC_API_KEY is missing in environment.")

        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }

        messages = []
        if context:
            for m in context[-4:]:
                messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "max_tokens": 1500,
            "messages": messages,
        }
        if system_prompt:
            payload["system"] = system_prompt

        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.post(url, headers=headers, json=payload)
            if res.status_code == 200:
                data = res.json()
                content_blocks = data.get("content", [])
                if content_blocks and "text" in content_blocks[0]:
                    return content_blocks[0]["text"].strip()
                return ""
            else:
                raise RuntimeError(f"Anthropic API Error ({res.status_code}): {res.text}")

    async def stream(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        api_key = self._get_api_key()
        if not api_key:
            yield f"[{self.name} Stream Error: ANTHROPIC_API_KEY missing]."
            return

        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }

        messages = []
        if context:
            for m in context[-4:]:
                messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "max_tokens": 2048,
            "messages": messages,
            "stream": True
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code == 200:
                        async for line in response.aiter_lines():
                            if line.startswith("data: "):
                                data_str = line[6:].strip()
                                try:
                                    chunk = json.loads(data_str)
                                    if chunk.get("type") == "content_block_delta":
                                        delta_text = chunk.get("delta", {}).get("text", "")
                                        if delta_text:
                                            yield delta_text
                                except Exception:
                                    pass
                    else:
                        yield f"[{self.name} API Error {response.status_code}]"
        except Exception as e:
            logger.error(f"Anthropic streaming error: {e}")
            yield f"[{self.name} Stream Error: {str(e)}]"
