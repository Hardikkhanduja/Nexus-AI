"""
Provider registry for Nexus AI.
Supports API integrations for: Perplexity, Gemini, Groq (Llama), NVIDIA NIM (Qwen/Nemotron), OpenAI, Anthropic, DeepSeek.
"""

from typing import Dict, Optional, List
import logging

from .base import BaseProvider

logger = logging.getLogger(__name__)

# Registry mapping keys to provider classes
_REGISTRY: Dict[str, type] = {}
_INSTANCES: Dict[str, BaseProvider] = {}

def _register_providers() -> None:
    """Lazy-load providers so missing API keys or packages don't crash the app."""
    global _REGISTRY

    try:
        from .perplexity_provider import PerplexityProvider
        _REGISTRY["perplexity"] = PerplexityProvider
    except Exception as e:
        logger.warning(f"Perplexity provider unavailable: {e}")

    try:
        from .gemini_provider import GeminiProvider
        _REGISTRY["gemini"] = GeminiProvider
    except Exception as e:
        logger.warning(f"Gemini provider unavailable: {e}")

    try:
        from .groq_provider import GroqProvider
        _REGISTRY["groq"] = GroqProvider
    except Exception as e:
        logger.warning(f"Groq provider unavailable: {e}")

    try:
        from .nvidia_provider import NvidiaProvider
        _REGISTRY["nvidia"] = NvidiaProvider
        _REGISTRY["qwen"] = NvidiaProvider
        _REGISTRY["nemotron"] = NvidiaProvider
    except Exception as e:
        logger.warning(f"NVIDIA provider unavailable: {e}")

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
        from .deepseek_provider import DeepSeekProvider
        _REGISTRY["deepseek"] = DeepSeekProvider
    except Exception as e:
        logger.warning(f"DeepSeek provider unavailable: {e}")

def get_provider(name: str) -> BaseProvider:
    """
    Get a provider instance by name (with fallback to Perplexity/Gemini/Groq/NVIDIA).

    Args:
        name: Provider key ('perplexity', 'gemini', 'groq', 'nvidia', 'openai', 'anthropic')

    Returns:
        BaseProvider instance.
    """
    if not _REGISTRY:
        _register_providers()

    clean_name = name.lower().strip()

    if clean_name not in _REGISTRY:
        # Fallback to user's active providers
        for fallback_key in ["perplexity", "gemini", "groq", "nvidia"]:
            if fallback_key in _REGISTRY:
                logger.info(f"Requested provider '{clean_name}' unavailable. Routing to fallback '{fallback_key}'.")
                clean_name = fallback_key
                break

    if clean_name not in _INSTANCES:
        _INSTANCES[clean_name] = _REGISTRY[clean_name]()

    return _INSTANCES[clean_name]

def list_providers() -> List[str]:
    """Return a list of available provider names."""
    if not _REGISTRY:
        _register_providers()
    return list(_REGISTRY.keys())
