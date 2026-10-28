-- CreateTable
CREATE TABLE "UserAchievement" (
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("userId","code")
);

-- CreateTable
CREATE TABLE "AchievementStat" (
    "code" TEXT NOT NULL,
    "holders" INTEGER NOT NULL,
    "readers" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AchievementStat_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE INDEX "UserAchievement_code_idx" ON "UserAchievement"("code");

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
