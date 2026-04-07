import uuid
import json
import threading
import urllib.request
import urllib.error
from datetime import datetime
from config import ENTITY_ID

SUPABASE_URL = "https://tfotecboxtfkjhgxyrtg.supabase.co/"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmb3RlY2JveHRma2poZ3h5cnRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0Mjg0NzYsImV4cCI6MjA5MTAwNDQ3Nn0.6cxFCChJFk-tvvAaFZA-iAJUBzGh7dyubk7eXfj6CIc"
SYNC_INTERVAL = 30

_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates",
}


def _req(method: str, path: str, body=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=_HEADERS, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            response_data = r.read()
            return json.loads(response_data) if response_data else {}
    except urllib.error.HTTPError as e:
        print(f"[sync] HTTP {e.code}: {e.read().decode()}")
    except Exception as e:
        print(f"[sync] error: {e}")
    return None


def _upsert(table: str, rows):
    if not rows:
        return
    _req("POST", f"{table}?on_conflict=id", rows if isinstance(rows, list) else [rows])


class Syncer:
    def __init__(self, entidad_id: str):
        self.entidad_id = entidad_id
        self._timer = None
        self._ensure_entidad()

    def _ensure_entidad(self):
        """Ensure entity exists in Supabase"""
        _req("POST", "entidades?on_conflict=id", {
            "id": self.entidad_id, 
            "nombre": self.entidad_id
        })

    def sync_all(self):
        """Update sync timestamp - this is a placeholder for actual data sync"""
        try:
            # Update entidad's last sync time
            _req("PATCH", f"entidades?id=eq.{self.entidad_id}", {
                "ultima_sync": datetime.utcnow().isoformat(),
            })
            print(f"[sync] ok {datetime.now().strftime('%H:%M:%S')}")
        except Exception as e:
            print(f"[sync] failed: {e}")
        finally:
            self._schedule()

    def _schedule(self):
        self._timer = threading.Timer(SYNC_INTERVAL, self.sync_all)
        self._timer.daemon = True
        self._timer.start()

    def start(self):
        self._schedule()
        threading.Thread(target=self.sync_all, daemon=True).start()

    def stop(self):
        if self._timer:
            self._timer.cancel()


# ──────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"[sync] Starting syncer for entity {ENTITY_ID}")
    syncer = Syncer(ENTITY_ID)
    try:
        syncer.start()
        print(f"[sync] Syncer started, polling every {SYNC_INTERVAL}s")
        # Keep the script running
        while True:
            threading.Event().wait(1)
    except KeyboardInterrupt:
        print("\n[sync] Shutting down...")
        syncer.stop()