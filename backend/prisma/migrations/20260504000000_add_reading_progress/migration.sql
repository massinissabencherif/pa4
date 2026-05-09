-- Add reading progress fields to ReadingEntry
ALTER TABLE "ReadingEntry" ADD COLUMN "currentPage" INTEGER;
ALTER TABLE "ReadingEntry" ADD COLUMN "totalPages" INTEGER;
ALTER TABLE "ReadingEntry" ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ReadingEntry" ADD COLUMN "lastReadAt" TIMESTAMP(3);
