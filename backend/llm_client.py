import json
import os
import requests
from typing import List, Dict, Any, Optional

try:
    from dotenv import load_dotenv
    dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path, override=True)
    else:
        load_dotenv()
except ImportError:
    pass

DEFAULT_SYSTEM_KEY = ""
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Verified reliable fast generative models on OpenRouter
FALLBACK_MODELS = [
    "deepseek/deepseek-chat",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free"
]

OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "")
if not OPENROUTER_MODEL or OPENROUTER_MODEL in ["anthropic/claude-3.5-sonnet", "nvidia/nemotron-3.5-lightning:free", "openai/gpt-oss-20b:free"]:
    OPENROUTER_MODEL = FALLBACK_MODELS[0]

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"


def _sanitize_key(key: Optional[str]) -> str:
    """Strips accidental quotes, backticks, and whitespace from API keys."""
    if not key or not isinstance(key, str):
        return ""
    return key.strip().strip("'").strip('"').strip('`').strip()


def call_openrouter(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    api_key: Optional[str] = None,
    max_tokens: int = 4000,
    temperature: float = 0.3,
    top_p: Optional[float] = None,
    timeout: int = 45
) -> str:
    """
    Call OpenRouter API with provided messages.
    Supports model fallbacks and automatic key recovery if user-provided key fails with 401.
    """
    # 1. Clean user key and determine candidates
    user_key = _sanitize_key(api_key)
    system_key = _sanitize_key(os.getenv("OPENROUTER_API_KEY")) or DEFAULT_SYSTEM_KEY

    # Keys to attempt: user key first (if provided and looks plausible), then system key
    keys_to_try = []
    if user_key and len(user_key) > 10:
        keys_to_try.append(("user_key", user_key))
    if system_key and system_key != user_key:
        keys_to_try.append(("system_key", system_key))
    if not keys_to_try and system_key:
        keys_to_try.append(("system_key", system_key))

    if not keys_to_try:
        raise ValueError(
            "OpenRouter API Key is missing. Please set OPENROUTER_API_KEY in backend/.env."
        )

    # 2. Determine models to try
    raw_model = (model if isinstance(model, str) and model.strip() else OPENROUTER_MODEL) or ""
    raw_model = raw_model.strip() if raw_model else FALLBACK_MODELS[0]

    # Guard: if user entered a non-generative rerank or embedding model, auto-substitute
    if any(non_gen in raw_model.lower() for non_gen in ("rerank", "embed", "embedding")):
        print(f"[ExamGen LLM] Rerank/Embedding model '{raw_model}' is not generative. Using '{FALLBACK_MODELS[0]}' instead.", flush=True)
        primary_model = FALLBACK_MODELS[0]
    else:
        primary_model = raw_model

    models_to_try = [primary_model]
    for fb in FALLBACK_MODELS:
        if fb not in models_to_try:
            models_to_try.append(fb)

    last_error = ""

    # 3. Outer loop over keys (handles 401 auto-recovery)
    for key_source, active_key in keys_to_try:
        headers = {
            "Authorization": f"Bearer {active_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "ExamGen App"
        }

        key_auth_failed = False

        for target_model in models_to_try:
            print(f"[ExamGen LLM] Querying model '{target_model}' using {key_source}...", flush=True)
            payload = {
                "model": target_model,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature
            }
            if top_p is not None:
                payload["top_p"] = top_p

            try:
                response = requests.post(OPENROUTER_BASE_URL, headers=headers, json=payload, timeout=timeout)
            except requests.exceptions.RequestException as e:
                last_error = f"Failed to connect to OpenRouter API with {target_model}: {str(e)}"
                print(f"[ExamGen LLM] Connection error with {target_model}: {last_error}", flush=True)
                continue

            if response.status_code != 200:
                error_detail = response.text
                try:
                    err_json = response.json()
                    if "error" in err_json:
                        error_detail = err_json["error"].get("message", error_detail)
                except Exception:
                    pass

                # If authentication failed (401/403) and we have another key (system key), fail over!
                if response.status_code in (401, 403):
                    print(f"[ExamGen LLM Warning] {key_source} authentication failed (status {response.status_code}): {error_detail}", flush=True)
                    key_auth_failed = True
                    last_error = f"OpenRouter API Key authentication failed: {error_detail}"
                    break

                last_error = f"OpenRouter API error with {target_model} (status {response.status_code}): {error_detail}"
                # If model not found or provider error, try next fallback model
                continue

            try:
                data = response.json()
                choice = data["choices"][0]
                msg = choice.get("message", {})
                content = msg.get("content")

                if not content and "reasoning" in msg:
                    content = msg.get("reasoning", "")
                if not content and "text" in choice:
                    content = choice.get("text", "")

                if content and content.strip():
                    print(f"[ExamGen LLM] Success! Generated {len(content)} characters using {target_model}.", flush=True)
                    return content
                else:
                    last_error = f"OpenRouter returned empty content for model {target_model}."
                    continue
            except (KeyError, IndexError, json.JSONDecodeError) as e:
                last_error = f"Unexpected response structure from OpenRouter with {target_model}: {response.text[:200]}"
                continue

        # If user key failed with 401 and we have system key next in loop, loop continues to system key!
        if key_auth_failed and len(keys_to_try) > 1 and key_source == keys_to_try[0][0]:
            print("[ExamGen LLM] Auto-recovering: Switching to verified system OpenRouter key...", flush=True)
            continue

    raise RuntimeError(last_error or "All OpenRouter models and keys failed to return a response.")

