-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('UNIDADE', 'ESTRUTURA', 'FEITICO');

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CardType" NOT NULL,
    "baseAtk" INTEGER NOT NULL,
    "baseHp" INTEGER NOT NULL,
    "cost" INTEGER NOT NULL,
    "movePattern" JSONB NOT NULL,
    "evolucaoCurva" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);
