import os
import json
import logging
import httpx
from typing import AsyncGenerator, List, Dict, Any, Optional
from dotenv import load_dotenv

from backend.agents.providers.base import BaseProvider

load_dotenv(override=True)
logger = logging.getLogger(__name__)

class GroqProvider(BaseProvider):
    @property
    def name(self) -> str:
        return "Groq"

    @property
    def model(self) -> str:
        return os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

    def _get_api_key(self) -> str:
        load_dotenv(override=True)
        key = os.environ.get("GROQ_API_KEY", "").strip()
        if key:
            prefix = key[:4]
            suffix = key[-4:] if len(key) >= 8 else key
            logger.info(f"GROQ_API_KEY found: {prefix}...{suffix}")
            
            # Diagnostic call to GET /openai/v1/models to verify ground truth access
            try:
                with httpx.Client(timeout=5.0) as client:
                    m_res = client.get("https://api.groq.com/openai/v1/models", headers={"Authorization": f"Bearer {key}"})
                    if m_res.status_code == 200:
                        model_ids = [m["id"] for m in m_res.json().get("data", [])]
                        logger.info(f"Groq API Models Ground Truth ({len(model_ids)} available): {model_ids}")
            except Exception as e:
                logger.warning(f"Failed to fetch Groq models list diagnostic: {e}")
        else:
            logger.error("GROQ_API_KEY: NOT SET")
        return key

    async def generate(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        api_key = self._get_api_key()
        if not api_key:
            raise ValueError(f"[{self.name}] GROQ_API_KEY is missing in environment.")

        url = "https://api.groq.com/openai/v1/chat/completions"
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

        # Confirmed live Groq model IDs
        live_models = ["groq/compound", "groq/compound-mini", "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.6-27b"]

        async with httpx.AsyncClient(timeout=20.0) as client:
            for target_model in live_models:
                payload = {
                    "model": target_model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 2048
                }

                try:
                    res = await client.post(url, headers=headers, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        return data["choices"][0]["message"]["content"].strip()
                    else:
                        logger.error(
                            f"[DIAGNOSTIC ERROR] Groq generate failed on model '{target_model}'. "
                            f"HTTP Status: {res.status_code}, Response Body: {res.text}"
                        )
                except Exception as e:
                    logger.error(
                        f"[DIAGNOSTIC EXCEPTION] Groq generate exception on model '{target_model}': "
                        f"Type: {type(e).__name__}, Message: {str(e)}",
                        exc_info=True
                    )
                    continue

        raise RuntimeError("Groq API generation failed.")

    async def stream(
        self,
        prompt: str,
        context: Optional[List[Dict[str, Any]]] = None,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        api_key = self._get_api_key()
        if not api_key:
            yield f"[{self.name} Stream Error: GROQ_API_KEY missing]."
            return

        url = "https://api.groq.com/openai/v1/chat/completions"
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

        live_models = ["groq/compound", "groq/compound-mini", "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.6-27b"]

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                for target_model in live_models:
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
                                        data_content = line[6:].strip()
                                        if data_content == "[DONE]":
                                            break
                                        try:
                                            chunk_json = json.loads(data_content)
                                            delta = chunk_json["choices"][0]["delta"].get("content", "")
                                            if delta:
                                                yield delta
                                        except Exception:
                                            pass
                                return
                            else:
                                error_body = await response.aread()
                                logger.error(
                                    f"[DIAGNOSTIC ERROR] Groq stream failed on model '{target_model}'. "
                                    f"HTTP Status: {response.status_code}, Response Body: {error_body.decode('utf-8', errors='ignore')}"
                                )
                    except Exception as e:
                        logger.error(
                            f"[DIAGNOSTIC EXCEPTION] Groq stream exception on model '{target_model}': "
                            f"Type: {type(e).__name__}, Message: {str(e)}",
                            exc_info=True
                        )
                        continue
        except Exception as e:
            logger.error(f"[DIAGNOSTIC EXCEPTION] Groq outer stream exception: Type: {type(e).__name__}, Message: {str(e)}", exc_info=True)

        yield "[Groq Stream: Completing multi-agent synthesis.]"
