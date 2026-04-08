# Módulo de Notificaciones

Este módulo proporciona un sistema de notificaciones globales para la aplicación EasyStock Dashboard.

## Características

- Notificaciones aparecen en la zona superior de la pantalla, visibles en todas las rutas.
- Diseño: Rectángulo con bordes muy redondeados (casi circular), color verde.
- Auto-desaparición después de 5 segundos.
- Clic para cerrar manualmente.

## Tipos de Notificaciones

- `product_added`: Se creó un producto.
- `product_removed`: Se eliminó un producto.
- `product_edited`: Se editó un producto (muestra cambios).
- `offer_created`: Se creó una oferta (nombre, productos, fecha expiración).
- `offer_expired`: Una oferta expiró (nombre, ventas realizadas).
- `sale`: Venta realizada (productos y total si ≤2 productos, solo total si >2).
- `cash_closed`: Caja cerrada.

## Uso

Importa el hook `useNotifications` en cualquier componente:

```tsx
import { useNotifications } from '../components/notifications/NotificationContext';

const MyComponent = () => {
  const { addNotification } = useNotifications();

  const handleAddProduct = () => {
    // Lógica para agregar producto
    addNotification('product_added', { productName: 'Producto X' });
  };

  // ...
};
```

### Ejemplos de Datos

- Producto agregado: `{ productName: 'Manzana' }`
- Producto editado: `{ productName: 'Manzana', changes: [{ field: 'Precio', before: '10', after: '12' }] }`
- Oferta creada: `{ name: 'Oferta Primavera', products: ['Manzana', 'Pera'], expiryDate: '2024-05-01' }`
- Venta: `{ products: [{ name: 'Manzana', quantity: 2 }], total: 20 }` o `{ total: 50 }`

## Archivos

- `NotificationContext.tsx`: Contexto y provider.
- `Notification.tsx`: Componente individual de notificación.
- `NotificationContainer.tsx`: Contenedor que renderiza todas las notificaciones.
- Integrado en `app/layout.tsx`.