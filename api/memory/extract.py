"""Memory reflect API — Rin-style: update user facts, relationship, diary, summary in one pass."""
import json
import os
import sys
from http.server import BaseHTTPRequestHandler

_api_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if _api_root not in sys.path:
    sys.path.insert(0, _api_root)
from envutil import get_anthropic_api_key


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        messages = body.get('messages', [])
        char_context = body.get('char_context', {})
        current_memory = body.get('current_memory', {})

        if not messages:
            self._respond(400, {"error": "messages required"})
            return

        char_name = char_context.get('name', '角色')
        char_traits = char_context.get('traits', '')
        char_style = char_context.get('speaking_style', '')

        recent = messages[-30:]
        conversation_text = "\n".join(
            f"{'对方' if m['role']=='user' else char_name}: {m['content']}"
            for m in recent
        )

        existing_user = current_memory.get('user', '') or '（还不了解对方）'
        existing_relation = current_memory.get('relation', '') or '（刚认识）'
        existing_core = current_memory.get('core', '') or '（还没有）'
        existing_summary = current_memory.get('summary', '') or '（没有更早的记忆）'

        reflect_prompt = f"""你是{char_name}。性格：{char_traits}
说话风格：{char_style}

你刚刚和一个人聊了一段话。现在你要用自己的语气，更新你脑子里关于这个人的记忆。

最近的对话：
{conversation_text}

你现有的记忆：
【关于对方】{existing_user}
【你和ta的关系】{existing_relation}
【重要的共同记忆】{existing_core}
【更早的记忆摘要】{existing_summary}

请用你自己的语气和视角，返回更新后的记忆。用JSON格式：

{{
  "user": "关于对方的事实，用你的语气写（150字以内）。保留旧的重要信息，加上新了解到的。",
  "relation": "你对这段关系的感受，用你的内心独白写（100字以内）。如果关系没变化可以保持原样。",
  "core": "你们之间重要的瞬间/对话，值得记住的（150字以内）。只在有真正重要的新瞬间时更新。",
  "diary_entry": "今天的日记，用你的口吻写。记录今天聊了什么、你的感受（200字以内）。",
  "summary": "如果更早的记忆需要更新就更新，不需要就原样返回（100字以内）。",
  "diary_unlocked": true或false
}}

规则：
- 所有内容都用你（{char_name}）自己的语气
- 不是客观记录，是你主观的感受和记忆
- 如果某个字段没有变化，就返回原来的内容
- diary_entry 每次都要写
- diary_unlocked：你愿不愿意让对方看你的日记？只有当你对ta产生了真正的感情（不只是好感，是心动、爱、离不开）才设为true。刚认识、普通朋友、还在试探阶段都是false。这是你的私人日记，不是随便谁都能看的。
- 只返回JSON"""

        try:
            result = self._call_claude(reflect_prompt)
            self._respond(200, result)
        except Exception as e:
            self._respond(500, {"error": str(e)})

    def _call_claude(self, prompt):
        import urllib.request
        key = get_anthropic_api_key()
        if not key:
            raise RuntimeError("ANTHROPIC_API_KEY not configured")
        api_body = json.dumps({
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 1500,
            "messages": [{"role": "user", "content": prompt}]
        }).encode()

        req = urllib.request.Request(
            "https://api.anthropic.com/v1/messages",
            data=api_body,
            headers={
                "Content-Type": "application/json",
                "x-api-key": key,
                "anthropic-version": "2023-06-01",
            }
        )

        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            text = result["content"][0]["text"].strip()
            start = text.find('{')
            end = text.rfind('}') + 1
            if start >= 0 and end > start:
                return json.loads(text[start:end])
            return {}

    def do_GET(self):
        self._respond(200, {"status": "ok"})

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())
