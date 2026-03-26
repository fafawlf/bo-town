"""Local dev server that mimics Vercel serverless routing for api/ handlers."""
import importlib.util
import sys
from http.server import HTTPServer
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse
import io

ROUTES = {
    "/api/chat": "api/chat.py",
    "/api/memory/extract": "api/memory/extract.py",
    "/api/letter/generate": "api/letter/generate.py",
    "/api/letter/daily": "api/letter/daily.py",
    "/api/scheduler/tick": "api/scheduler/tick.py",
}


def load_handler_class(filepath):
    spec = importlib.util.spec_from_file_location("mod", filepath)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.handler


class DevRouter(BaseHTTPRequestHandler):
    def _dispatch(self, method):
        parsed = urlparse(self.path)
        route_path = parsed.path.rstrip("/")

        filepath = ROUTES.get(route_path)
        if not filepath:
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error":"not found"}')
            return

        handler_cls = load_handler_class(filepath)

        handler = object.__new__(handler_cls)
        handler.client_address = self.client_address
        handler.server = self.server
        handler.request = self.request
        handler.headers = self.headers
        handler.command = self.command
        handler.path = self.path
        handler.request_version = self.request_version
        handler.requestline = self.requestline

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length else b""
        handler.rfile = io.BytesIO(body)
        handler.wfile = self.wfile

        getattr(handler, f"do_{method}")()

    def do_GET(self):
        self._dispatch("GET")

    def do_POST(self):
        self._dispatch("POST")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def log_message(self, format, *args):
        print(f"[API] {args[0]}" if args else "")


if __name__ == "__main__":
    port = 8000
    server = HTTPServer(("0.0.0.0", port), DevRouter)
    print(f"Bo-Town API dev server running on http://localhost:{port}")
    print(f"Routes: {', '.join(ROUTES.keys())}")
    print("Press Ctrl+C to stop")
    server.serve_forever()
