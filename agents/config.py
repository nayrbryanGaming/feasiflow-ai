import os
from groq import Groq
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is required. Set it in agents/.env or system environment.")
# Strip BOM / zero-width / stray whitespace that can sneak into env vars.
GROQ_API_KEY = GROQ_API_KEY.strip().lstrip("﻿")

# NOTE: deepseek-r1-distill-llama-70b was decommissioned by Groq.
PRIMARY_MODEL = "llama-3.3-70b-versatile"
FALLBACK_MODEL = "openai/gpt-oss-120b"
FAST_MODEL = "llama-3.1-8b-instant"

groq_client = Groq(api_key=GROQ_API_KEY)


def call_groq(
    messages: list,
    model: str = PRIMARY_MODEL,
    temperature: float = 0.7,
    max_tokens: int = 4096,
    json_mode: bool = True
) -> tuple[str, int]:
    """Call Groq API with retry. Returns (content, tokens_used)."""

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def _call(m):
        kwargs = {
            "model": m,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        response = groq_client.chat.completions.create(**kwargs)
        content = response.choices[0].message.content
        tokens = response.usage.total_tokens if response.usage else 0
        return content, tokens

    try:
        return _call(model)
    except Exception:
        try:
            return _call(FALLBACK_MODEL)
        except Exception as e:
            raise RuntimeError(f"Both primary and fallback models failed: {e}")
