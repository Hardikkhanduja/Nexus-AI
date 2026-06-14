"""
Anthropic Claude provider implementation.
"""

import os
from typing import AsyncGenerator, List, Dict, Any, Optional

from anthropic import AsyncAnthropic

from .base import BaseProvider

# ── Constants ────────────────────────────────────────────────────

_PRIMARY_MODEL = "claude-sonnet-4-20250514"
_FAST_MODEL = "claude-3-haiku-20240307"  # For cheap tasks like title generation

SYSTEM_PROMPT_DEFAULT = (
    "You are Nexus AI, a helpful and knowledgeable AI assistant. "
    "You provide clear, accurate, and well-structured responses. "
    "Use markdown formatting when it improves readability."
)


class AnthropicProvider(BaseProvider):
    """Anthropic Claude provider using the official SDK."""

    def __init__(self) -> None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError(
                "ANTHROPIC_API_KEY environment variable is required for the Anthropic provider."
            )
        self._client = AsyncAnthropic(api_key=api_key)

    @property
    def name(self) -> str:
        return "Claude"

    @property
    def model(self) -> str:
        return _PRIMARY_MODEL

    def _build_messages(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
    ) -> List[Dict[str, str]]:
        messages: List[Dict[str, str]] = []
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
        messages = self._build_messages(prompt, context)
        response = await self._client.messages.create(
            model=_FAST_MODEL,
            system=system_prompt or SYSTEM_PROMPT_DEFAULT,
            messages=messages,  # type: ignore[arg-type]
            max_tokens=100,
            temperature=0.3,
        )
        # Extract text from content blocks
        text_parts = []
        for block in response.content:
            if hasattr(block, "text"):
                text_parts.append(block.text)
        return "".join(text_parts)

    async def stream(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        messages = self._build_messages(prompt, context)
        async with self._client.messages.stream(
            model=_PRIMARY_MODEL,
            system=system_prompt or SYSTEM_PROMPT_DEFAULT,
            messages=messages,  # type: ignore[arg-type]
            max_tokens=4096,
            temperature=0.7,
        ) as stream:
            async for text in stream.text_stream:
                yield text
