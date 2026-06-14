"""
Generic Gemini provider implementation.

This provider is a lightweight HTTP-based adapter that forwards requests to a
Gemini-compatible endpoint. It is intentionally implementation-agnostic so you
can point it at Google Cloud's Generative API proxy, a local shim, or any
service that accepts a simple JSON payload.

Environment variables:
- GEMINI_API_URL: Full URL to send generation requests to (required).
- GEMINI_API_KEY: Bearer API key for the service (required).
- GEMINI_MODEL: Optional model identifier to send (default: "gemini-default").

Note: This module avoids importing optional HTTP libraries at module import
time; imports are performed inside methods so the provider can be lazily
loaded without failing the whole application when dependencies are missing.
"""

import os
from typing import AsyncGenerator, List, Dict, Any, Optional

from .base import BaseProvider


_DEFAULT_MODEL = "gemini-default"
SYSTEM_PROMPT_DEFAULT = (
    "You are Nexus AI, a helpful and knowledgeable AI assistant. "
    "You provide clear, accurate, and well-structured responses. "
    "Use markdown formatting when it improves readability."
)


class GeminiProvider(BaseProvider):
    """Generic Gemini provider using an HTTP forwarder endpoint.

    This keeps the provider simple and avoids committing to a specific SDK.
    The endpoint must accept a POST with JSON containing at least `model` and
    `prompt`, and return JSON with the response text under a `text` or
    `output` key. Streaming endpoints that emit chunked text are also
    supported via HTTP chunked responses.
    """

    def __init__(self) -> None:
        self._api_url = os.environ.get("GEMINI_API_URL", "").strip()
        self._api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        self._model = os.environ.get("GEMINI_MODEL", _DEFAULT_MODEL).strip()

        if not self._api_url:
            raise ValueError("GEMINI_API_URL environment variable is required and must not be empty.")
        if not self._api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required and must not be empty.")

    @property
    def name(self) -> str:
        return "Gemini"

    @property
    def model(self) -> str:
        return self._model

    def _build_payload(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        return {
            "model": self._model,
            "system": system_prompt or SYSTEM_PROMPT_DEFAULT,
            "context": context or [],
            "prompt": prompt,
            "max_tokens": 1024,
        }

    async def generate(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        # Import httpx lazily so missing deps don't break import-time.
        import httpx

        payload = self._build_payload(prompt, context, system_prompt)
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(self._api_url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        # Support common response shapes
        if isinstance(data, dict):
            return (
                data.get("text")
                or data.get("output")
                or data.get("result")
                or data.get("response")
                or ""
            )
        if isinstance(data, list):
            return "\n".join(str(item) for item in data)
        return str(data)

    async def stream(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        import httpx

        payload = self._build_payload(prompt, context, system_prompt)
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        # Use a streaming request and yield text chunks as they arrive.
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", self._api_url, json=payload, headers=headers) as resp:
                resp.raise_for_status()
                async for chunk in resp.aiter_text():
                    if chunk is not None:
                        yield chunk
