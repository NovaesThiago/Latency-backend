-- Adiciona nickname ao User: nullable primeiro, faz backfill de qualquer
-- linha existente (usa o prefixo do email + parte do id, garantindo
-- unicidade), depois trava como NOT NULL + UNIQUE. Evita quebrar em
-- ambientes com dados de teste já cadastrados.
ALTER TABLE "User" ADD COLUMN "nickname" TEXT;

UPDATE "User"
SET "nickname" = split_part("email", '@', 1) || '_' || substr("id"::text, 1, 6)
WHERE "nickname" IS NULL;

ALTER TABLE "User" ALTER COLUMN "nickname" SET NOT NULL;

CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");
