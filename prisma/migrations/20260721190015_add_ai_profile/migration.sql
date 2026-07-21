-- CreateTable
CREATE TABLE "AiProfile" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,

    CONSTRAINT "AiProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiObservation" (
    "id" TEXT NOT NULL,
    "aiProfileId" TEXT NOT NULL,
    "turnNumber" INTEGER NOT NULL,
    "featureSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiProfile_matchId_key" ON "AiProfile"("matchId");

-- AddForeignKey
ALTER TABLE "AiProfile" ADD CONSTRAINT "AiProfile_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiObservation" ADD CONSTRAINT "AiObservation_aiProfileId_fkey" FOREIGN KEY ("aiProfileId") REFERENCES "AiProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
