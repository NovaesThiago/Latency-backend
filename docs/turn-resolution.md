# Decisão de ordem de resolução de turno

Levantado pelo Conselho (Cético) antes de implementar `turn-resolver.ts`: o formato de `FieldUnit` e `MatchMove` depende de como o servidor resolve ações e colisões dentro de um mesmo turno. Decisão registrada aqui antes do código, para não ficar implícita apenas na implementação.

## Estrutura do turno

- Cada `Match` alterna turnos entre `player1` e `player2` (ou CPU). Um turno pertence a um único jogador.
- Dentro do seu turno, o jogador pode realizar **uma ação por chamada de API** (`invocar`, `mover` ou `feitiço`), cada uma virando uma linha em `MatchMove` com o `turnNumber` atual. O jogador encerra o turno explicitamente (`PASSAR_TURNO`) ou ao esgotar a energia disponível.
- Não há ações simultâneas entre os dois jogadores — a colisão relevante é entre uma unidade que está se movendo agora e unidades já presentes no tabuleiro (do turno anterior do adversário).

## Ordem de resolução ao final de cada ação de movimento

1. **Movimento é aplicado primeiro**: a unidade tem `currentNodeId` atualizado para o nó de destino.
2. **Combate é resolvido no nó de destino, não antes**: se após o movimento o nó de destino contém unidades de dois `ownerId` diferentes, todas trocam dano **simultaneamente** (dano aplicado com base no HP/ATK do início da resolução, não em cascata) — evita que a ordem de iteração determine quem "ataca primeiro".
3. **Remoção de mortos**: unidades com `hp <= 0` após o passo 2 têm `status = MORTA` e saem do nó.
4. **Checagem de chegada ao core**: se, após os passos 2–3, uma unidade sobrevivente estiver no último nó da rota (posição do core inimigo), aplica-se dano ao core do adversário.
5. **Evolução (`turnsInPosition`)**: só é incrementada para unidades que **não** se moveram neste turno; toda unidade que se move tem `turnsInPosition` zerada (regra já descrita na seção 4.3 do plano).

## Por que isso importa para o schema

- `MatchMove.payload` guarda o resultado da resolução (dano aplicado, unidades mortas, core atingido) — não apenas a intenção da ação — para permitir replay/depuração sem reprocessar o estado.
- `FieldUnit.turnsInPosition` só faz sentido com a regra acima fixada: sem ela, seria ambíguo se mover "conta" no turno em que a evolução seria concedida.
- Combate simultâneo (passo 2) é o motivo de `FieldUnit.hp`/`atk` serem lidos antes de qualquer escrita — o `turn-resolver` calcula todos os danos com base no snapshot do início da resolução antes de persistir.
