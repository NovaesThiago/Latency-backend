/**
 * Catálogo canônico dos 40 algoritmos (25 fáceis + 10 médios + 5 difíceis).
 * Prompt e testCases são os mesmos nas 4 linguagens — só o `helpSignature`/
 * `starterCode` (ver signatures.ts) muda por linguagem. Isso evita repetir
 * enunciado e casos de teste 4x e garante que as 4 linguagens ensinam
 * exatamente os mesmos 40 fundamentos.
 *
 * Convenção de I/O: cada `input` é uma lista de linhas (join('\n') antes de
 * mandar pro Judge0). Saídas booleanas usam "sim"/"nao" (nunca true/false)
 * pra não depender de convenção de capitalização de cada linguagem.
 */

export type Difficulty = 'FACIL' | 'MEDIO' | 'DIFICIL';

export interface TestCase {
  input: string[];
  expectedOutput: string;
}

export interface ProblemDef {
  difficulty: Difficulty;
  title: string;
  prompt: string;
  testCases: TestCase[];
  isBonus: boolean;
  points: number;
}

export const PROBLEMS: ProblemDef[] = [
  // ───────────────────────── FÁCIL (25) ─────────────────────────
  {
    difficulty: 'FACIL',
    title: 'Soma de dois números',
    prompt: 'Leia dois inteiros de stdin (uma linha cada) e imprima a soma.',
    testCases: [
      { input: ['2', '3'], expectedOutput: '5' },
      { input: ['-1', '1'], expectedOutput: '0' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Subtração de dois números',
    prompt: 'Leia dois inteiros A e B (uma linha cada) e imprima A - B.',
    testCases: [
      { input: ['5', '3'], expectedOutput: '2' },
      { input: ['2', '5'], expectedOutput: '-3' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Multiplicação de dois números',
    prompt: 'Leia dois inteiros (uma linha cada) e imprima o produto.',
    testCases: [
      { input: ['4', '3'], expectedOutput: '12' },
      { input: ['-2', '5'], expectedOutput: '-10' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Divisão inteira e resto',
    prompt: 'Leia dois inteiros A e B (uma linha cada) e imprima "quociente resto" (divisão inteira de A por B), separados por um espaço.',
    testCases: [
      { input: ['17', '5'], expectedOutput: '3 2' },
      { input: ['9', '3'], expectedOutput: '3 0' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Maior de dois números',
    prompt: 'Leia dois inteiros (uma linha cada) e imprima o maior deles.',
    testCases: [
      { input: ['7', '3'], expectedOutput: '7' },
      { input: ['2', '9'], expectedOutput: '9' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Maior de três números',
    prompt: 'Leia três inteiros (uma linha cada) e imprima o maior deles.',
    testCases: [
      { input: ['4', '9', '2'], expectedOutput: '9' },
      { input: ['7', '7', '3'], expectedOutput: '7' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Par ou ímpar',
    prompt: 'Leia um inteiro N e imprima "par" se for par, ou "impar" se for ímpar.',
    testCases: [
      { input: ['4'], expectedOutput: 'par' },
      { input: ['7'], expectedOutput: 'impar' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Positivo, negativo ou zero',
    prompt: 'Leia um inteiro N e imprima "positivo", "negativo" ou "zero" conforme o sinal de N.',
    testCases: [
      { input: ['5'], expectedOutput: 'positivo' },
      { input: ['-4'], expectedOutput: 'negativo' },
      { input: ['0'], expectedOutput: 'zero' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Tabuada de um número',
    prompt:
      'Leia um inteiro N e imprima sua tabuada de 1 a 10, uma linha por multiplicação, no formato exato "N x i = resultado" (ex.: "3 x 1 = 3").',
    testCases: [
      {
        input: ['3'],
        expectedOutput: ['3 x 1 = 3', '3 x 2 = 6', '3 x 3 = 9', '3 x 4 = 12', '3 x 5 = 15', '3 x 6 = 18', '3 x 7 = 21', '3 x 8 = 24', '3 x 9 = 27', '3 x 10 = 30'].join('\n'),
      },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Contagem regressiva',
    prompt: 'Leia um inteiro N e imprima os números de N até 1, em ordem decrescente, um por linha.',
    testCases: [{ input: ['4'], expectedOutput: ['4', '3', '2', '1'].join('\n') }],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Soma de 1 até N',
    prompt: 'Leia um inteiro N e imprima a soma de todos os inteiros de 1 até N.',
    testCases: [
      { input: ['5'], expectedOutput: '15' },
      { input: ['10'], expectedOutput: '55' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Fatorial iterativo',
    prompt: 'Leia um inteiro N (N >= 0) e imprima N! (fatorial), calculado com um laço (não recursão).',
    testCases: [
      { input: ['5'], expectedOutput: '120' },
      { input: ['0'], expectedOutput: '1' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Inverter uma string',
    prompt: 'Leia uma string (uma linha) e imprima ela invertida.',
    testCases: [
      { input: ['latency'], expectedOutput: 'ycnetal' },
      { input: ['abc'], expectedOutput: 'cba' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: '[BÔNUS] Contar vogais',
    prompt: 'Leia uma string e imprima quantas vogais ela contém.',
    testCases: [{ input: ['latency'], expectedOutput: '3' }],
    isBonus: true,
    points: 15,
  },
  {
    difficulty: 'FACIL',
    title: 'Número primo',
    prompt: 'Leia um inteiro N (N >= 2) e imprima "primo" se N for primo, ou "nao primo" caso contrário.',
    testCases: [
      { input: ['13'], expectedOutput: 'primo' },
      { input: ['15'], expectedOutput: 'nao primo' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Maior elemento de um array',
    prompt:
      'Leia um inteiro N (quantidade de elementos) e, na linha seguinte, N inteiros separados por espaço. Imprima o maior elemento.',
    testCases: [
      { input: ['4', '3 7 2 9'], expectedOutput: '9' },
      { input: ['3', '-5 -1 -9'], expectedOutput: '-1' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Somar elementos de um array',
    prompt:
      'Leia um inteiro N (quantidade de elementos) e, na linha seguinte, N inteiros separados por espaço. Imprima a soma de todos.',
    testCases: [
      { input: ['4', '1 2 3 4'], expectedOutput: '10' },
      { input: ['3', '5 5 5'], expectedOutput: '15' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Média de N números',
    prompt:
      'Leia um inteiro N e, na linha seguinte, N inteiros separados por espaço. Imprima a média, com exatamente 2 casas decimais (ex.: "5.00").',
    testCases: [
      { input: ['2', '4 6'], expectedOutput: '5.00' },
      { input: ['4', '1 2 3 4'], expectedOutput: '2.50' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Contar números pares em um array',
    prompt: 'Leia um inteiro N e, na linha seguinte, N inteiros separados por espaço. Imprima quantos são pares.',
    testCases: [
      { input: ['5', '1 2 3 4 5'], expectedOutput: '2' },
      { input: ['4', '2 4 6 8'], expectedOutput: '4' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Inverter um array',
    prompt:
      'Leia um inteiro N e, na linha seguinte, N inteiros separados por espaço. Imprima os elementos em ordem inversa, separados por espaço.',
    testCases: [
      { input: ['4', '1 2 3 4'], expectedOutput: '4 3 2 1' },
      { input: ['3', '7 8 9'], expectedOutput: '9 8 7' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Busca linear em um array',
    prompt:
      'Leia um inteiro N, na linha seguinte N inteiros separados por espaço, e por fim um inteiro alvo. Imprima "encontrado" se o alvo estiver no array, ou "nao encontrado" caso contrário.',
    testCases: [
      { input: ['4', '3 7 2 9', '7'], expectedOutput: 'encontrado' },
      { input: ['4', '3 7 2 9', '5'], expectedOutput: 'nao encontrado' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Concatenar duas strings',
    prompt: 'Leia duas strings (uma linha cada) e imprima a concatenação delas, sem espaço entre as duas.',
    testCases: [
      { input: ['lat', 'ency'], expectedOutput: 'latency' },
      { input: ['a', 'b'], expectedOutput: 'ab' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Comprimento de uma string',
    prompt: 'Leia uma string e imprima seu comprimento (número de caracteres).',
    testCases: [
      { input: ['latency'], expectedOutput: '7' },
      { input: ['oi'], expectedOutput: '2' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Converter Celsius em Fahrenheit',
    prompt: 'Leia um inteiro representando graus Celsius e imprima o valor convertido em Fahrenheit (F = C * 9 / 5 + 32).',
    testCases: [
      { input: ['100'], expectedOutput: '212' },
      { input: ['0'], expectedOutput: '32' },
    ],
    isBonus: false,
    points: 10,
  },
  {
    difficulty: 'FACIL',
    title: 'Trocar valores de duas variáveis',
    prompt: 'Leia dois inteiros A e B (uma linha cada) e imprima "B A" (os dois valores trocados, separados por espaço).',
    testCases: [
      { input: ['3', '9'], expectedOutput: '9 3' },
      { input: ['1', '2'], expectedOutput: '2 1' },
    ],
    isBonus: false,
    points: 10,
  },

  // ───────────────────────── MÉDIO (10) ─────────────────────────
  {
    difficulty: 'MEDIO',
    title: 'Verificar palíndromo',
    prompt: 'Leia uma string e imprima "sim" se for palíndromo, "nao" caso contrário.',
    testCases: [
      { input: ['arara'], expectedOutput: 'sim' },
      { input: ['latency'], expectedOutput: 'nao' },
    ],
    isBonus: false,
    points: 20,
  },
  {
    difficulty: 'MEDIO',
    title: 'Ordenação (bubble sort)',
    prompt:
      'Leia um inteiro N e, na linha seguinte, N inteiros separados por espaço. Ordene em ordem crescente usando bubble sort e imprima o resultado separado por espaço.',
    testCases: [
      { input: ['5', '5 3 4 1 2'], expectedOutput: '1 2 3 4 5' },
      { input: ['4', '9 1 8 2'], expectedOutput: '1 2 8 9' },
    ],
    isBonus: false,
    points: 20,
  },
  {
    difficulty: 'MEDIO',
    title: 'Busca binária',
    prompt:
      'Leia um inteiro N, na linha seguinte N inteiros JÁ ORDENADOS de forma crescente e separados por espaço, e por fim um inteiro alvo. Usando busca binária, imprima o índice (base 0) do alvo no array, ou -1 se não existir.',
    testCases: [
      { input: ['5', '1 3 5 7 9', '7'], expectedOutput: '3' },
      { input: ['5', '1 3 5 7 9', '4'], expectedOutput: '-1' },
    ],
    isBonus: false,
    points: 20,
  },
  {
    difficulty: 'MEDIO',
    title: 'Máximo divisor comum (MDC)',
    prompt: 'Leia dois inteiros positivos A e B (uma linha cada) e imprima o MDC entre eles.',
    testCases: [
      { input: ['12', '18'], expectedOutput: '6' },
      { input: ['7', '13'], expectedOutput: '1' },
    ],
    isBonus: false,
    points: 20,
  },
  {
    difficulty: 'MEDIO',
    title: 'Mínimo múltiplo comum (MMC)',
    prompt: 'Leia dois inteiros positivos A e B (uma linha cada) e imprima o MMC entre eles.',
    testCases: [
      { input: ['4', '6'], expectedOutput: '12' },
      { input: ['5', '10'], expectedOutput: '10' },
    ],
    isBonus: false,
    points: 20,
  },
  {
    difficulty: 'MEDIO',
    title: 'Contar dígitos de um número',
    prompt: 'Leia um inteiro positivo N e imprima quantos dígitos ele tem.',
    testCases: [
      { input: ['12345'], expectedOutput: '5' },
      { input: ['7'], expectedOutput: '1' },
    ],
    isBonus: false,
    points: 20,
  },
  {
    difficulty: 'MEDIO',
    title: 'Soma dos dígitos de um número',
    prompt: 'Leia um inteiro positivo N e imprima a soma dos seus dígitos.',
    testCases: [
      { input: ['1234'], expectedOutput: '10' },
      { input: ['9'], expectedOutput: '9' },
    ],
    isBonus: false,
    points: 20,
  },
  {
    difficulty: 'MEDIO',
    title: 'Reverter um número inteiro',
    prompt: 'Leia um inteiro positivo N e imprima seus dígitos invertidos, como número (sem zeros à esquerda no resultado).',
    testCases: [
      { input: ['123'], expectedOutput: '321' },
      { input: ['100'], expectedOutput: '1' },
    ],
    isBonus: false,
    points: 20,
  },
  {
    difficulty: 'MEDIO',
    title: 'Sequência de Fibonacci (N termos)',
    prompt:
      'Leia um inteiro N (N >= 1) e imprima os N primeiros termos da sequência de Fibonacci (começando em 0, 1, 1, 2, 3, ...), separados por espaço.',
    testCases: [
      { input: ['5'], expectedOutput: '0 1 1 2 3' },
      { input: ['8'], expectedOutput: '0 1 1 2 3 5 8 13' },
    ],
    isBonus: false,
    points: 20,
  },
  {
    difficulty: 'MEDIO',
    title: 'Verificar anagrama',
    prompt: 'Leia duas strings (uma linha cada) e imprima "sim" se uma for anagrama da outra, "nao" caso contrário.',
    testCases: [
      { input: ['roma', 'amor'], expectedOutput: 'sim' },
      { input: ['teste', 'testes'], expectedOutput: 'nao' },
    ],
    isBonus: false,
    points: 20,
  },

  // ───────────────────────── DIFÍCIL (5) ─────────────────────────
  {
    difficulty: 'DIFICIL',
    title: 'Fibonacci recursivo',
    prompt: 'Leia um inteiro N e imprima o N-ésimo termo da sequência de Fibonacci (F(0)=0, F(1)=1), calculado com recursão.',
    testCases: [
      { input: ['10'], expectedOutput: '55' },
      { input: ['1'], expectedOutput: '1' },
    ],
    isBonus: false,
    points: 30,
  },
  {
    difficulty: 'DIFICIL',
    title: 'Torre de Hanói',
    prompt:
      'Leia um inteiro N (número de discos). Resolva a Torre de Hanói movendo os discos da torre "A" para a torre "C" (usando "B" como auxiliar), com recursão. Imprima cada movimento, um por linha, no formato exato "origem -> destino" (ex.: "A -> C"), na ordem em que os movimentos acontecem.',
    testCases: [{ input: ['2'], expectedOutput: ['A -> B', 'A -> C', 'B -> C'].join('\n') }],
    isBonus: false,
    points: 30,
  },
  {
    difficulty: 'DIFICIL',
    title: 'Ordenação (quicksort)',
    prompt:
      'Leia um inteiro N e, na linha seguinte, N inteiros separados por espaço. Ordene em ordem crescente usando o algoritmo quicksort (particionamento recursivo) e imprima o resultado separado por espaço.',
    testCases: [
      { input: ['6', '5 3 8 1 9 2'], expectedOutput: '1 2 3 5 8 9' },
      { input: ['4', '4 4 1 3'], expectedOutput: '1 3 4 4' },
    ],
    isBonus: false,
    points: 30,
  },
  {
    difficulty: 'DIFICIL',
    title: 'Crivo de Eratóstenes',
    prompt:
      'Leia um inteiro N e, usando o Crivo de Eratóstenes, imprima todos os números primos de 2 até N (inclusive), em ordem crescente e separados por espaço.',
    testCases: [{ input: ['20'], expectedOutput: '2 3 5 7 11 13 17 19' }],
    isBonus: false,
    points: 30,
  },
  {
    difficulty: 'DIFICIL',
    title: 'Frequência de caracteres',
    prompt:
      'Leia uma string sem espaços. Para cada caractere distinto, na ordem em que ele aparece pela primeira vez na string, imprima "caractere:quantidade". Separe os pares por um único espaço (ex.: "b:1 a:3 n:2").',
    testCases: [{ input: ['banana'], expectedOutput: 'b:1 a:3 n:2' }],
    isBonus: false,
    points: 30,
  },
];
