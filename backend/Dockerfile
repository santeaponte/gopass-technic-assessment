FROM node:20-alpine

WORKDIR /app

ENV DATABASE_URL=postgresql://gopass:gopass@postgres:5432/gopass

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci

COPY backend ./backend
RUN npm run prisma:generate --workspace backend
RUN npm run build --workspace backend

WORKDIR /app/backend
EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run prisma:seed && npm start"]
