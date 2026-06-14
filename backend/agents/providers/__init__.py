"""
Provider registry.

To add a new provider:
1. Create a file in this directory that subclasses `BaseProvider`
2. Import it below and add it to `_REGISTRY`

That's it — no changes to core logic needed.
"""

from typing import Dict, Optional
import logging

from .base import BaseProvider

logger = logging.getLogger(__name__)

# ── Registry ─────────────────────────────────────────────────────

_REGISTRY: Dict[str, type] = {}
_INSTANCES: Dict[str, BaseProvider] = {}


def _register_providers() -> None:
    """Lazy-load providers so missing API keys don't crash the entire app."""
    global _REGISTRY

    try:
        from .openai_provider import OpenAIProvider
        _REGISTRY["openai"] = OpenAIProvider
    except Exception as e:
        logger.warning(f"OpenAI provider unavailable: {e}")

    try:
        from .anthropic_provider import AnthropicProvider
        _REGISTRY["anthropic"] = AnthropicProvider
    except Exception as e:
        logger.warning(f"Anthropic provider unavailable: {e}")

    try:
        from .gemini_provider import GeminiProvider
        _REGISTRY["gemini"] = GeminiProvider
    except Exception as e:
        logger.warning(f"Gemini provider unavailable: {e}")


def get_provider(name: str) -> BaseProvider:
    """
    Get a provider instance by name.

    Args:
        name: Provider key — 'openai' or 'anthropic'

    Returns:
        A BaseProvider instance (singleton per name).

    Raises:
        ValueError: If the provider name is unknown or unavailable.
    """
    if not _REGISTRY:
        _register_providers()

    if name not in _REGISTRY:
        available = list(_REGISTRY.keys())
        raise ValueError(
            f"Unknown provider '{name}'. Available: {available}"
        )

    if name not in _INSTANCES:
        _INSTANCES[name] = _REGISTRY[name]()

    return _INSTANCES[name]


def list_providers() -> list[str]:
    """Return a list of available provider names."""
    if not _REGISTRY:
        _register_providers()
    return list(_REGISTRY.keys())
