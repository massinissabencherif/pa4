-- CreateEnum
CREATE TYPE "ArcadeGame" AS ENUM ('COMICDLE', 'COVER_MYSTERY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ArcadeRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "game" "ArcadeGame" NOT NULL,
    "dateKey" TEXT,
    "state" JSONB NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArcadeRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArcadeRun_userId_game_idx" ON "ArcadeRun"("userId", "game");

-- CreateIndex
CREATE INDEX "ArcadeRun_game_dateKey_idx" ON "ArcadeRun"("game", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "ArcadeRun_userId_game_dateKey_key" ON "ArcadeRun"("userId", "game", "dateKey");

-- AddForeignKey
ALTER TABLE "ArcadeRun" ADD CONSTRAINT "ArcadeRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "RefreshToken_token_key" RENAME TO "RefreshToken_tokenHash_key";
