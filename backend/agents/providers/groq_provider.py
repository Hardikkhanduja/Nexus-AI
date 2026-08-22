import os
import json

try:
    import requests
except ImportError:  # Graceful fallback for environments where requests isn't installed
    class _RequestsStub:
        def post(self, *args, **kwargs):
            raise ImportError("requests library is required to perform HTTP calls")

    requests = _RequestsStub()


class GroqProvider:
    name = "Groq"

    async def generate(self, prompt, context=None, system_prompt=None):
        return "Provider is not configured in this environment."

    async def stream(self, prompt, context=None, system_prompt=None):
        yield "Provider is not configured in this environment."
