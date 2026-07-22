import { env } from '../../config/env';
import { Language } from '@prisma/client';

/**
 * IDs de linguagem da instância pública Judge0 CE (ce.judge0.com), confirmados
 * ao vivo em GET /languages na implementação. C# usa Mono (não .NET) — é o que
 * a instância pública oferece.
 */
const LANGUAGE_ID: Record<Language, number> = {
  JAVASCRIPT: 93, // Node.js 18.15.0
  TYPESCRIPT: 94, // TypeScript 5.0.3
  CSHARP: 51, // C# (Mono 6.6.0.161)
  C: 103, // C (GCC 14.1.0)
};

export interface Judge0Result {
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  message: string | null;
  statusId: number;
  statusDescription: string;
}

/**
 * A instância pública roda TypeScript sem @types/node, então `require` não
 * tipa — sem isso todo submit de TS quebraria em erro de compilação por um
 * detalhe do sandbox, não do código do jogador. Shim invisível pro jogador.
 */
const TS_REQUIRE_SHIM = 'declare const require: any;\n';

function prepareSource(language: Language, sourceCode: string): string {
  if (language === 'TYPESCRIPT' && !sourceCode.includes('declare const require')) {
    return TS_REQUIRE_SHIM + sourceCode;
  }
  return sourceCode;
}

/** Submissão síncrona (wait=true) — simples e suficiente pro tamanho dos
 * testes de cada desafio; sem necessidade de polling. */
export async function runSubmission(language: Language, sourceCode: string, stdin: string): Promise<Judge0Result> {
  const response = await fetch(`${env.judge0Url}/submissions?base64_encoded=false&wait=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language_id: LANGUAGE_ID[language],
      source_code: prepareSource(language, sourceCode),
      stdin,
    }),
  });

  if (!response.ok) {
    throw new Error(`Judge0 respondeu ${response.status} ao submeter código`);
  }

  const data = (await response.json()) as {
    stdout: string | null;
    stderr: string | null;
    compile_output: string | null;
    message: string | null;
    status: { id: number; description: string };
  };

  return {
    stdout: data.stdout,
    stderr: data.stderr,
    compileOutput: data.compile_output,
    message: data.message,
    statusId: data.status.id,
    statusDescription: data.status.description,
  };
}
