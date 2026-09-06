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
