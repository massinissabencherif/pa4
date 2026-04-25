CREATE TABLE "ReviewLike" (
  "userId"    TEXT NOT NULL,
  "reviewId"  TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReviewLike_pkey" PRIMARY KEY ("userId", "reviewId")
);

CREATE INDEX "ReviewLike_reviewId_idx" ON "ReviewLike"("reviewId");
CREATE INDEX "ReviewLike_userId_idx"   ON "ReviewLike"("userId");

ALTER TABLE "ReviewLike"
  ADD CONSTRAINT "ReviewLike_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewLike"
  ADD CONSTRAINT "ReviewLike_reviewId_fkey"
  FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
