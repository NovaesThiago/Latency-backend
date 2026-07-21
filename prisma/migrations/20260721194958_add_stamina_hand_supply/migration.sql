-- AlterEnum
ALTER TYPE "CardType" ADD VALUE 'SUPRIMENTO';

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "staminaGrant" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "player1DeckId" TEXT,
ADD COLUMN     "player1DrawPile" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "player1Hand" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "player1Stamina" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "player2Stamina" INTEGER NOT NULL DEFAULT 5;
