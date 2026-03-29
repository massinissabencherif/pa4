-- CreateIndex
CREATE INDEX "Comment_reviewId_idx" ON "Comment"("reviewId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE INDEX "List_userId_idx" ON "List"("userId");

-- CreateIndex
CREATE INDEX "ReadingEntry_userId_idx" ON "ReadingEntry"("userId");

-- CreateIndex
CREATE INDEX "ReadingEntry_userId_status_idx" ON "ReadingEntry"("userId", "status");

-- CreateIndex
CREATE INDEX "Review_comicId_idx" ON "Review"("comicId");
