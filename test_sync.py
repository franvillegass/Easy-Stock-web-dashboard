#!/usr/bin/env python
"""
Test script to verify syncer works and data reaches Supabase
"""
import json
import urllib.request
import urllib.error
from datetime import datetime
from config import ENTITY_ID

SUPABASE_URL = "https://tfotecboxtfkjhgxyrtg.supabase.co/"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmb3RlY2JveHRma2poZ3h5cnRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0Mjg0NzYsImV4cCI6MjA5MTAwNDQ3Nn0.6cxFCChJFk-tvvAaFZA-iAJUBzGh7dyubk7eXfj6CIc"

_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
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
        error_msg = e.read().decode()
        print(f"HTTP {e.code}: {error_msg}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

# Check if entidad exists
print(f"\n📋 Verificando entidad: {ENTITY_ID}\n")
result = _req("GET", f"entidades?id=eq.{ENTITY_ID}")
print(f"GET entidades: {result}")

# Try to create/upsert entidad
print(f"\n✏️  Insertando/Actualizando entidad...\n")
result = _req("POST", "entidades?on_conflict=id", {
    "id": ENTITY_ID,
    "nombre": ENTITY_ID
})
print(f"POST entidades: {result}")

# Check sucursales
print(f"\n📋 Verificando sucursales para entidad {ENTITY_ID}\n")
result = _req("GET", f"sucursales?entidad_id=eq.{ENTITY_ID}")
print(f"GET sucursales: {result}")

print("\n✅ Test completado. Chequea la consola del navegador para ver los polling logs.\n")
