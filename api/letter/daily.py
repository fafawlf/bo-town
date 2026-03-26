"""Daily letter job: 王大凡 decides whether to write to Bo; skips if mailbox has unread."""
import json
import os
import re
import sys
import uuid
from datetime import datetime
from http.server import BaseHTTPRequestHandler

_api_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if _api_root not in sys.path:
    sys.path.insert(0, _api_root)
from envutil import get_anthropic_api_key
LETTERS_DIR = os.path.join(os.path.dirname(__file__), "../../data/letters")


def _letter_path(character_id, persona_id):
    pid = str(persona_id or "default")
    return os.path.join(LETTERS_DIR, f"{character_id}_{pid}.json")


def _legacy_path(character_id):
    return os.path.join(LETTERS_DIR, f"{character_id}.json")


def _load_letters(character_id, persona_id):
    path = _letter_path(character_id, persona_id)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    legacy = _legacy_path(character_id)
    if os.path.exists(legacy):
        with open(legacy, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def _save_letters(character_id, persona_id, letters):
    os.makedirs(LETTERS_DIR, exist_ok=True)
    path = _letter_path(character_id, persona_id)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(letters, f, ensure_ascii=False, indent=2)


def _parse_json_block(text):
    text = text.strip()
    m = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if m:
        text = m.group(1).strip()
    return json.loads(text)


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        import urllib.request

        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        character_id = body.get("character_id", "")
        persona_id = body.get("persona_id", "default")
        has_unread = body.get("has_unread", False)
        chat_transcript = body.get("chat_transcript", "")
        recent_context = body.get("recent_context", "")
        character_prompt = body.get("character_prompt", "")

        if not character_id:
            self._respond(400, {"error": "character_id required"})
            return

        if has_unread:
            self._respond(
                200,
                {
                    "skipped": True,
                    "reason": "unread_mailbox",
                    "message": "信箱有未读，今天不写信",
                },
            )
            return

        api_key = get_anthropic_api_key()
        if not api_key:
            self._respond(500, {"error": "ANTHROPIC_API_KEY not configured"})
            return

        decision_prompt = f"""你是王大凡，要根据与 Bo 的聊天记录、最近发生的事，判断今天要不要给 Bo 写一封信。

## 你的完整角色与记忆上下文
{character_prompt}

---

## 与 Bo 的聊天记录（含最近24小时与更早节选）
{chat_transcript}

## 最近发生的事（记忆与日记等）
{recent_context}

---

规则：
- 若没有什么新内容、情绪平淡、或刚聊完不需要再留言，应写 should_write 为 false。
- 若有值得单独展开写一封信的时刻（想念、想延续话题、想安静说几句心里话等），should_write 为 true。
- 若 should_write 为 true，letter_content 为完整信件正文（200-500字），像朋友写信一样自然；不要加「亲爱的XX」套话开头；结尾可有小期待或小问题。
- 若 should_write 为 false，letter_content 必须为 null。

只输出一个 JSON 对象，不要其它文字：
{{"should_write": true 或 false, "letter_content": "..." 或 null}}"""

        try:
            api_body = json.dumps(
                {
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 2000,
                    "messages": [{"role": "user", "content": decision_prompt}],
                }
            ).encode()

            req = urllib.request.Request(
                "https://api.anthropic.com/v1/messages",
                data=api_body,
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                },
            )

            with urllib.request.urlopen(req) as resp:
                result = json.loads(resp.read())
                raw = result["content"][0]["text"].strip()

            data = _parse_json_block(raw)
            should_write = bool(data.get("should_write"))
            letter_content = data.get("letter_content")

            if not should_write or not letter_content or not str(letter_content).strip():
                self._respond(
                    200,
                    {
                        "skipped": True,
                        "reason": "no_need",
                        "message": "今天不需要写信",
                    },
                )
                return

            content = str(letter_content).strip()
            letter = {
                "id": str(uuid.uuid4())[:8],
                "character_id": character_id,
                "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
                "content": content,
                "subject": content[:20] + "...",
                "preview": content[:50] + "...",
            }

            letters = _load_letters(character_id, persona_id)
            letters.insert(0, letter)
            _save_letters(character_id, persona_id, letters)

            self._respond(200, {"skipped": False, "letter": letter})

        except Exception as e:
            self._respond(500, {"error": str(e)})

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())
