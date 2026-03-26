"""Letter generation API - bots write letters to the user."""
import json
import os
import uuid
from http.server import BaseHTTPRequestHandler

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
LETTERS_DIR = os.path.join(os.path.dirname(__file__), '../../data/letters')
MEMORY_DIR = os.path.join(os.path.dirname(__file__), '../../data/memories')


def _letter_path(character_id, persona_id):
    pid = str(persona_id or 'default')
    return os.path.join(LETTERS_DIR, f'{character_id}_{pid}.json')


def _legacy_letter_path(character_id):
    return os.path.join(LETTERS_DIR, f'{character_id}.json')

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Get letters from a character."""
        from urllib.parse import urlparse, parse_qs
        params = parse_qs(urlparse(self.path).query)
        character_id = params.get('character_id', [''])[0]
        persona_id = params.get('persona_id', ['default'])[0]

        letters = self._load_letters(character_id, persona_id)
        self._respond(200, {"letters": letters})

    def do_POST(self):
        """Generate a new letter from a character."""
        import urllib.request

        body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        character_id = body.get('character_id', '')
        persona_id = body.get('persona_id', 'default')
        character_prompt = body.get('system_prompt', '')

        if not character_id:
            self._respond(400, {"error": "character_id required"})
            return

        # Load memories for context
        memories = self._load_memories(character_id)
        memory_text = "\n".join(f"- {m['fact']}" for m in memories) if memories else "（还没有特别了解对方）"

        letter_prompt = f"""你要以这个角色的身份给你的朋友写一封信。

{character_prompt}

你记得关于对方的事情：
{memory_text}

写信要求：
- 像朋友之间写信一样自然
- 可以分享你最近的"生活"（基于你的角色设定想象）
- 如果有记忆，可以关心对方之前提到的事
- 长度200-500字
- 不要加"亲爱的XX"之类的格式化开头，直接开始说话
- 信的结尾可以有一个小期待或小问题

只返回信的内容，不要其他说明。"""

        try:
            api_body = json.dumps({
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 1000,
                "messages": [{"role": "user", "content": letter_prompt}]
            }).encode()

            req = urllib.request.Request(
                "https://api.anthropic.com/v1/messages",
                data=api_body,
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                }
            )

            with urllib.request.urlopen(req) as resp:
                result = json.loads(resp.read())
                content = result["content"][0]["text"].strip()

            from datetime import datetime
            letter = {
                "id": str(uuid.uuid4())[:8],
                "character_id": character_id,
                "date": datetime.now().strftime('%Y-%m-%d %H:%M'),
                "content": content,
                "subject": content[:20] + "...",
                "preview": content[:50] + "...",
            }

            # Save letter
            letters = self._load_letters(character_id, persona_id)
            letters.insert(0, letter)
            self._save_letters(character_id, persona_id, letters)

            self._respond(200, {"letter": letter})

        except Exception as e:
            self._respond(500, {"error": str(e)})

    def _load_letters(self, character_id, persona_id='default'):
        if not character_id:
            # Load all letters
            all_letters = []
            if os.path.exists(LETTERS_DIR):
                for fname in os.listdir(LETTERS_DIR):
                    if fname.endswith('.json'):
                        with open(os.path.join(LETTERS_DIR, fname), 'r') as f:
                            all_letters.extend(json.load(f))
            return sorted(all_letters, key=lambda x: x.get('date', ''), reverse=True)

        path = _letter_path(character_id, persona_id)
        if os.path.exists(path):
            with open(path, 'r') as f:
                return json.load(f)
        legacy = _legacy_letter_path(character_id)
        if os.path.exists(legacy):
            with open(legacy, 'r') as f:
                return json.load(f)
        return []

    def _save_letters(self, character_id, persona_id, letters):
        os.makedirs(LETTERS_DIR, exist_ok=True)
        path = _letter_path(character_id, persona_id)
        with open(path, 'w') as f:
            json.dump(letters, f, ensure_ascii=False, indent=2)

    def _load_memories(self, character_id):
        path = os.path.join(MEMORY_DIR, f'{character_id}.json')
        if os.path.exists(path):
            with open(path, 'r') as f:
                return json.load(f)
        return []

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())
