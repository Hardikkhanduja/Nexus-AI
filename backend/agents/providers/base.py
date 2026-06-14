"""
Abstract base class for all AI providers.

To add a new provider:
1. Create a new file in this directory (e.g., `gemini_provider.py`)
2. Subclass `BaseProvider` and implement all abstract methods
3. Register it in `__init__.py`
"""

from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Any, Optional


class BaseProvider(ABC):
    """Every AI provider must implement this interface."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable name for the provider (e.g., 'GPT', 'Claude')."""
        ...

    @property
    @abstractmethod
    def model(self) -> str:
        """Model identifier used for API calls."""
        ...

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        """
        Generate a complete response (non-streaming).
        Used for short tasks like title generation.

        Args:
            prompt: The user's message.
            context: Previous messages in [{role, content}] format.
            system_prompt: Optional system instructions.

        Returns:
            Complete response text.
        """
        ...

    @abstractmethod
    async def stream(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Stream a response token-by-token.

        Args:
            prompt: The user's message.
            context: Previous messages in [{role, content}] format.
            system_prompt: Optional system instructions.

        Yields:
            Individual text tokens/chunks.
        """
        ...
        # This yield is needed to make the type checker happy with the
        # abstract async generator signature.
        yield ""  # pragma: no cover
