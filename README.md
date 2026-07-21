# Latency — Backend

API REST do jogo Latency (TCG tático por turnos, tema ciberguerra: hackers vs. firewalls), projeto avaliativo de Programação para Internet II.

## Stack
Node.js + TypeScript + Express + Prisma ORM + PostgreSQL (Neon) + JWT + Zod + Swagger.

## Setup
```
npm install
cp .env.example .env   # preencher DATABASE_URL e JWT_SECRET
npm run dev
```

## Scripts
- `npm run dev` — inicia o servidor em modo desenvolvimento
- `npm run build` — compila o TypeScript para `dist/`
- `npm start` — roda a versão compilada
- `npm run lint` — roda o ESLint

## Deploy (Render + Neon)

1. Criar um projeto no [Neon](https://neon.tech), copiar a connection string **pooled** e usar como `DATABASE_URL` (adicionar `?sslmode=require`).
2. Criar um Web Service no [Render](https://render.com) apontando para este repositório — o `render.yaml` já declara build (`npm install && npm run build && npx prisma migrate deploy`) e start (`npm start`).
3. Preencher no painel do Render as variáveis `DATABASE_URL`, `JWT_SECRET` e `CORS_ORIGIN` (URL exata do frontend no Vercel, nunca `*`).
4. O Render free tier "dorme" após inatividade — fazer uma requisição de aquecimento em `/health` antes de qualquer demo ao vivo.
