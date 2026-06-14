"""
OpenAI GPT provider implementation.
"""

import os
from typing import AsyncGenerator, List, Dict, Any, Optional

from openai import AsyncOpenAI

from .base import BaseProvider

# ── Constants ────────────────────────────────────────────────────

_PRIMARY_MODEL = "gpt-4o"
_FAST_MODEL = "gpt-4o-mini"  # For cheap tasks like title generation

SYSTEM_PROMPT_DEFAULT = (
    "You are Nexus AI, a helpful and knowledgeable AI assistant. "
    "You provide clear, accurate, and well-structured responses. "
    "Use markdown formatting when it improves readability."
)


class OpenAIProvider(BaseProvider):
    """OpenAI GPT provider using the official SDK."""

    def __init__(self) -> None:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY environment variable is required for the OpenAI provider."
            )
        self._client = AsyncOpenAI(api_key=api_key)

    @property
    def name(self) -> str:
        return "GPT"

    @property
    def model(self) -> str:
        return _PRIMARY_MODEL

    def _build_messages(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> List[Dict[str, str]]:
        messages: List[Dict[str, str]] = [
            {"role": "system", "content": system_prompt or SYSTEM_PROMPT_DEFAULT}
        ]
        if context:
            for msg in context:
                messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": prompt})
        return messages

    async def generate(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        messages = self._build_messages(prompt, context, system_prompt)
        response = await self._client.chat.completions.create(
            model=_FAST_MODEL,
            messages=messages,  # type: ignore[arg-type]
            max_tokens=100,
            temperature=0.3,
        )
        return response.choices[0].message.content or ""

    async def stream(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        messages = self._build_messages(prompt, context, system_prompt)
        stream = await self._client.chat.completions.create(
            model=_PRIMARY_MODEL,
            messages=messages,  # type: ignore[arg-type]
            max_tokens=4096,
            temperature=0.7,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content
