"""Behavior scheduler - decides what bots do proactively."""
import json
import os
import random
from http.server import BaseHTTPRequestHandler
from datetime import datetime

QUEUE_DIR = os.path.join(os.path.dirname(__file__), '../../data/queue')
CHARACTERS_PATH = os.path.join(os.path.dirname(__file__), '../../data/characters.json')

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Get pending messages for the user."""
        messages = self._load_queue()
        self._respond(200, {"messages": messages})

    def do_POST(self):
        """Run a scheduler tick - each character decides what to do."""
        body = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0) or 0)))

        # Load character configs (would be synced from frontend)
        characters = self._load_characters()
        now = datetime.now()
        hour = now.hour
        results = []

        for char in characters:
            behavior = char.get('behavior', {})
            active_hours = behavior.get('active_hours', [8, 22])
            initiative = behavior.get('initiative', 0.3)

            # Check if character is "awake"
            if not (active_hours[0] <= hour <= active_hours[1]):
                continue

            # Roll for initiative
            if random.random() > initiative:
                continue

            # Decide action: message or letter
            letter_freq = behavior.get('letter_frequency', 'weekly')
            action = 'message'
            if letter_freq == 'daily' and random.random() < 0.3:
                action = 'letter'
            elif letter_freq == 'weekly' and random.random() < 0.1:
                action = 'letter'

            results.append({
                "character_id": char['id'],
                "character_name": char.get('name', ''),
                "action": action,
                "timestamp": now.isoformat(),
            })

        # Save to queue
        existing = self._load_queue()
        existing.extend(results)
        self._save_queue(existing)

        self._respond(200, {
            "triggered": len(results),
            "actions": results,
        })

    def _load_characters(self):
        if os.path.exists(CHARACTERS_PATH):
            with open(CHARACTERS_PATH, 'r') as f:
                return json.load(f)
        return []

    def _load_queue(self):
        path = os.path.join(QUEUE_DIR, 'pending.json')
        if os.path.exists(path):
            with open(path, 'r') as f:
                return json.load(f)
        return []

    def _save_queue(self, queue):
        os.makedirs(QUEUE_DIR, exist_ok=True)
        path = os.path.join(QUEUE_DIR, 'pending.json')
        with open(path, 'w') as f:
            json.dump(queue, f, ensure_ascii=False, indent=2)

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())
