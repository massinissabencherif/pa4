-- CreateTable
CREATE TABLE "FeaturedComic" (
    "id" TEXT NOT NULL,
    "comicId" TEXT NOT NULL,
    "blurb" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeaturedComic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeaturedComic_startAt_idx" ON "FeaturedComic"("startAt");

-- AddForeignKey
ALTER TABLE "FeaturedComic" ADD CONSTRAINT "FeaturedComic_comicId_fkey" FOREIGN KEY ("comicId") REFERENCES "Comic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "RefreshToken_token_key" RENAME TO "RefreshToken_tokenHash_key";
