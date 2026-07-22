import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env';

const client = env.anthropicApiKey ? new Anthropic({ apiKey: env.anthropicApiKey }) : null;

const SYSTEM_PROMPT = `Você é um hacker rival num jogo retro de "guerra de hackers" (estética anos 80,
terminal verde/preto, VHS). Você e o jogador estão competindo pra ver quem invade a rede do outro
primeiro, resolvendo desafios de programação. Responda SEMPRE com uma única linha curta (até ~120
caracteres), em português, tom confiante/trash-talk leve — nunca ofensivo de verdade, é só um jogo.
Nunca saia do personagem, nunca mencione que você é uma IA, um modelo de linguagem ou a Anthropic.`;

export type RivalEvent =
  | 'rival_layer_cleared'
  | 'player_layer_cleared'
  | 'powerup_used_on_rival'
  | 'match_lost'
  | 'match_won';

export interface RivalContext {
  event: RivalEvent;
  playerIntegrity: number;
  rivalIntegrity: number;
  layerNumber?: number;
}

const FALLBACK_LINES: Record<RivalEvent, string[]> = {
  rival_layer_cleared: ['mais um firewall seu caiu.', 'sua defesa é fraca, admita.', 'seguindo em frente pela sua rede...'],
  player_layer_cleared: ['nada mal... mas não vai bastar.', 'sorte de iniciante.', 'hm. você realmente sabe programar.'],
  powerup_used_on_rival: ['sério? isso não vai me atrasar por muito tempo.', 'jogando sujo, hein? adorei.'],
  match_lost: ['...não pode ser. até a próxima, hacker.', 'você venceu essa. impressionante.'],
  match_won: ['sua rede é minha agora.', 'game over pra você. fica pra próxima.'],
};

function fallback(event: RivalEvent): string {
  const lines = FALLBACK_LINES[event];
  return lines[Math.floor(Math.random() * lines.length)];
}

/** Gera 1 linha de chat do hacker rival via Claude; se a chave não estiver
 * configurada ou a chamada falhar, cai numa fala pré-escrita — a partida
 * nunca trava por causa da IA de chat. */
export async function generateRivalLine(ctx: RivalContext): Promise<string> {
  if (!client) return fallback(ctx.event);

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Evento: ${ctx.event}. Integridade da sua rede (rival): ${ctx.rivalIntegrity}%. Integridade da rede do jogador: ${ctx.playerIntegrity}%.${ctx.layerNumber ? ` Camada: ${ctx.layerNumber}.` : ''} Reaja em 1 linha.`,
        },
      ],
    });
    const block = response.content.find((b) => b.type === 'text');
    const text = block && block.type === 'text' ? block.text.trim() : '';
    return text || fallback(ctx.event);
  } catch (err) {
    console.error('aiChatService: falha ao chamar Claude, usando fallback', err);
    return fallback(ctx.event);
  }
}
