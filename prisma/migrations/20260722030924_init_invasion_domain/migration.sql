-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PLAYER');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('JAVASCRIPT', 'TYPESCRIPT', 'CSHARP', 'C');

-- CreateEnum
CREATE TYPE "ChallengeDifficulty" AS ENUM ('FACIL', 'MEDIO', 'DIFICIL');

-- CreateEnum
CREATE TYPE "InvasionStatus" AS ENUM ('EM_ANDAMENTO', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "InvasionWinner" AS ENUM ('PLAYER', 'RIVAL');

-- CreateEnum
CREATE TYPE "ChatSender" AS ENUM ('PLAYER', 'RIVAL_AI');

-- CreateEnum
CREATE TYPE "PowerUpType" AS ENUM ('PROPAGANDA', 'DESCONEXAO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "difficulty" "ChallengeDifficulty" NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "helpSignature" TEXT NOT NULL,
    "starterCode" TEXT NOT NULL DEFAULT '',
    "testCases" JSONB NOT NULL,
    "isBonus" BOOLEAN NOT NULL DEFAULT false,
    "points" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invasion" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "status" "InvasionStatus" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "currentLayer" INTEGER NOT NULL DEFAULT 1,
    "playerIntegrity" INTEGER NOT NULL DEFAULT 100,
    "rivalIntegrity" INTEGER NOT NULL DEFAULT 100,
    "rivalDisabledUntil" TIMESTAMP(3),
    "winnerSide" "InvasionWinner",
    "score" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Invasion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvasionLayer" (
    "id" TEXT NOT NULL,
    "invasionId" TEXT NOT NULL,
    "layerNumber" INTEGER NOT NULL,
    "challengeId" TEXT NOT NULL,
    "clearedAt" TIMESTAMP(3),
    "miniGameWon" BOOLEAN,

    CONSTRAINT "InvasionLayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeAttempt" (
    "id" TEXT NOT NULL,
    "invasionId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "judgeOutput" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChallengeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "invasionId" TEXT NOT NULL,
    "sender" "ChatSender" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PowerUpUse" (
    "id" TEXT NOT NULL,
    "invasionId" TEXT NOT NULL,
    "type" "PowerUpType" NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PowerUpUse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Challenge_language_difficulty_idx" ON "Challenge"("language", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "InvasionLayer_invasionId_layerNumber_key" ON "InvasionLayer"("invasionId", "layerNumber");

-- AddForeignKey
ALTER TABLE "Invasion" ADD CONSTRAINT "Invasion_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvasionLayer" ADD CONSTRAINT "InvasionLayer_invasionId_fkey" FOREIGN KEY ("invasionId") REFERENCES "Invasion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvasionLayer" ADD CONSTRAINT "InvasionLayer_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeAttempt" ADD CONSTRAINT "ChallengeAttempt_invasionId_fkey" FOREIGN KEY ("invasionId") REFERENCES "Invasion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChallengeAttempt" ADD CONSTRAINT "ChallengeAttempt_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_invasionId_fkey" FOREIGN KEY ("invasionId") REFERENCES "Invasion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PowerUpUse" ADD CONSTRAINT "PowerUpUse_invasionId_fkey" FOREIGN KEY ("invasionId") REFERENCES "Invasion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
