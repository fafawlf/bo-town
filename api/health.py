"""GET /api/health — 检查服务端是否读到 Anthropic Key（不返回密钥内容）."""
import json
import os
import sys
from http.server import BaseHTTPRequestHandler

_api_dir = os.path.dirname(os.path.abspath(__file__))
if _api_dir not in sys.path:
    sys.path.insert(0, _api_dir)

from envutil import get_anthropic_api_key


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        key = get_anthropic_api_key()
        data = {
            "ok": True,
            "anthropic_api_key_configured": bool(key),
        }
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
