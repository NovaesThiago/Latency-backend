import { Language, Prisma, PrismaClient } from '@prisma/client';
import { PROBLEMS } from './seedData/problems';
import { SIGNATURES } from './seedData/signatures';

const prisma = new PrismaClient();

const LANGUAGES: Language[] = ['JAVASCRIPT', 'TYPESCRIPT', 'CSHARP', 'C'];

/**
 * Catálogo completo: 40 algoritmos (25 fáceis + 10 médios + 5 difíceis) × 4
 * linguagens = 160 `Challenge`. Prompt/testCases vêm de `PROBLEMS` (iguais
 * nas 4 linguagens); só o `helpSignature` muda, vindo de `SIGNATURES`.
 * Id determinístico (`${language}-${índice}`) faz do upsert idempotente
 * mesmo se o enunciado de um desafio for reescrito depois.
 */
async function main() {
  let count = 0;

  for (const language of LANGUAGES) {
    const signatures = SIGNATURES[language];

    for (const [index, problem] of PROBLEMS.entries()) {
      const id = `${language}-${String(index).padStart(2, '0')}`;
      const data = {
        language,
        difficulty: problem.difficulty,
        title: problem.title,
        prompt: problem.prompt,
        helpSignature: signatures[index],
        starterCode: '',
        testCases: problem.testCases as unknown as Prisma.InputJsonValue,
        isBonus: problem.isBonus,
        points: problem.points,
      };

      await prisma.challenge.upsert({
        where: { id },
        create: { id, ...data },
        update: data,
      });
      count += 1;
    }
  }

  console.log(`Catálogo semeado: ${count} desafios (${PROBLEMS.length} algoritmos × ${LANGUAGES.length} linguagens).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
