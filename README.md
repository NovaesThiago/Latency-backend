# Ciberguerra — Backend

API REST do jogo Ciberguerra (TCG tático por turnos, tema ciberguerra), projeto avaliativo de Programação para Internet II.

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
