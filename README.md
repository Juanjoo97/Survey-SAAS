# SaaS de Encuestas

Plataforma web para gestión de encuestas desarrollada con Angular y Express.

## Arquitectura

- **Frontend:** Angular (v17+)
- **Backend:** Node.js + Express + TypeScript
- **Base de Datos:** PostgreSQL (Producción/Docker) / SQLite (Desarrollo)
- **ORM:** Sequelize

## Requisitos Previos

- Node.js (v18 o superior)
- Docker (opcional para base de datos local)

## Configuración y Ejecución

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

El servidor se iniciará en `http://localhost:3000`.

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

La aplicación estará disponible en `http://localhost:4200`.

## Estructura del Proyecto

- `/backend`: API RESTful y lógica de negocio.
- `/frontend`: Aplicación SPA en Angular.
- `docker-compose.yml`: Configuración de servicios (PostgreSQL, Adminer).
