import sqlite3
from typing import List, Dict, Any

class DBManager:
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    def list_tiendas(self) -> List[Dict[str, Any]]:
        """List all tiendas (stores)"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM tiendas")
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error fetching tiendas: {e}")
            return []
    
    def list_productos(self, tienda_id: int) -> List[Dict[str, Any]]:
        """List all productos for a tienda"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM productos WHERE tienda_id = ?", (tienda_id,))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error fetching productos: {e}")
            return []
    
    def list_ofertas(self, tienda_id: int) -> List[Dict[str, Any]]:
        """List all ofertas for a tienda"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM ofertas WHERE tienda_id = ?", (tienda_id,))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error fetching ofertas: {e}")
            return []
    
    def list_ventas(self, tienda_id: int) -> List[Dict[str, Any]]:
        """List all ventas for a tienda"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM ventas WHERE tienda_id = ?", (tienda_id,))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error fetching ventas: {e}")
            return []
    
    def list_items_by_venta(self, venta_id: str) -> List[Dict[str, Any]]:
        """List all venta_items for a venta"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM venta_items WHERE venta_id = ?", (venta_id,))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error fetching venta_items: {e}")
            return []
    
    def list_cierres(self, tienda_id: int) -> List[Dict[str, Any]]:
        """List all cierres for a tienda"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM cierres_caja WHERE tienda_id = ?", (tienda_id,))
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"Error fetching cierres: {e}")
            return []
