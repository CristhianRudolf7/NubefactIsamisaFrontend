# Frontend - Sistema de Gestión de Documentos Electrónicos

Frontend para gestión de envío de documentos a NubeFact/SUNAT y edición de documentos con errores.

## Stack Tecnológico

- **Framework**: Vite + React 18 + TypeScript
- **UI Library**: Ant Design 5.x
- **Styling**: TailwindCSS (complementario)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6

## Instalación

```bash
npm install
```

## Ejecución

```bash
npm run dev
```

El servidor de desarrollo se iniciará en `http://localhost:5173`

## Build

```bash
npm run build
```

## Estructura del Proyecto

```
src/
  components/
    layout/           # Header, Sidebar, MainLayout
    common/           # DataTable, FilterPanel, StatusBadge, ColumnSelector
  pages/
    Dashboard.tsx     # Estadísticas y resumen
    Ventas/           # Lista, detalle y edición de ventas
    Retenciones/      # Lista, detalle y edición de retenciones
    Guias/            # Lista, detalle y edición de guías
  services/           # API clients
  hooks/              # Custom hooks con React Query
  contexts/           # React Context
  types/              # TypeScript types
  utils/              # Formatters y constants
  styles/             # CSS global
```

## Funcionalidades

### Acciones por Estado

| Estado | Acciones |
|--------|----------|
| Pendiente | Enviar a NubeFact, Ver detalle |
| Enviado | Ver detalle, Descargar PDF/XML/CDR |
| Aceptado | Ver detalle, Descargar PDF/XML/CDR |
| Rechazado/Observado | Editar, Reenviar, Ver error |
| Error | Editar, Reintentar |

### Columnas Personalizables

Las tablas permiten seleccionar qué columnas mostrar:
- Botón de configuración en la esquina superior derecha
- Persistencia en localStorage
- Opción de restaurar configuración por defecto

### Diseño Responsivo

- **Desktop (>1024px)**: Sidebar expandido (240px)
- **Tablet (768-1024px)**: Sidebar colapsado (80px)
- **Mobile (<768px)**: Sidebar oculto (drawer)

## Variables de Entorno

```env
VITE_API_URL=http://localhost:8000/api
```

## Notas

- Este sistema **NO crea documentos**, solo los visualiza y gestiona
- La creación de documentos se realiza en otro sistema
- Solo se pueden editar documentos rechazados o con observaciones
