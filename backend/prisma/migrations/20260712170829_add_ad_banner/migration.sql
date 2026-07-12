-- CreateEnum
CREATE TYPE "AdPlacement" AS ENUM ('HOME', 'COMIC_DETAIL', 'GUIDES_LIST', 'GUIDE_DETAIL');

-- CreateTable
CREATE TABLE "AdBanner" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "altText" TEXT NOT NULL,
    "placement" "AdPlacement" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdBanner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdBanner_placement_isActive_idx" ON "AdBanner"("placement", "isActive");
