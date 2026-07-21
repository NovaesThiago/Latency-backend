-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('EM_ANDAMENTO', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "Route" AS ENUM ('NORTE', 'CENTRAL', 'SUL');

-- CreateEnum
CREATE TYPE "SubrouteType" AS ENUM ('TREINAMENTO', 'DIRETA');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('VIVA', 'MORTA');

-- CreateEnum
CREATE TYPE "MoveActionType" AS ENUM ('INVOCAR', 'MOVER', 'FEITICO', 'PASSAR_TURNO');

-- CreateTable
CREATE TABLE "Deck" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeckCard" (
    "deckId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "DeckCard_pkey" PRIMARY KEY ("deckId","cardId")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT,
    "isVsCpu" BOOLEAN NOT NULL DEFAULT false,
    "winnerId" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchMap" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapNode" (
    "id" TEXT NOT NULL,
    "matchMapId" TEXT NOT NULL,
    "route" "Route" NOT NULL,
    "subrouteType" "SubrouteType" NOT NULL,
    "positionIndex" INTEGER NOT NULL,
    "connections" JSONB NOT NULL,

    CONSTRAINT "MapNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldUnit" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "currentNodeId" TEXT NOT NULL,
    "hp" INTEGER NOT NULL,
    "atk" INTEGER NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "turnsInPosition" INTEGER NOT NULL DEFAULT 0,
    "status" "UnitStatus" NOT NULL DEFAULT 'VIVA',

    CONSTRAINT "FieldUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchMove" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "turnNumber" INTEGER NOT NULL,
    "unitId" TEXT,
    "fromNodeId" TEXT,
    "toNodeId" TEXT,
    "actionType" "MoveActionType" NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchMove_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchMap_matchId_key" ON "MatchMap"("matchId");

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchMap" ADD CONSTRAINT "MatchMap_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapNode" ADD CONSTRAINT "MapNode_matchMapId_fkey" FOREIGN KEY ("matchMapId") REFERENCES "MatchMap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldUnit" ADD CONSTRAINT "FieldUnit_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldUnit" ADD CONSTRAINT "FieldUnit_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldUnit" ADD CONSTRAINT "FieldUnit_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldUnit" ADD CONSTRAINT "FieldUnit_currentNodeId_fkey" FOREIGN KEY ("currentNodeId") REFERENCES "MapNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchMove" ADD CONSTRAINT "MatchMove_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
