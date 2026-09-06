# gopass-technic-assessment

[![CI](https://github.com/santeaponte/gopass-technic-assessment/actions/workflows/ci.yml/badge.svg?branch=feature/testing)](https://github.com/santeaponte/gopass-technic-assessment/actions/workflows/ci.yml)

## Ejecutar todo con Docker

Requiere Docker Desktop con Compose habilitado:

```bash
docker compose up --build
```

La aplicación queda disponible en `http://localhost:8080`, la API en
`http://localhost:4000` y Swagger en `http://localhost:4000/api-docs`.

Las migraciones de Prisma se ejecutan automáticamente al iniciar el backend.
Para detener los servicios:

```bash
docker compose down
```

Para eliminar también los datos locales de PostgreSQL:

```bash
docker compose down -v
```

Puedes definir `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN` y `VITE_API_URL`
antes de ejecutar Compose si necesitas cambiar los valores por defecto.

## Usuario administrador inicial

El primer usuario `ADMIN` se crea con un seed de Prisma (`backend/prisma/seed.ts`),
no insertando filas a mano en la base de datos. El script es idempotente: si el
email ya existe, no lo modifica.

Definí estas variables (en `backend/.env` para desarrollo local, o como
variables de entorno antes de levantar Compose):

```bash
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="cambia-esto-min-8-caracteres"
ADMIN_NAME="Admin"        # opcional, default "Admin"
```

Si `ADMIN_EMAIL` o `ADMIN_PASSWORD` no están definidas, el seed no hace nada.

**Con Docker Compose:**

```bash
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="Qwerty12"
docker compose up --build -d
docker compose exec -e ADMIN_EMAIL -e ADMIN_PASSWORD -e ADMIN_NAME backend npm run prisma:seed
```

**En desarrollo local (sin Docker):**

```bash
cd backend
npm install
npx prisma migrate deploy
npm run prisma:seed
```

## Testing

El backend usa Vitest para los tests unitarios y de integración HTTP. La suite
incluye schemas, servicios, rutas Express reales y persistencia mediante Prisma
contra PostgreSQL.

### Requisitos

- Node.js 20 o superior.
- Docker Desktop con Compose habilitado.
- Dependencias instaladas desde la raíz:

```bash
npm install
```

### Base de datos de testing

Los tests de integración usan una base separada llamada `gopass_test`; nunca
deben ejecutarse contra la base de desarrollo `gopass`.

Inicia únicamente PostgreSQL con Docker Compose:

```bash
docker compose up -d postgres
```

Crea la configuración local de testing a partir de la plantilla:

```bash
cd backend
cp .env.test.example .env.test
```

El archivo `.env.test` es local y está ignorado por Git. Su valor por defecto
apunta al PostgreSQL expuesto por Docker en `localhost:5435`.

Prepara la base y aplica las migraciones existentes:

```bash
npm run test:db:setup
```

Este comando crea `gopass_test` si todavía no existe y ejecuta las migraciones
de Prisma sin modificar la base `gopass`.

### Ejecutar las validaciones

Desde `backend/`:

```bash
npm run test:unit
npm run test:integration
npm test
npm run build
npm run lint
```

`npm run test:unit` ejecuta únicamente schemas y servicios, sin cargar la
configuración de integración ni requerir PostgreSQL. `npm run test:integration`
ejecuta únicamente las pruebas HTTP y de persistencia real, usando
`gopass_test`.

`npm test` conserva la ejecución completa de ambas categorías. La suite de
integración limpia las tablas de testing entre casos y se ejecuta sin
paralelismo entre archivos porque comparte exclusivamente `gopass_test`. El
test de base de datos valida explícitamente un flujo real de `INSERT` y
`SELECT`.

Para validar también el frontend, desde `frontend/`:

```bash
npm run lint
npm run build
```
