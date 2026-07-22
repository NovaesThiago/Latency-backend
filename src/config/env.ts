import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3333),
  corsOrigin: required('CORS_ORIGIN', 'http://localhost:5173'),
  jwtSecret: required('JWT_SECRET'),
  judge0Url: required('JUDGE0_URL', 'https://ce.judge0.com'),
  /** Opcional: sem a chave, o aiChatService cai no fallback de falas pré-escritas. */
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
};
