-- AlterTable: List — ajout du champ description optionnel
ALTER TABLE "List" ADD COLUMN "description" TEXT;

-- AlterTable: ListItem — ajout de la contrainte CASCADE sur suppression
ALTER TABLE "ListItem" DROP CONSTRAINT "ListItem_listId_fkey";
ALTER TABLE "ListItem" DROP CONSTRAINT "ListItem_comicId_fkey";
ALTER TABLE "ListItem" ADD CONSTRAINT "ListItem_listId_fkey"
  FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListItem" ADD CONSTRAINT "ListItem_comicId_fkey"
  FOREIGN KEY ("comicId") REFERENCES "Comic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: ReadingGuide
CREATE TABLE "ReadingGuide" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "character" TEXT NOT NULL,
    "imageUrl" TEXT,
    "teaser" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "relatedSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GuideComic
CREATE TABLE "GuideComic" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverUrl" TEXT,
    "comicUrl" TEXT,
    "note" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GuideComic_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GuideTopic
CREATE TABLE "GuideTopic" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GuideReply
CREATE TABLE "GuideReply" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReadingGuide_slug_key" ON "ReadingGuide"("slug");

-- CreateIndex
CREATE INDEX "GuideComic_guideId_idx" ON "GuideComic"("guideId");

-- CreateIndex
CREATE INDEX "GuideTopic_guideId_idx" ON "GuideTopic"("guideId");

-- CreateIndex
CREATE INDEX "GuideReply_topicId_idx" ON "GuideReply"("topicId");

-- CreateIndex
CREATE INDEX "GuideReply_parentId_idx" ON "GuideReply"("parentId");

-- AddForeignKey
ALTER TABLE "GuideComic" ADD CONSTRAINT "GuideComic_guideId_fkey"
  FOREIGN KEY ("guideId") REFERENCES "ReadingGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideTopic" ADD CONSTRAINT "GuideTopic_guideId_fkey"
  FOREIGN KEY ("guideId") REFERENCES "ReadingGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideTopic" ADD CONSTRAINT "GuideTopic_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideReply" ADD CONSTRAINT "GuideReply_topicId_fkey"
  FOREIGN KEY ("topicId") REFERENCES "GuideTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideReply" ADD CONSTRAINT "GuideReply_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "GuideReply"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "GuideReply" ADD CONSTRAINT "GuideReply_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
