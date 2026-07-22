-- CreateTable
CREATE TABLE "AssistantSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantQuery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssistantQuery_userId_idx" ON "AssistantQuery"("userId");

-- CreateIndex
CREATE INDEX "AssistantQuery_createdAt_idx" ON "AssistantQuery"("createdAt");

-- AddForeignKey
ALTER TABLE "AssistantQuery" ADD CONSTRAINT "AssistantQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
