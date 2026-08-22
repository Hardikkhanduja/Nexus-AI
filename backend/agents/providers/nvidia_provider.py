import os
import json
import logging
import httpx
from typing import AsyncGenerator, List, Dict, Any, Optional
from dotenv import load_dotenv

from backend.agents.providers.base import BaseProvider

load_dotenv(override=True)
logger = logging.getLogger(__name__)

class NvidiaProvider(BaseProvider):
    @property
    def name(self) -> str:
        return "NVIDIA NIM (Qwen & Nemotron)"

    @property
    def model(self) -> str:
        return os.environ.get("NVIDIA_MODEL", "nvidia/nemotron-4-340b-instruct")

    def _get_api_key(self) -> str:
        load_dotenv(override=True)
        key = os.environ.get("NVIDIA_API_KEY", "").strip()
        if key:
            prefix = key[:4]
            suffix = key[-4:] if len(key) >= 8 else key
            logger.info(f"NVIDIA_API_KEY found: {prefix}...{suffix}")
        else:
            logger.error("NVIDIA_API_KEY: NOT SET")
        return key

    async def generate(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        api_key = self._get_api_key()
        if not api_key:
            raise ValueError(f"[{self.name}] NVIDIA_API_KEY is missing in environment.")

        url = "https://integrate.api.nvidia.com/v1/chat/completions"
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

        # Confirmed live NVIDIA NIM model IDs
        live_nvidia_models = [
            os.environ.get("NVIDIA_MODEL", "meta/llama-3.3-70b-instruct"),
            "meta/llama-3.1-70b-instruct",
            "nvidia/llama-3.1-nemotron-70b-instruct",
            "nvidia/nemotron-4-340b-instruct",
            "meta/llama-3.1-8b-instruct"
        ]

        async with httpx.AsyncClient(timeout=25.0) as client:
            for target_model in live_nvidia_models:
                payload = {
                    "model": target_model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1500
                }
                try:
                    res = await client.post(url, headers=headers, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        return data["choices"][0]["message"]["content"].strip()
                    else:
                        logger.error(
                            f"[DIAGNOSTIC ERROR] NVIDIA NIM generate failed on model '{target_model}'. "
                            f"HTTP Status: {res.status_code}, Response Body: {res.text}"
                        )
                except Exception as e:
                    logger.error(
                        f"[DIAGNOSTIC EXCEPTION] NVIDIA NIM generate exception on model '{target_model}': "
                        f"Type: {type(e).__name__}, Message: {str(e)}",
                        exc_info=True
                    )
                    continue

        raise RuntimeError("NVIDIA NIM API generation failed.")

    async def stream(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        api_key = self._get_api_key()
        if not api_key:
            yield f"[{self.name} Stream Error: NVIDIA_API_KEY missing]."
            return

        url = "https://integrate.api.nvidia.com/v1/chat/completions"
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

        live_nvidia_models = [
            os.environ.get("NVIDIA_MODEL", "meta/llama-3.3-70b-instruct"),
            "meta/llama-3.1-70b-instruct",
            "nvidia/llama-3.1-nemotron-70b-instruct",
            "nvidia/nemotron-4-340b-instruct",
            "meta/llama-3.1-8b-instruct"
        ]

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                for target_model in live_nvidia_models:
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
                                        data_str = line[6:].strip()
                                        if data_str == "[DONE]":
                                            break
                                        try:
                                            chunk = json.loads(data_str)
                                            delta = chunk["choices"][0]["delta"].get("content", "")
                                            if delta:
                                                yield delta
                                        except Exception:
                                            pass
                                return
                            else:
                                error_body = await response.aread()
                                logger.error(
                                    f"[DIAGNOSTIC ERROR] NVIDIA NIM stream failed on model '{target_model}'. "
                                    f"HTTP Status: {response.status_code}, Response Body: {error_body.decode('utf-8', errors='ignore')}"
                                )
                    except Exception as e:
                        logger.error(
                            f"[DIAGNOSTIC EXCEPTION] NVIDIA NIM streaming error on model '{target_model}': "
                            f"Type: {type(e).__name__}, Message: {str(e)}",
                            exc_info=True
                        )
                        continue
        except Exception as e:
            logger.error(f"[DIAGNOSTIC EXCEPTION] NVIDIA NIM outer stream exception: Type: {type(e).__name__}, Message: {str(e)}", exc_info=True)
            yield f"[{self.name} Stream Error: {str(e)}]"
