#!/usr/bin/env python
"""
Insert sample data to test polling on the frontend
"""
import json
import urllib.request
from datetime import datetime, timedelta
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
            return json.loads(response_data) if response_data else None
    except urllib.error.HTTPError as e:
        error_msg = e.read().decode()
        print(f"HTTP {e.code}: {error_msg}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

print("\n🔧 Inserting test data...\n")

# Create a test sucursal (branch)
import time
sucursal_id = f"{ENTITY_ID}_MAIN"
sucursal = {
    "id": sucursal_id,
    "entidad_id": ENTITY_ID,
    "nombre": "Sucursal Principal",
    "ultima_sync": datetime.now().isoformat()
}
print(f"Creating sucursal: {sucursal}")
result = _req("POST", "sucursales", sucursal)
print(f"Result: {result}\n")

# Create test products with numeric IDs
productos = [
    {"id": 1, "sucursal_id": sucursal_id, "nombre": "Pan", "stock": 50, "precio": 2.50, "codigo_barras": "123456789"},
    {"id": 2, "sucursal_id": sucursal_id, "nombre": "Leche", "stock": 30, "precio": 3.50, "codigo_barras": "123456790"},
    {"id": 3, "sucursal_id": sucursal_id, "nombre": "Queso", "stock": 15, "precio": 8.99, "codigo_barras": "123456791"},
]
print("Creating productos:")
for producto in productos:
    print(f"  - {producto['nombre']}")
    result = _req("POST", "productos", producto)

# Create test sale with numeric ID
venta_id = int(time.time() * 1000) % 999999999
venta = {
    "id": venta_id,
    "sucursal_id": sucursal_id,
    "total": 50.00,
    "metodo_pago": "efectivo",
    "descuento_total": 0,
    "fecha": datetime.now().isoformat()
}
print(f"\nCreating venta: {venta['id']}")
result = _req("POST", "ventas", venta)
print(f"Result: {result}\n")

# Create venta items with numeric IDs
venta_items = [
    {"id": venta_id * 1000 + 1, "venta_id": venta_id, "producto": "Pan", "cantidad": 10, "precio": 2.50, "descuento_item": 0, "subtotal": 25.00, "es_oferta": False},
    {"id": venta_id * 1000 + 2, "venta_id": venta_id, "producto": "Leche", "cantidad": 5, "precio": 3.50, "descuento_item": 0, "subtotal": 17.50, "es_oferta": False},
    {"id": venta_id * 1000 + 3, "venta_id": venta_id, "producto": "Queso", "cantidad": 2, "precio": 8.99, "descuento_item": 0, "subtotal": 7.50, "es_oferta": False},
]
print("Creating venta items:")
for item in venta_items:
    print(f"  - {item['producto']} x{item['cantidad']}")
    result = _req("POST", "venta_items", item)

print("\n✅ Test data inserted!")
print(f"\n📍 Now check: http://localhost:3000/dashboard/{ENTITY_ID}\n")
print("🔍 Open browser DevTools console to see polling logs every 30 seconds")
print("⏰ Watch 'Última actualización' timestamp change in the UI\n")
