# Latency — Backend

API REST do jogo Latency ("guerra de hackers": o jogador invade uma rede rival
resolvendo algoritmos reais em JS/TS/C#/C enquanto uma IA com persona de
hacker rival reage em tempo real), projeto avaliativo de Programação para
Internet II.

## Stack
Node.js + TypeScript + Express + Prisma ORM + PostgreSQL (Neon) + Socket.IO +
JWT + Zod + Swagger + Judge0 (execução de código) + Claude/Anthropic (persona
do rival).

## Setup
```
npm install
cp .env.example .env   # preencher DATABASE_URL, JWT_SECRET e ANTHROPIC_API_KEY
npx prisma migrate deploy
npm run db:seed         # popula o catálogo de 160 algoritmos (40 x 4 linguagens)
npm run dev
```

## Scripts
- `npm run dev` — inicia o servidor em modo desenvolvimento
- `npm run build` — compila o TypeScript para `dist/`
- `npm start` — roda a versão compilada
- `npm run lint` — roda o ESLint
- `npm run db:seed` — popula/atualiza o catálogo de algoritmos (idempotente, por id determinístico)

## Deploy (Render + Neon)

1. Criar um projeto no [Neon](https://neon.tech), copiar a connection string **pooled** e usar como `DATABASE_URL` (adicionar `?sslmode=require`).
2. Criar um Web Service no [Render](https://render.com) apontando para este repositório — o `render.yaml` já declara build (`npm install && npm run build && npx prisma migrate deploy && npm run db:seed`) e start (`npm start`).
3. Preencher no painel do Render as variáveis `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (URL exata do frontend no Vercel, nunca `*`) e `ANTHROPIC_API_KEY` (sem ela a IA do rival cai automaticamente nas falas pré-escritas, mas fica repetitiva).
4. `JUDGE0_URL` já vem preenchido com a instância pública `ce.judge0.com` — só trocar se for hospedar a própria.
5. O Render free tier "dorme" após inatividade — fazer uma requisição de aquecimento em `/health` antes de qualquer demo ao vivo.
