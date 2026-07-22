# Plano de Projeto — Latency v2 ("Guerra de Hackers")

> Substitui o `PLANO_CIBERGUERRA.md` (TCG de tabuleiro) — mantém a base de disciplina
> (arquitetura, auth, `.env`, validação) que já está pronta e funcionando, e troca
> inteiramente o **core de gameplay** e a **identidade visual**. Decisões travadas com
> o Thiago em 2026-07-21 (ver seção 0).

---

## 0. Decisões já travadas (não reabrir sem motivo forte)

| Decisão | Escolha |
|---|---|
| Execução/validação de código do jogador | ~~API pública Piston~~ **Judge0 CE pública (`ce.judge0.com`)** — Piston ficou whitelist-only em 2/2026 (confirmado ao vivo na implementação); Judge0 CE é o substituto no mesmo papel: roda JS/TS/C#/C de verdade em sandbox de terceiros, sem infra própria, sem API key. Validado ao vivo: JS (Node 18) e C# (Mono) retornaram stdout correto end-to-end |
| Minigames de fase | **Port WASM existente via js-dos** (DOSBox no navegador) — Doom shareware / Wolfenstein 3D shareware, ambos legalmente redistribuíveis pela id Software/Apogee desde os anos 90 |
| IA do hacker rival | **Proxy no backend pra API da Claude (Anthropic)** — persona real de LLM, nunca repetitiva |
| Prazo/escopo | **Sem prazo apertado** — implementar tudo em profundidade, sem cortes de escopo (mas em ordem de dependência: fundação → core → conteúdo → polish) |

**Risco aberto a validar cedo na implementação:** acesso de rede de saída no ambiente onde o backend roda (Render) precisa alcançar `emkc.org` (Piston), `api.anthropic.com` (Claude) e o CDN do js-dos/WAD no frontend. Testar isso no primeiro dia, não no fim.

---

## 1. Contexto

O projeto era um TCG tático por turnos (hackers vs. firewalls, tabuleiro com rotas). O Thiago decidiu que essa direção "não deixou muito satisfeito" e quer pivotar para algo mais fiel ao tema: um **jogo de "invasão de rede" em estética de PC dos anos 80/terminal verde-e-preto/CRT curvo**, onde o jogador digita **algoritmos reais** (JS/TS/C#/C, à escolha) pra "derrubar firewalls" de uma rede rival, enquanto uma **IA com persona de hacker rival** conversa/provoca em paralelo — tudo correndo ao mesmo tempo pra dar a sensação de correria/tensão. A cada camada de rede vencida, um minigame retro roda como recompensa/gate pra avançar. Vence quem invadir a rede do outro primeiro.

O projeto continua sendo o avaliativo de **Programação para Internet II** — os requisitos da disciplina (arquitetura em camadas, `.env`, REST + CRUD completo, banco relacional com relacionamento, validação/erros padronizados, JWT) continuam valendo e já estão, em grande parte, resolvidos pela fundação atual (`authService`, middlewares, Zod, Swagger). Este plano preserva essa fundação e substitui só o domínio de jogo.

---

## 2. Stack — o que muda

**Backend (adiciona):**
- `socket.io` — tempo real (chat, status de rede, timers, eventos de powerup) — é o que falta pra "várias coisas acontecendo ao mesmo tempo" funcionar de verdade em vez de polling.
- `@anthropic-ai/sdk` — chamadas à API da Claude pra persona da IA.
- Cliente HTTP pra Piston — `fetch` nativo do Node 22 já resolve, sem lib extra.
- Mantém: Express 5, Prisma, PostgreSQL (Neon), JWT, bcrypt, Zod, Swagger.

**Frontend (adiciona):**
- `socket.io-client`.
- `js-dos` (pacote `js-dos` / `emulators`, via npm ou CDN) pra rodar os minigames DOS.
- Uma fonte monoespaçada de terminal (self-host, ex. **VT323** ou **IBM Plex Mono** — puxar os arquivos de fonte pro projeto, não depender de Google Fonts em runtime pra não quebrar o "PC offline dos anos 80").
- Mantém: React 19, Vite, react-router-dom, three.js (o `CrtOverlay.tsx` e o `.vhs-flicker` **já existentes são reaproveitados como base** — só ficam mais fortes/consistentes com o resto).

---

## 3. Modelo de dados novo (Prisma) — substitui TCG inteiro

Remove: `Card`, `Deck`, `DeckCard`, `Match` (versão TCG), `MatchMap`, `MapNode`, `FieldUnit`, `MatchMove`, `AiProfile`, `AiObservation` e todos os enums associados (`CardType`, `Route`, `SubrouteType`, `UnitStatus`, `MoveActionType`).
Mantém: `User`, `Role`.

```prisma
model User {
  id           String       @id @default(uuid())
  email        String       @unique
  passwordHash String
  role         Role         @default(PLAYER)
  matches      Invasion[]
  createdAt    DateTime     @default(now())
}

enum Role {
  ADMIN
  PLAYER
}

enum Language {
  JAVASCRIPT   // fácil
  TYPESCRIPT   // médio
  CSHARP       // difícil
  C            // extremo
}

enum ChallengeDifficulty {
  FACIL
  MEDIO
  DIFICIL
}

/** Entidade principal do CRUD da disciplina — catálogo de algoritmos, com
 * admin podendo criar/editar/remover (mesmo padrão de Card antigo). */
model Challenge {
  id            String              @id @default(uuid())
  language      Language
  difficulty    ChallengeDifficulty
  title         String
  prompt        String              // enunciado
  helpSignature String              // assinatura/esqueleto mostrado no modo ajuda
  starterCode   String              @default("")
  testCases     Json                // [{ input: string[], expectedOutput: string }]
  isBonus       Boolean             @default(false) // true = desafio extra que desbloqueia powerup
  points        Int                 @default(10)
  createdAt     DateTime            @default(now())
  attempts      ChallengeAttempt[]

  @@index([language, difficulty])
}

model Invasion {
  id                String         @id @default(uuid())
  playerId          String
  player            User           @relation(fields: [playerId], references: [id])
  language          Language
  status            InvasionStatus @default(EM_ANDAMENTO)
  currentLayer      Int            @default(1) // 1..5
  playerIntegrity   Int            @default(100) // rede do jogador, 0-100
  rivalIntegrity    Int            @default(100) // rede da IA, 0-100
  rivalDisabledUntil DateTime?     // efeito de powerup "desconexão"
  winnerSide        InvasionWinner?
  score             Int            @default(0)
  startedAt         DateTime       @default(now())
  endedAt           DateTime?
  layers            InvasionLayer[]
  attempts          ChallengeAttempt[]
  chatMessages      ChatMessage[]
  powerUpUses       PowerUpUse[]
}

enum InvasionStatus {
  EM_ANDAMENTO
  FINALIZADA
}

enum InvasionWinner {
  PLAYER
  RIVAL
}

model InvasionLayer {
  id           String    @id @default(uuid())
  invasionId   String
  invasion     Invasion  @relation(fields: [invasionId], references: [id])
  layerNumber  Int       // 1..5
  challengeId  String
  challenge    Challenge @relation(fields: [challengeId], references: [id])
  clearedAt    DateTime?
  miniGameWon  Boolean?  // null = ainda não jogou o minigame da camada

  @@unique([invasionId, layerNumber])
}

model ChallengeAttempt {
  id          String    @id @default(uuid())
  invasionId  String
  invasion    Invasion  @relation(fields: [invasionId], references: [id])
  challengeId String
  challenge   Challenge @relation(fields: [challengeId], references: [id])
  code        String
  passed      Boolean
  judgeOutput String    @default("")
  createdAt   DateTime  @default(now())
}

model ChatMessage {
  id         String    @id @default(uuid())
  invasionId String
  invasion   Invasion  @relation(fields: [invasionId], references: [id])
  sender     ChatSender
  content    String
  createdAt  DateTime  @default(now())
}

enum ChatSender {
  PLAYER
  RIVAL_AI
}

model PowerUpUse {
  id         String     @id @default(uuid())
  invasionId String
  invasion   Invasion   @relation(fields: [invasionId], references: [id])
  type       PowerUpType
  usedAt     DateTime   @default(now())
}

enum PowerUpType {
  PROPAGANDA   // "propaganda no computador do rival" — atrapalha a IA por N segundos
  DESCONEXAO   // derruba a rede rival por N segundos
}
```

Relacionamentos cumprindo o requisito de "tabelas com relacionamento": `User 1:N Invasion`, `Invasion 1:N InvasionLayer`, `InvasionLayer N:1 Challenge`, `Invasion 1:N ChallengeAttempt`, `Invasion 1:N ChatMessage`, `Invasion 1:N PowerUpUse`.

`Challenge` é a **entidade principal do CRUD** (rota REST completa: GET lista/por id, POST, PUT, DELETE — igual ao padrão já existente em `cardController`/`cardRoutes`/`cardValidator`, só trocando o schema).

---

## 4. Arquitetura backend — serviços novos (camada `services/`, mesmo padrão de hoje)

Remove inteiro: `services/engine/*`, `services/card/*`, `services/deck/*`, `services/match/*` (e os controllers/routes/repositories/validators correspondentes).

Novo:
- **`services/challenge/challengeService.ts`** — CRUD do catálogo + `pickForLayer(language, layerNumber)` (sorteia challenge não-bônus compatível com a dificuldade da camada: camadas 1-2 → FACIL, 3-4 → MEDIO, 5 → DIFICIL).
- **`services/judge/pistonClient.ts`** — wrapper HTTP pra `POST https://emkc.org/api/v2/piston/execute`; mapeia `Language` do Prisma pro `language`/`version` que a Piston espera (**confirmar via `GET /api/v2/piston/runtimes` na implementação** — nomes prováveis: `javascript`/node, `typescript`/deno ou ts-node conforme runtime disponível, `csharp`/mono ou dotnet, `c`/gcc).
- **`services/judge/judgeService.ts`** — recebe `(challenge, code)`, roda cada `testCase` via Piston, compara stdout normalizado (trim) com `expectedOutput`, retorna `{ passed, output, failedCase? }`. Timeout curto (Piston já limita), trata erro de compilação como falha com mensagem clara (400-like, não 500).
- **`services/invasion/invasionService.ts`** — orquestra o `Invasion`: `start(userId, language)` (cria as 5 `InvasionLayer` sorteando challenges), `submitCode(invasionId, code)` (chama judge, atualiza integridade/score, dispara evento de socket, aciona `aiChatService` pra reação), `usePowerUp`, `finish`.
- **`services/invasion/rivalPacingService.ts`** — simula o ritmo da IA "resolvendo" as próprias camadas: timer por camada calibrado (ex.: distribuição aleatória em torno de um tempo-alvo competitivo, ajustável), pausável pelos powerups (`rivalDisabledUntil`). Não gera código de verdade — só o ritmo/avanço, mantendo o jogo "vencível".
- **`services/ai/aiChatService.ts`** — monta o prompt de sistema (persona "hacker rival", tom trash-talk leve, reage a: código correto do jogador derrubando firewall, powerup usado nele, camada perdida por ele) e chama a API da Claude (`@anthropic-ai/sdk`, modelo rápido tipo `claude-haiku-*`) pra gerar 1 frase curta por evento. Cache/fallback: se a API falhar (rede, rate limit), usa uma linha pré-escrita genérica em vez de quebrar a partida.
- **`realtime/invasionGateway.ts`** — namespace do Socket.IO, uma "room" por `invasionId`. Eventos: `chat:message`, `network:update`, `layer:cleared`, `layer:minigame-result`, `powerup:used`, `match:finished`, `ai:typing`.

Mantém como está: `services/auth/authService.ts`, todos os middlewares, `config/`.

---

## 5. Rotas REST novas

- `GET/POST/PUT/DELETE /challenges` — CRUD completo (ADMIN pra escrita, mesmo padrão de `requireRole('ADMIN')` do card antigo), `GET /challenges?language=&difficulty=` pra filtro.
- `POST /invasions` — inicia partida `{ language }` → cria `Invasion` + 5 `InvasionLayer`.
- `GET /invasions/:id` — estado atual (integridade, camada, layers, histórico de chat recente).
- `POST /invasions/:id/submit` — `{ code }` → roda o judge na camada atual, retorna resultado (e também emite via socket pra quem estiver na room).
- `POST /invasions/:id/minigame-result` — `{ won }` → registra resultado do minigame da camada, libera avanço se `won`.
- `POST /invasions/:id/powerup` — `{ type }` → valida que o jogador desbloqueou (resolveu challenge bônus suficiente) e aplica o efeito.
- Swagger atualizado (mesmo padrão `@openapi` já usado em `authRoutes`/`cardRoutes`).

---

## 6. Frontend — fluxo completo de telas

Reaproveita integralmente `CrtOverlay.tsx` (shader de tubo já reforçado) e a animação `.vhs-flicker` já existente em `index.css` — a base VHS/CRT já está pronta, só estender pro resto das telas.

1. **Landing** (`/`) — reescreve o texto pra estilo terminal/VHS explicando o jogo (linhas tipo boot log/manifesto), botão "Jogar" no canto superior **e** no hero (mesmo padrão que já existe hoje) → leva pro login.
2. **Login** (`/login`) — card central grande, estética terminal (prompt `>`, campos email/senha como inputs de linha de comando), reaproveita `login`/`register` já existentes em `api/auth.ts`. Ao autenticar com sucesso: animação de "TV de tubo ligando" (flash branco + colapso vertical→expansão, dá pra fazer com um uniform novo no shader do `CrtOverlay` disparado por um evento, ou com uma camada CSS por cima) antes de navegar pra home.
3. **Home** (`/app`) — botões **New Game / Achievements / Credits / Options**, mesmo tamanho, **sem** arredondamento, fonte de terminal, logo 2x maior que o tamanho atual e um pouco mais acima. (Achievements/Credits já existem como stub — Options é novo, pode ficar stub também por enquan- não fazia parte do pedido core.)
4. **Seleção de linguagem** (`/new-game`) — 4 opções (JS fácil / TS médio / C# difícil / C extremo), toggle "modo ajuda".
5. **Boot cutscene** (`/invasion/:id/boot`) — log de boot falso digitando linha a linha, termina em `bem-vindo <usuário>` antes de entrar na gameplay.
6. **Gameplay** (`/invasion/:id`) — a tela principal, estruturada como "desktop":
   - **Taskbar fixa no rodapé** com 3 botões: Terminal / Rede / Chat. Só uma "janela" ativa por vez — abrir uma minimiza a outra, com animação de abrir/fechar (scale+fade tipo Windows 3.1, CSS keyframes, reaproveita a ideia que já existia em `RetroTaskbar.tsx`, que hoje está desativado no `App.tsx` — **reativar e adaptar**, não recriar do zero).
   - **Mapa 8-bit** (Canvas) ao fundo, mostrando a rede sendo invadida (visual simples, grid + ícones, nada 3D — aprende com o erro do mapa 3D anterior).
   - **Janela Terminal**: input de código (textarea estilizada, sem editor pesado tipo Monaco — mantém leve), botão "Executar", saída colorida (verde = passou, vermelho = erro/saída errada), mensagem temática ao passar ("FIREWALL_NORTE.exe derrubado").
   - **Janela Rede**: número grande (verde se ≥50%, vermelho se <50%) + barra logo abaixo, pros dois lados (jogador/rival).
   - **Chat**: drop-up/pop-up no rodapé (não modal bloqueante — o jogo continua rodando atrás), mensagens da IA chegando via socket, visual de terminal de chat (estilo ICQ/IRC retrô).
   - **Modo ajuda**: popup com a assinatura/hint (`Challenge.helpSignature`) renderizada em `<canvas>` (texto não fica no DOM → impossível selecionar/copiar de verdade, então nem precisa de gambiarra de bloquear `Ctrl+C`).
   - **Powerups**: barra com os 2 tipos, desbloqueiam ao resolver challenge `isBonus`, uso dispara evento de socket que afeta o `rivalPacingService` no backend.
   - **Minigame overlay**: ao limpar uma camada, abre o `js-dos` (Doom/Wolfenstein shareware) em overlay; vencer fecha e libera a próxima camada; perder deixa retentar o minigame (a camada de código já fica salva como resolvida).
7. **Resultado** (`/invasion/:id/result`) — aba com pontuação, resumo (camadas, tempo, powerups usados) e botão voltar ao menu.

**Cursor**: `cursor: url('/cursors/retro-arrow.svg') 0 0, auto;` global dentro do contexto de jogo (landing pra frente) — pixel-art de seta de CRT antigo (asset novo, SVG simples pixelado).

---

## 7. Conteúdo — os 160 algoritmos

25 fáceis + 10 médios + 5 difíceis por linguagem × 4 linguagens (JS, TS, C#, C) = 160 `Challenge` no seed (`prisma/seed.ts`, substitui o seed de cartas atual). Vou escrever eu mesmo, baseado na documentação oficial de cada linguagem (MDN pra JS/TS, docs da Microsoft pra C#, cppreference/man pages pra C), cobrindo fundamentos progressivos por dificuldade: fácil = laços/condicionais/strings/arrays básicos; médio = recursão, estruturas de dados simples, ordenação; difícil = manipulação de ponteiros/memória (C), generics/LINQ (C#), problemas de composição um pouco mais longos. Cada `Challenge` inclui `testCases` reais que vou validar rodando contra a Piston antes de fechar o seed (pra garantir que gabarito bate com o esperado).

Dado o volume (160 itens com enunciado + testes + hint), vou construir isso em lotes por linguagem dentro do seed, começando por JavaScript (mais simples de validar) e replicando o padrão pras outras três.

---

## 8. Ordem de implementação

Sem corte de escopo, mas em ordem de dependência (cada item destrava o próximo):

1. Backend: schema Prisma novo + migration, `.env` novo (`ANTHROPIC_API_KEY`, `PISTON_URL`), remoção do domínio TCG antigo (controllers/routes/services/repositories/validators de card/deck/match/engine).
2. Backend: `pistonClient` + `judgeService` (validar contra `/runtimes` de verdade, testar 1 execução por linguagem).
3. Backend: `challengeService` + rotas `/challenges` (CRUD) + seed com o primeiro lote (JS completo) pra já ter algo ponta-a-ponta testável.
4. Backend: `invasionService` + rotas `/invasions` (sem socket ainda, só REST síncrono) — partida jogável via Swagger/curl.
5. Backend: Socket.IO (`invasionGateway`) + `rivalPacingService` — tempo real entra em cena.
6. Backend: `aiChatService` (Claude) plugado no gateway.
7. Frontend: fundação visual (fonte de terminal, cursor, extensão do CRT/VHS) + Landing/Login/Home reescritos.
8. Frontend: fluxo de seleção de linguagem + boot cutscene.
9. Frontend: tela de gameplay (taskbar, terminal, rede, chat, modo ajuda, powerups) ligada à API REST.
10. Frontend: Socket.IO client ligado (chat/rede ao vivo).
11. Frontend: integração js-dos (minigames) — valida acesso de rede pro asset/CDN primeiro; se bloqueado, documentar fallback.
12. Conteúdo: completar os 160 challenges (TS, C#, C) + seed final.
13. Polish: animações de janela, tela de resultado, Swagger final, checklist de deploy.

---

## 9. Verificação

- Backend: `npm run build` (tsc) limpo, `npx prisma migrate dev` aplicando sem erro, teste manual via Swagger (`/docs`) de cada rota nova, teste de execução real via Piston pras 4 linguagens (1 exemplo cada, sucesso e falha proposital).
- Frontend: `tsc -b`, `eslint`, `vite build`, e verificação visual em navegador (headless screenshot, como já vem sendo feito nas mudanças anteriores) de cada tela nova.
- Ponta a ponta: criar partida, resolver 1 challenge de verdade em JS, ver integridade da rede mudar, ver mensagem da IA chegar no chat, ver minigame abrir ao limpar a camada.
