# Frontend - Sistema de Gestión de Documentos Electrónicos

Interfaz de usuario construida con React para la gestión de envío de documentos a NubeFact/SUNAT y la edición de documentos con errores o rechazos.

> [!IMPORTANT]
> Este proyecto está dividido en dos repositorios independientes:
> - **Frontend**: Interfaz de usuario React/Vite (Este repo).
> - **Backend**: API construida con FastAPI.

## Requisitos Previos

- Node.js 18+
- Docker (opcional para despliegue)

## Instalación y Configuración

### 1. Variables de Entorno
Cree un archivo `.env` en la raíz del frontend (o configure las variables en su entorno de despliegue):

```env
VITE_API_URL=http://localhost:8000/api
```

### 2. Ejecución Local (Desarrollo)
```bash
npm install
npm run dev
```
El servidor de desarrollo se iniciará en `http://localhost:5173`

### 3. Ejecución con Docker (Producción)
Este proyecto cuenta con un `Dockerfile` que realiza una construcción multi-etapa y sirve la aplicación optimizada mediante **Nginx**.

```bash
# Construir y levantar todo con docker-compose (desde la raíz del proyecto)
docker-compose up --build -d
```

## Stack Tecnológico

- **Framework**: Vite + React 18 + TypeScript
- **UI Library**: Ant Design 5.x
- **Styling**: TailwindCSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v7

## Estructura del Proyecto

- `src/components/`: Componentes reutilizables (Tablas, Filtros, Layout).
- `src/pages/`: Páginas principales (Ventas, Guías, Retenciones, Dashboard).
- `src/services/`: Clientes de API para comunicación con el backend.
- `src/hooks/`: Hooks personalizados para lógica de negocio y consultas.

## Notas de Integración

- El frontend se comunica con el backend mediante la URL definida en `VITE_API_URL`.
- Asegúrese de que el backend esté corriendo y sea accesible desde el navegador del cliente.
- En entornos de producción con Docker, Nginx está configurado para manejar correctamente el enrutamiento de SPA.
