-- Add publisher field to Comic
ALTER TABLE "Comic" ADD COLUMN IF NOT EXISTS "publisher" TEXT;
