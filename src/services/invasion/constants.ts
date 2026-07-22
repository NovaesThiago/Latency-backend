export const LAYER_COUNT = 5;
export const DAMAGE_PER_LAYER = Math.ceil(100 / LAYER_COUNT);

/** Ritmo da IA rival — faixa de tempo (ms) entre cada "camada resolvida" dela.
 * Calibrado pra ser competitivo com um jogador humano tentando os desafios,
 * não instantâneo nem eterno. */
export const RIVAL_TICK_MIN_MS = Number(process.env.RIVAL_TICK_MIN_MS ?? 15_000);
export const RIVAL_TICK_MAX_MS = Number(process.env.RIVAL_TICK_MAX_MS ?? 35_000);
