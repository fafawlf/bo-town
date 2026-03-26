"""Runtime read of Anthropic API key — avoids import-time env misses on serverless."""
import os


def get_anthropic_api_key():
    raw = os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_KEY") or ""
    if not raw:
        return ""
    s = raw.strip().lstrip("\ufeff")
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        s = s[1:-1].strip()
    return s
