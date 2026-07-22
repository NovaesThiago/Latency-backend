import type { Language } from '@prisma/client';
import { runSubmission } from './judge0Client';

export interface TestCase {
  input: string[];
  expectedOutput: string;
}

export interface JudgeVerdict {
  passed: boolean;
  message: string;
}

function normalize(output: string | null): string {
  return (output ?? '').trim().replace(/\r\n/g, '\n');
}

/** Roda o código do jogador contra cada testCase do desafio via Judge0. Para no
 * primeiro caso que falhar (erro de compilação, erro de execução ou saída
 * errada) e devolve uma mensagem pronta pro terminal do jogo. */
export async function judgeChallenge(
  language: Language,
  code: string,
  testCases: TestCase[],
): Promise<JudgeVerdict> {
  for (const [index, testCase] of testCases.entries()) {
    const stdin = testCase.input.join('\n');
    const result = await runSubmission(language, code, stdin);

    if (result.statusId === 6) {
      return { passed: false, message: `Erro de compilação:\n${result.compileOutput ?? result.message ?? 'erro desconhecido'}` };
    }
    if (result.statusId !== 3) {
      return {
        passed: false,
        message: `Execução falhou (caso ${index + 1}): ${result.statusDescription}\n${result.stderr ?? ''}`.trim(),
      };
    }
    if (normalize(result.stdout) !== normalize(testCase.expectedOutput)) {
      return {
        passed: false,
        message: `Caso ${index + 1} falhou.\nEsperado: ${testCase.expectedOutput}\nRecebido: ${normalize(result.stdout)}`,
      };
    }
  }

  return { passed: true, message: `Todos os ${testCases.length} casos de teste passaram.` };
}
