# Plano de Projeto — Ciberguerra

Projeto avaliativo da disciplina **Programação para Internet II**. Jogo web de estratégia por turnos (TCG + xadrez + MOBA) com tema de ciberguerra (hackers vs. firewalls), servido por uma API REST completa.

> ⚠️ **Ação imediata antes de tudo:** confirmar no SUAP a data exata de entrega e apresentação. Este plano assume prazo "normal" de disciplina (poucas semanas); se o prazo real for curto, ir direto para a seção **11.3 — Plano B / Cortes de Escopo**.

---

## 1. Visão Geral

**Nome:** Ciberguerra
**Gênero:** TCG tático por turnos com tabuleiro (rotas/subrotas), tema de segurança/ataque cibernético.
**Squad:** até 2 alunos.
**Stack:**
- Backend: Node.js + TypeScript + Express + Prisma ORM
- Banco: PostgreSQL (Neon)
- Frontend: HTML/CSS/JS (ou React/Vite) hospedado no Vercel
- Auth: JWT (`jsonwebtoken` + `bcrypt`)
- Validação: Zod
- Documentação de rotas: Swagger (`swagger-jsdoc` + `swagger-ui-express`)
- Deploy: Render (backend) + Vercel (frontend) + Neon (Postgres)

---

## 2. Requisitos da Disciplina → Onde Aparecem no Projeto

| Requisito do professor | Como o Ciberguerra atende |
|---|---|
| Arquitetura organizada (MVC/camadas) | `routes/controllers/services/repositories/middlewares` — ver seção 6 |
| `.env` para segredos | `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN` |
| API REST com entidade principal + CRUD | `Card` (CRUD completo de cartas), `Deck`, `Match` |
| Rotas documentadas | Swagger em `/docs` |
| Banco relacional com relacionamentos | Postgres via Prisma — `User`↔`Deck`↔`Card` (N:N), `Match`↔`FieldUnit`↔`MapNode` |
| Validação de entrada + erros padronizados | Zod nos DTOs + middleware central de erro `{status, message}` |
| Login/registro + JWT | `AuthService` com bcrypt + jsonwebtoken |
| Níveis de acesso (opcional) | `role: ADMIN | PLAYER` — admin cadastra/balanceia cartas |

---

## 3. Lore e Tema — Ciberguerra

Universo: uma guerra digital entre sistemas. Cada jogador controla uma rede que tenta invadir o `Servidor Core` do adversário.

**Categorias de carta:**
- **Unidades (avançam pelo tabuleiro):** `Worm`, `Bot`, `Trojan`, `Ransomware`, `Exploit` (move padrão tipo cavalo de xadrez — "pula" 2 casas)
- **Estruturas (fixas, defendem uma casa):** `Firewall`, `Honeypot`, `IDS` (Intrusion Detection System)
- **Feitiços (efeito instantâneo):** `DDoS` (dano em área numa rota), `Patch` (cura/remove efeito negativo), `Rollback` (desfaz avanço de 1 unidade inimiga)

**Cartas exemplo (para popular o seed inicial do banco):**

| Nome | Tipo | Ataque | Vida | Movimento/Efeito |
|---|---|---|---|---|
| Worm | Unidade | 2 | 4 | Avança 1 casa/turno |
| Exploit | Unidade | 4 | 2 | Avança 2 casas/turno (salta bloqueios simples) |
| Ransomware | Unidade | 6 | 3 | Avança 1 casa, dano dobrado contra Estruturas |
| Firewall | Estrutura | 0 | 8 | Bloqueia avanço; reduz ataque de quem colidir em -2 |
| Honeypot | Estrutura | 1 | 3 | Ao ser destruída, aplica "lentidão" (-1 movimento por 2 turnos) no atacante |
| DDoS | Feitiço | 3 (área) | — | Dano em todas as unidades de 1 subrota |
| Patch | Feitiço | — | +3 | Cura uma unidade aliada |

---

## 4. Mecânica de Jogo

### 4.1 Tabuleiro
- 3 rotas principais: `Firewall Norte`, `Núcleo Central`, `Backdoor Sul`.
- Cada rota tem 1–2 subrotas que se reencontram antes do core inimigo (ex.: `Servidor de Treinamento` — mais lenta, dá XP por turno parado; `Túnel Direto` — mais rápida, sem bônus).
- Cada subrota é uma sequência de **posições** (nós) numeradas da base do jogador até a base do adversário.

### 4.2 Turnos
1. Cada jogador recebe energia por turno (ex.: +1 até um teto).
2. Jogador pode: invocar unidade (gasta energia = custo da carta), mover unidade já em campo, usar feitiço.
3. Ao fim do turno, o servidor resolve: movimento automático de unidades não movidas manualmente (se a regra escolhida for "avanço automático"), combates (unidades que se encontram na mesma posição trocam dano), e verifica: unidade chegou ao core inimigo? → dano ao core. Core chegou a 0? → fim de jogo.

### 4.3 Evolução ("upar")
- Cada `FieldUnit` tem `turnos_na_posicao`.
- Se ficar **X turnos seguidos** numa subrota de treinamento sem se mover: `nivel += 1`, ganha bônus de atributo (curva definida em `Card.evolucao_curva`, ex.: JSON `{ "2": {"atk": +1, "hp": +2}, "3": {"atk": +2, "hp": +3, "unlock": "auto_replicar"} }`).
- Se a unidade for movida antes de completar X turnos, `turnos_na_posicao` reseta para 0 (perde o progresso). **Essa é a regra de negócio central para o requisito de validação/erro do professor** — tentar mover uma unidade morta, fora de turno, ou destino inválido retorna 400 com mensagem clara.

---

## 5. Modelo de Dados

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  role         Role     @default(PLAYER)
  decks        Deck[]
  createdAt    DateTime @default(now())
}

enum Role {
  ADMIN
  PLAYER
}

model Card {
  id             String   @id @default(uuid())
  name           String
  type           CardType
  baseAtk        Int
  baseHp         Int
  cost           Int
  movePattern    Json     // ex.: {"tipo": "linear", "distancia": 1}
  evolucaoCurva  Json     // ex.: {"2": {"atk":1,"hp":2}, "3": {...}}
  deckCards      DeckCard[]
}

enum CardType {
  UNIDADE
  ESTRUTURA
  FEITICO
}

model Deck {
  id       String     @id @default(uuid())
  name     String
  userId   String
  user     User       @relation(fields: [userId], references: [id])
  cards    DeckCard[]
}

model DeckCard {
  deckId String
  cardId String
  qty    Int    @default(1)
  deck   Deck   @relation(fields: [deckId], references: [id])
  card   Card   @relation(fields: [cardId], references: [id])

  @@id([deckId, cardId])
}

model Match {
  id          String      @id @default(uuid())
  player1Id   String
  player2Id   String?     // null se for contra CPU
  isVsCpu     Boolean     @default(false)
  winnerId    String?
  status      MatchStatus @default(EM_ANDAMENTO)
  startedAt   DateTime    @default(now())
  endedAt     DateTime?
  map         MatchMap?
  units       FieldUnit[]
  moves       MatchMove[]
  aiProfile   AiProfile?
}

enum MatchStatus {
  EM_ANDAMENTO
  FINALIZADA
}

model MatchMap {
  id        String    @id @default(uuid())
  matchId   String    @unique
  match     Match     @relation(fields: [matchId], references: [id])
  templateId String   // qual template-base foi sorteado
  seed      String    // permite regenerar/depurar deterministicamente
  nodes     MapNode[]
  createdAt DateTime  @default(now())
}

model MapNode {
  id            String   @id @default(uuid())
  matchMapId    String
  matchMap      MatchMap @relation(fields: [matchMapId], references: [id])
  route         Route
  subrouteType  SubrouteType
  positionIndex Int
  connections   Json     // ids dos nós vizinhos (grafo de adjacência)
  units         FieldUnit[]
}

enum Route {
  NORTE
  CENTRAL
  SUL
}

enum SubrouteType {
  TREINAMENTO
  DIRETA
}

model FieldUnit {
  id               String   @id @default(uuid())
  matchId          String
  match            Match    @relation(fields: [matchId], references: [id])
  ownerId          String
  cardId           String
  currentNodeId    String
  currentNode      MapNode  @relation(fields: [currentNodeId], references: [id])
  hp               Int
  atk              Int
  level            Int      @default(1)
  turnsInPosition  Int      @default(0)
  status           UnitStatus @default(VIVA)
}

enum UnitStatus {
  VIVA
  MORTA
}

model MatchMove {
  id         String   @id @default(uuid())
  matchId    String
  match      Match    @relation(fields: [matchId], references: [id])
  turnNumber Int
  unitId     String?
  fromNodeId String?
  toNodeId   String?
  actionType MoveActionType
  payload    Json
  createdAt  DateTime @default(now())
}

enum MoveActionType {
  INVOCAR
  MOVER
  FEITICO
  PASSAR_TURNO
}

model AiProfile {
  id              String   @id @default(uuid())
  matchId         String   @unique
  match           Match    @relation(fields: [matchId], references: [id])
  observations    AiObservation[]
}

model AiObservation {
  id              String   @id @default(uuid())
  aiProfileId     String
  aiProfile       AiProfile @relation(fields: [aiProfileId], references: [id])
  turnNumber      Int
  featureSnapshot Json     // {"agressividade": 0.7, "rotaPreferida": "NORTE", "freqTreino": 0.2}
  createdAt       DateTime @default(now())
}
```

**Observação de design (Arquiteto):** o mapa **não é serializado como blob** — ele é gerado a partir de uma `seed` + template determinístico e persistido como nós materializados (`MapNode`), permitindo consultas relacionais e replay/depuração.

---

## 6. Arquitetura do Backend

```
src/
  routes/              # só binding HTTP → controller
  controllers/         # parse request, chama service, formata response
  services/
    auth/              # login, registro, JWT
    card/              # CRUD de cartas
    deck/              # CRUD de decks
    match/
      match-service.ts # orquestra o turno (chama o engine)
    engine/            # ★ núcleo do jogo — pure logic, sem Express/HTTP, testável isoladamente
      map-generator.ts # geração procedural (seed + template)
      turn-resolver.ts # valida movimento, resolve combate
      evolution.ts     # regra de "upar" unidade
      ai/
        strategy.ts     # decide a jogada da CPU (utility-based scoring)
        adaptation.ts   # lê AiObservation e ajusta pesos de decisão
  repositories/         # Prisma isolado aqui — nunca chamado direto do controller
  middlewares/          # auth (JWT), errorHandler, validate(zodSchema)
  validators/           # schemas Zod por rota
  config/               # env, prisma client, cors
prisma/schema.prisma
.env.example
README.md
```

**Regra de ouro:** controller nunca conhece regra de jogo — só chama `matchService.resolveTurn(matchId, dto)`. Toda complexidade de domínio (grafo, IA, evolução) mora em `engine/`.

---

## 7. Geração Procedural de Mapa (abordagem viável)

Em vez de um gerador de grafo totalmente aleatório (arriscado — pode gerar mapa sem caminho até o core inimigo), usar:

1. **4–6 templates de mapa fixos** guardados como JSON (`MapTemplate`), cada um já desenhado e testado manualmente com as 3 rotas + subrotas, variando número de casas e posição das subrotas de treino.
2. Ao criar uma `Match`, sortear 1 template e opcionalmente embaralhar parâmetros dentro de faixas seguras (ex.: comprimento de uma subrota entre 3–5 casas, posição do bônus de XP dentro de um intervalo).
3. **Validação obrigatória pós-geração:** rodar BFS/DFS a partir da base de cada jogador confirmando que existe caminho até o core inimigo em todas as rotas antes de persistir o `MatchMap`. Se falhar, gerar novamente (fallback determinístico).

Isso cumpre "mapa não-linear e dinâmico" na prática (o jogador percebe variação a cada partida) sem o risco de gerar um mapa impossível de jogar — risco real apontado pelo Cético.

---

## 8. IA do Oponente (CPU "adaptativa")

**Importante para a apresentação:** tratar isso tecnicamente como o que é — um **sistema de regras ponderadas (utility-based AI)**, não machine learning. É honesto, defensável numa arguição, e evita a armadilha de prometer "IA que aprende" sem conseguir explicar como isso é validado.

**Como funciona:**
1. A cada jogada do jogador humano, o backend registra em `AiObservation` um `featureSnapshot`: taxa de jogadas agressivas vs. defensivas, rota preferida, frequência de uso de subrotas de treino.
2. A cada N turnos, a CPU recalcula um "perfil" do oponente (ex.: 70% agressivo → prioriza reforçar defesa/Firewall; 70% defensivo → CPU avança mais agressivamente).
3. A decisão da CPU em cada turno é um **score ponderado** por ação candidata (invocar aqui, mover ali, usar feitiço) — os pesos são ajustados pelo perfil calculado.

Isso dá a sensação de "a CPU está reagindo ao meu estilo" sem exigir treinamento de modelo, dataset ou infraestrutura de ML — e é honesto de descrever como "heurística adaptativa baseada em histórico de jogadas" no relatório/slides.

---

## 9. Frontend

### 9.1 Estrutura
- Repositório separado do backend, deploy no Vercel.
- Landing page inicial (você vai trazer referências visuais separadamente — reservar este espaço no repo: `src/pages/Landing/`).
- Tela de login/registro (`src/pages/Auth/`).
- Tela de tabuleiro/partida (`src/pages/Match/`) — renderiza rotas/subrotas, unidades, animações de movimento e combate via CSS transitions/keyframes a partir do diff de estado retornado pela API a cada jogada.

### 9.2 Variáveis de ambiente do frontend
```
VITE_API_URL=https://<seu-backend>.onrender.com
```

---

## 10. Deploy (Render + Vercel + Neon)

### 10.1 Neon (Postgres)
- Criar projeto, copiar connection string.
- Adicionar `?sslmode=require` na `DATABASE_URL`.
- Configurar Prisma com connection pooling (Neon fornece uma connection string "pooled" — usar essa no `DATABASE_URL` de produção para evitar estourar limite de conexões do free tier).

### 10.2 Render (backend)
- `.env` de produção: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN` (URL exata do Vercel, não `*`).
- **Atenção ao cold start:** free tier "dorme" após inatividade — primeira requisição pode levar 30–50s. Antes da apresentação, fazer uma requisição de "aquecimento" alguns minutos antes de começar.

### 10.3 Vercel (frontend)
- `.env`: `VITE_API_URL` apontando para o domínio do Render.
- Build padrão do framework escolhido (Vite/CRA/Next).

### 10.4 CORS
- Backend deve configurar `origin` explícito = domínio do Vercel (importante se o JWT for enviado via header `Authorization`, não cookie).

---

## 11. Roadmap por Fases

### 11.1 Fase 1 — Fundação (o que garante a nota, fazer primeiro e bem feito)
- [ ] Setup do repositório (backend + frontend separados), `.env`, estrutura de pastas
- [ ] Modelo `User` + Auth (registro, login, JWT, bcrypt)
- [ ] Modelo `Card` com CRUD completo + validação Zod + Swagger
- [ ] Middleware de erro padronizado (400/401/404/500)
- [ ] Deploy inicial (Render + Vercel + Neon) já funcionando com o CRUD básico — validar a esteira de deploy cedo, não no fim

### 11.2 Fase 2 — Núcleo do jogo (versão simples primeiro)
- [ ] Modelo `Deck`/`DeckCard`, `Match`, 1 rota simples (sem subrotas ainda)
- [ ] `turn-resolver.ts`: invocar unidade, mover, resolver combate
- [ ] Frontend: tela de tabuleiro jogável (sem estética ainda), landing page provisória, tela de login

### 11.3 Fase 3 — Mecânicas avançadas
- [ ] Subrotas + sistema de evolução (`turnsInPosition`, `level`)
- [ ] 3 rotas completas
- [ ] Geração procedural via templates (seção 7) + validação de conectividade

### 11.4 Fase 4 — IA e polish
- [ ] `AiObservation` + `strategy.ts` (heurística adaptativa, seção 8)
- [ ] Landing page com identidade visual final (referências que você vai trazer)
- [ ] Animações de movimento/combate no tabuleiro
- [ ] Testar cold start do Render antes da apresentação

### 11.5 Plano B — Cortes de Escopo (se o prazo real for curto)
Ordem de corte (primeiro a cair, sem afetar nota dos requisitos obrigatórios):
1. IA adaptativa → vira bot com regras fixas simples (documentar como tal, sem prometer "adaptação")
2. Geração procedural dinâmica → vira seed fixa por partida + poucos templates pré-validados manualmente
3. 3 rotas com subrotas → reduzir para 1–2 rotas sem subrotas
4. Landing page elaborada → tela única simples e decente

**Nunca cortar:** CRUD completo, relacionamentos no banco, JWT, `.env`, validação e tratamento de erro — são os itens que valem nota diretamente pelos critérios do professor.

---

## 12. Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Prazo real no SUAP menor que o assumido aqui | Confirmar hoje; se curto, ir direto ao Plano B (11.5) |
| Mapa procedural gerar rota sem caminho até o core | Validação BFS/DFS obrigatória pós-geração antes de persistir |
| IA "adaptativa" questionada tecnicamente na banca | Descrever honestamente como heurística ponderada, não ML — evita parecer over-promise |
| Cold start do Render travando a demo ao vivo | Aquecer a API alguns minutos antes da apresentação |
| Neon free tier estourando conexões | Usar connection string com pooling do Neon |
| `.env`/segredos vazando no GitHub | `.gitignore` configurado antes do primeiro commit; usar `.env.example` sem valores reais |
| CORS bloqueando frontend em produção | `origin` explícito (domínio Vercel), nunca `*`, especialmente com JWT em header |

---

## 13. Checklist Final Antes da Entrega
- [ ] Data de entrega/apresentação confirmada no SUAP
- [ ] Repositório com README.md (setup, rotas, print do modelo de dados)
- [ ] `.env.example` sem segredos reais
- [ ] Swagger acessível em produção (`/docs`)
- [ ] Backend + frontend + banco funcionando em produção (não só local)
- [ ] Teste de "clone limpo": rodar o setup do zero em outra máquina/pasta um dia antes
- [ ] Requisição de aquecimento no Render antes da apresentação ao vivo
- [ ] Slides cobrindo: Contextualização, Metodologia, Desenvolvimento (dificuldades), Resultados (demo ao vivo)

---

## Notas do Conselho

- **Pragmatista:** mapa procedural não precisa de geração de grafo "de verdade" — templates sorteados + parâmetros embaralhados já cumprem o pedido com fração do esforço. IA "adaptativa" deve virar contadores simples + pesos, não ML.
- **Arquiteto:** isolar toda a lógica de jogo (mapa, turno, evolução, IA) numa camada `engine/` pura, fora de Express/Prisma direto — isso é o que permite testar e sustentar a complexidade sem virar bagunça nos controllers.
- **Cético:** o escopo atual é 5-10x maior que um CRUD de disciplina comum — a lógica de domínio (não os endpoints) é o que vai consumir o prazo. "IA que entende o estilo do oponente" é uma promessa de pesquisa; tratá-la como heurística documentada evita risco de parecer over-promise numa arguição técnica. Mapa procedural sem validação de conectividade é bug garantido, não possível. Plano B com cortes definidos agora é obrigatório dado que o prazo ainda não está confirmado.
