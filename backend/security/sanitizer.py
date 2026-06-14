"""
Input sanitization and prompt injection detection.

All user inputs MUST pass through sanitize_input() before reaching any LLM.
"""

import re
from typing import Tuple

import bleach


# ── Prompt Injection Patterns ────────────────────────────────────

# Patterns that indicate adversarial prompt injection attempts.
# Each tuple: (compiled regex, human-readable description)
_INJECTION_PATTERNS: list[Tuple[re.Pattern[str], str]] = [
    (
        re.compile(r"ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|context)", re.IGNORECASE),
        "Attempt to override system instructions",
    ),
    (
        re.compile(r"(disregard|forget|override|bypass)\s+(all\s+)?(previous|prior|your|the)\s+(instructions?|prompts?|rules?|guidelines?|constraints?)", re.IGNORECASE),
        "Attempt to override system instructions",
    ),
    (
        re.compile(r"you\s+are\s+now\s+(a|an|the)\s+", re.IGNORECASE),
        "Role-play injection attack",
    ),
    (
        re.compile(r"(system\s*prompt|system\s*message|system\s*instruction)\s*[:=]", re.IGNORECASE),
        "System prompt injection",
    ),
    (
        re.compile(r"(reveal|show|display|print|output|tell\s+me)\s+(your|the)\s+(system\s*prompt|instructions?|rules?|guidelines?|initial\s*prompt)", re.IGNORECASE),
        "System prompt extraction attempt",
    ),
    (
        re.compile(r"\[SYSTEM\]|\[INST\]|<<SYS>>|<\|system\|>|<\|im_start\|>", re.IGNORECASE),
        "Delimiter injection (model-specific tokens)",
    ),
    (
        re.compile(r"(act|behave|respond|pretend)\s+(as\s+if|like)\s+you\s+(are|were|have)\s+(no|without)\s+(restrictions?|limitations?|filters?|guardrails?|safety)", re.IGNORECASE),
        "Jailbreak attempt",
    ),
    (
        re.compile(r"(DAN|do\s+anything\s+now|developer\s+mode|god\s+mode|sudo\s+mode)", re.IGNORECASE),
        "Known jailbreak technique",
    ),
]


class SecurityError(Exception):
    """Raised when input fails security validation."""

    def __init__(self, message: str, pattern_description: str = ""):
        super().__init__(message)
        self.pattern_description = pattern_description


def sanitize_input(text: str) -> str:
    """
    Sanitize user input before passing to an LLM.

    - Strips HTML tags and dangerous markup
    - Normalizes excessive whitespace
    - Trims to a reasonable length (10,000 chars)
    - Checks for prompt injection patterns

    Args:
        text: Raw user input.

    Returns:
        Sanitized text.

    Raises:
        SecurityError: If a prompt injection pattern is detected.
    """
    if not text or not text.strip():
        raise SecurityError("Empty input is not allowed.")

    # Strip HTML/script tags
    cleaned = bleach.clean(text, tags=[], attributes={}, strip=True)

    # Normalize whitespace (collapse multiple spaces/newlines)
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    cleaned = cleaned.strip()

    # Length limit
    max_length = 10_000
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length]

    # Check for prompt injection
    detected = detect_prompt_injection(cleaned)
    if detected:
        raise SecurityError(
            "Your message was flagged as a potential prompt injection attempt. "
            "Please rephrase your query.",
            pattern_description=detected,
        )

    return cleaned


def detect_prompt_injection(text: str) -> str | None:
    """
    Scan text for known prompt injection patterns.

    Args:
        text: The text to scan.

    Returns:
        Description of the matched pattern, or None if clean.
    """
    for pattern, description in _INJECTION_PATTERNS:
        if pattern.search(text):
            return description
    return None
