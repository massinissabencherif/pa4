-- CreateTable: Author
CREATE TABLE "Author" (
    "id"       TEXT NOT NULL,
    "name"     TEXT NOT NULL,
    "slug"     TEXT NOT NULL,
    "bio"      TEXT,
    "photoUrl" TEXT,
    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AuthorOnComic
CREATE TABLE "AuthorOnComic" (
    "authorId" TEXT NOT NULL,
    "comicId"  TEXT NOT NULL,
    CONSTRAINT "AuthorOnComic_pkey" PRIMARY KEY ("authorId","comicId")
);

-- CreateTable: UserBadge
CREATE TABLE "UserBadge" (
    "id"       TEXT NOT NULL,
    "userId"   TEXT NOT NULL,
    "badgeKey" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Author_slug_key" ON "Author"("slug");
CREATE INDEX "Author_slug_idx" ON "Author"("slug");
CREATE UNIQUE INDEX "UserBadge_userId_badgeKey_key" ON "UserBadge"("userId", "badgeKey");
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- AddForeignKey
ALTER TABLE "AuthorOnComic" ADD CONSTRAINT "AuthorOnComic_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthorOnComic" ADD CONSTRAINT "AuthorOnComic_comicId_fkey"  FOREIGN KEY ("comicId")  REFERENCES "Comic"("id")  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBadge"     ADD CONSTRAINT "UserBadge_userId_fkey"       FOREIGN KEY ("userId")    REFERENCES "User"("id")   ON DELETE CASCADE ON UPDATE CASCADE;
