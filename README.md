# gopass-technic-assessment

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
export ADMIN_PASSWORD="cambia-esto"
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
