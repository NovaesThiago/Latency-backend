import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Catálogo temático (seção do usuário: "personagens de guerra como ataques
 * cibernéticos"). Cada carta reaproveita um arquétipo militar clássico
 * remapeado para uma ameaça de rede real, com estatísticas que refletem o
 * papel tático (infantaria, flanqueador, tanque, artilharia, etc.).
 */
const CARDS = [
  {
    name: 'Worm',
    description:
      'Um verme que se replica pela rede e avança devagar, mas sem parar — a infantaria da ciberguerra, barata e numerosa.',
    type: 'UNIDADE' as const,
    baseAtk: 2,
    baseHp: 5,
    cost: 2,
    staminaGrant: 0,
    movePattern: { tipo: 'linear', distancia: 1 },
    evolucaoCurva: { '3': { atk: 1, hp: 1 } },
  },
  {
    name: 'Exploit 0-Day',
    description:
      'Uma vulnerabilidade ainda não corrigida, explorada antes que qualquer defesa reaja — o flanqueador veloz e frágil da guerra digital.',
    type: 'UNIDADE' as const,
    baseAtk: 5,
    baseHp: 2,
    cost: 3,
    staminaGrant: 0,
    movePattern: { tipo: 'linear', distancia: 2 },
    evolucaoCurva: { '2': { atk: 1 } },
  },
  {
    name: 'Ransomware',
    description:
      'Malware pesado que sequestra sistemas inteiros e resiste a contra-ataques — o tanque de cerco da ciberguerra, lento porém devastador.',
    type: 'UNIDADE' as const,
    baseAtk: 6,
    baseHp: 6,
    cost: 5,
    staminaGrant: 0,
    movePattern: { tipo: 'linear', distancia: 1 },
    evolucaoCurva: { '3': { atk: 2, hp: 2 } },
  },
  {
    name: 'Firewall Sentinela',
    description:
      'Uma barreira de inspeção de pacotes que absorve ataques sem ceder posição — o guardião defensivo, alta resistência e pouco dano.',
    type: 'UNIDADE' as const,
    baseAtk: 1,
    baseHp: 10,
    cost: 4,
    staminaGrant: 0,
    movePattern: { tipo: 'linear', distancia: 1 },
    evolucaoCurva: { '4': { hp: 3 } },
  },
  {
    name: 'Honeypot',
    description:
      'Uma isca disfarçada de alvo fácil que atrai e desgasta o invasor — a armadilha barata que qualquer exército de rede carrega.',
    type: 'UNIDADE' as const,
    baseAtk: 1,
    baseHp: 3,
    cost: 2,
    staminaGrant: 0,
    movePattern: { tipo: 'linear', distancia: 1 },
    evolucaoCurva: {},
  },
  {
    name: 'Ataque DDoS',
    description:
      'Uma saturação coordenada de tráfego que derruba qualquer coisa em seu caminho — a artilharia de altíssimo dano e vida frágil.',
    type: 'UNIDADE' as const,
    baseAtk: 8,
    baseHp: 1,
    cost: 4,
    staminaGrant: 0,
    movePattern: { tipo: 'linear', distancia: 1 },
    evolucaoCurva: {},
  },
  {
    name: 'Patch Deployment Bot',
    description:
      'Um robô de implantação de correções que avança em formação organizada — o suporte tático, equilibrado entre ataque e resistência.',
    type: 'UNIDADE' as const,
    baseAtk: 3,
    baseHp: 5,
    cost: 3,
    staminaGrant: 0,
    movePattern: { tipo: 'linear', distancia: 1 },
    evolucaoCurva: { '3': { atk: 1, hp: 1 } },
  },
  {
    name: 'Cache de Energia',
    description:
      'Um nó de energia de reserva que recarrega seus sistemas — a carta de suprimento: não ataca, mas alimenta o resto do seu exército.',
    type: 'SUPRIMENTO' as const,
    baseAtk: 0,
    baseHp: 0,
    cost: 0,
    staminaGrant: 4,
    movePattern: {},
    evolucaoCurva: {},
  },
];

async function main() {
  for (const card of CARDS) {
    await prisma.card.upsert({
      where: { name: card.name },
      create: card,
      update: card,
    });
  }
  console.log(`Catálogo semeado: ${CARDS.length} cartas.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
